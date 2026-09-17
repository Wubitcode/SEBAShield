SEBAShield Firebase Structure
This document explains how SEBAShield currently uses Firebase Authentication and Cloud Firestore.
The Firebase layer is deliberately kept narrow in scope.
SEBAShield does not treat Firestore as the main home for rich scan history. Raw submitted content stays in encrypted local storage on the device, and only leaves temporarily when the user opts into AI analysis.

Firebase Services
SEBAShield currently relies on:
•	Firebase Authentication
•	Cloud Firestore
Supported sign-in methods:
•	anonymous authentication
•	email/password authentication
Firebase Authentication is what defines the identity boundary Firestore ownership is built on.

Authentication Model
SEBAShield tries to keep an authenticated Firebase identity active for as long as the app is running.
A user falls into one of two states:
Anonymous Firebase User
or:
Email / Password Firebase User
Either way, they get a Firebase UID, and that UID is what determines ownership of Firestore scan metadata.

Anonymous Authentication
Anonymous sign-in exists so someone can use cloud sync right away without being forced to set up an email/password account first.
App starts
    ↓
Firebase Authentication initializes
    ↓
Existing session available?
    │
    ├── Yes → restore Firebase user
    │
    └── No → create anonymous Firebase user
    ↓
UID available
An anonymous UID owns Firestore data through the exact same UID-scoped structure a permanent account uses.
That said, anonymous identities should be treated as temporary — if the identity itself is lost, there's no guarantee it can be recovered.

Anonymous-to-Permanent Account Upgrade
Turning an anonymous account into a permanent one just means linking an email/password credential onto the existing Firebase user.
Anonymous Firebase user
        ↓
Create email/password credential
        ↓
Link credential to current user
        ↓
Permanent email/password account
When this succeeds, the original Firebase UID sticks around unchanged — which matters, because it means existing Firestore records don't need to move.
Before upgrade:

users/
└── anonymousUid/
    └── scans/

After successful upgrade:

users/
└── sameUid/
    └── scans/
No data migration is needed, since the UID never changed.

Firestore Collection Structure
Scan metadata lives beneath the authenticated user in Firestore.
users/
└── {userId}/
    └── scans/
        └── {scanId}
Example:
users/
└── abc123FirebaseUid/
    └── scans/
        ├── scan-001
        ├── scan-002
        └── scan-003
The Firebase UID is the ownership line. The scan ID identifies the individual document inside that user's scans subcollection.

User Document
The users/{userId} path is reserved for whatever's tied to that identity itself.
Scan synchronization mostly happens one level down, at:
users/{userId}/scans/{scanId}
Sensitive raw scan history shouldn't be placed directly on the user document itself.

Firestore Scan Schema
What actually reaches Firestore is a privacy-minimized version of a scan, not the full local object.
A synced scan record can include:
id
ownerId
scanType
score
riskLevel
indicatorCodes
analyzerVersion
cloudSchemaVersion
createdAt
updatedAt
cloudSyncedAt
Not every optional timestamp is guaranteed to be present on every record.

Field Responsibilities
id
The scan's identifier — matches the Firestore document ID.
users/{uid}/scans/{id}

ownerId
The Firebase UID that owns this scan.
The Firestore repository overwrites this value with whoever is currently authenticated before syncing, so a stale or missing local owner value can't determine cloud ownership.

scanType
What kind of analysis this is:
•	message
•	link
•	fake job
The stored value follows whatever the app's scan model defines.

score
The numeric score from the deterministic local analyzer — just metadata, no original text attached.

riskLevel
The local risk classification — things like a safe/low-risk result, caution, suspicious, or high risk, depending on what the analyzer produced.

indicatorCodes
A trimmed list of standardized indicator identifiers.
Firestore stores these as codes, not the fuller free-text descriptions the local UI shows — this keeps useful metadata around in the cloud without persisting free text.

analyzerVersion
Which version of the local analyzer produced this result — useful for schema evolution down the line.

cloudSchemaVersion
Identifies which version of the minimized cloud format this record uses, so future migrations can tell old and new records apart.

createdAt
When the scan was originally created — used to order records when retrieving history.

updatedAt
An optional app-level update timestamp, present only when relevant.

cloudSyncedAt
A Firestore server-generated timestamp marking when sync happened — using the server's clock rather than the device's, so it's not dependent on the client being accurate.

Fields Intentionally Excluded from Firestore
The cloud record is never just a copy-paste of the full local object.
Deliberately left out:
raw submitted message
raw submitted URL
raw submitted job text
originalContent
content preview
free-text indicator descriptions
free-text recommendations
detailed analyzer text
AI summary
AI explanation
AI recommendations
local synchronization errors
encrypted local history
local encryption keys
Full local scan
      ↓
Cloud mapper
      ↓
Approved metadata allowlist
      ↓
Firestore
This mapping step is effectively where the privacy boundary lives.

Cloud Write Process
Here's what happens on a normal synced scan:
User submits content
      ↓
Local deterministic analysis
      ↓
Rich local scan record created
      ↓
Encrypted local storage
      ↓
Firebase UID available
      ↓
Cloud mapper creates reduced record
      ↓
Firestore write
The repository enforces:
id = current scan ID
ownerId = authenticated Firebase UID
and adds:
cloudSyncedAt = Firestore server timestamp
Only the reduced, approved record gets written — never the rich local object directly — which also keeps any older privacy-sensitive fields from accidentally carrying forward into the current schema.

Cloud Read Process
Reading pulls whatever scans belong to the currently authenticated UID.
Current Firebase UID
      ↓
users/{uid}/scans
      ↓
Read scan metadata
      ↓
Order by createdAt
      ↓
Map through approved cloud fields
      ↓
Application history
Cloud records aren't meant to stand in as full replacements for the local ones.

Local and Cloud History Merge
Local encrypted history and whatever Firestore metadata is available get combined in memory.
Encrypted local scans
        +
Current UID's Firestore metadata
        ↓
Merge by scan ID
        ↓
Combined history
When a scan exists in both places:
local rich record wins
— since the local copy is the one with everything the result/history screens actually need.
When a Firestore record has no matching local copy, it's shown as:
Cloud Record

Cloud-Only Records
A cloud-only record is Firestore metadata that exists without a matching device-local record.
This typically happens after:
Permanent email account
      ↓
Sign out
      ↓
Local encrypted history removed
      ↓
Later sign back in
      ↓
Firestore metadata retrieved
What can be shown:
•	scan type
•	score
•	risk level
•	date
•	other approved metadata
What's never rebuilt:
•	original message text
•	original URL
•	original job text
•	original content preview
•	detailed local recommendations
•	AI analysis text
A cloud-only entry should make it obvious that the original submitted content just isn't available on this device.

Cloud-Only Records Are In-Memory
Firestore metadata loaded for a cloud-only record doesn't get written back into local encrypted storage as if it were a real rich scan.
Firestore metadata
      ↓
In-memory Cloud Record
      ✕
No reconstruction of local raw history
This avoids:
•	inventing content that was never actually recovered
•	duplicate persistence
•	sync loops
•	confusing "metadata we have" with "full data we actually retained"

Firestore Security Rules
Access is meant to be strictly owner-only.
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn()
        && request.auth.uid == userId;
    }

    match /users/{userId} {

      allow create: if isOwner(userId)
        && request.resource.data.uid == userId;

      allow read, update, delete:
        if isOwner(userId);

      match /scans/{scanId} {

        allow create: if isOwner(userId)
          && request.resource.data.ownerId == userId
          && request.resource.data.id == scanId;

        allow read, delete:
          if isOwner(userId);

        allow update: if isOwner(userId)
          && resource.data.ownerId == userId
          && request.resource.data.ownerId == userId
          && request.resource.data.id == scanId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
The core guarantee here is simple:
request.auth.uid == userId
One Firebase user should never be able to reach into another user's scan collection.

Create Protection
Creating a scan requires all of:
request.auth.uid == userId
request.resource.data.ownerId == userId
request.resource.data.id == scanId
— so the document's own contents have to agree with who's actually authenticated.

Update Protection
An update requires the authenticated UID to own the parent user path, and it also requires both the record's existing and incoming ownership data to stay consistent with that UID:
existing ownerId == userId
incoming ownerId == userId
incoming id == scanId
This blocks an otherwise-allowed update from quietly reassigning a scan to someone else, or swapping out its document identity.

Read and Delete Protection
Both reads and deletes only go through when:
request.auth.uid == userId
The user path is what determines who's actually allowed in.

Default Deny
The last rule in the file:
match /{document=**} {
  allow read, write: if false;
}
acts as a catch-all denial for anything not explicitly covered above.

Synchronization Behavior
SEBAShield is built local-first — a scan that completes locally should stay useful even if Firestore sync doesn't work.
Local analysis succeeds
      ↓
Encrypted local save succeeds
      ↓
Firestore sync attempted
      │
      ├── Success → synchronized
      │
      └── Failure → local record retained for retry
A Firestore failure shouldn't turn a perfectly good local scan into a "failed" one from the user's perspective.

Pending Synchronization
Scans that got saved locally but haven't made it to Firestore yet stay eligible to sync later.
A retry pass can:
1.	find records still waiting on sync
2.	try writing each one
3.	track how many worked
4.	track how many didn't
5.	keep the failed ones around for the next retry
The approach here is intentionally conservative — a network hiccup doesn't cost the user their local record.

Individual Scan Deletion
Deleting a single scan is cloud-first:
Delete scan requested
      ↓
Verify Firebase Authentication
      ↓
Delete Firestore document
      ↓
Delete encrypted local record if present
      ↓
Refresh history
Applies whether the scan has both local and cloud copies, or is cloud-only. For a cloud-only record, there's simply nothing local to delete — that's fine as long as the Firestore delete itself went through.

Individual Delete Failure Policy
If auth isn't available, or the Firestore delete fails:
Cloud deletion not verified
      ↓
Local encrypted record preserved
      ↓
Error returned
      ↓
User can retry
The app deliberately avoids claiming a permanent delete succeeded when a cloud copy might still be sitting there.

Clear Scan History
Clear Scan History wipes the current user's whole scan history, cloud-first.
Verify authenticated Firebase UID
      ↓
Retrieve current user's cloud scans
      ↓
Delete Firestore scan 1
      ↓
Delete Firestore scan 2
      ↓
...
      ↓
All cloud deletions complete
      ↓
Clear encrypted local history
      ↓
Remove local encryption key
      ↓
Reset in-memory history

Clear Scan History Partial Failure
Since the cloud deletes happen one after another, a single failure partway through:
•	stops the rest of the sequence
•	leaves local encrypted history untouched
•	leaves the local encryption key untouched
•	surfaces as an error to the user
•	keeps whatever was already successfully deleted from Firestore, deleted
•	leaves the remaining Firestore records in place for a later retry
For example:
scan A → deleted
scan B → deleted
scan C → deletion fails
scan D → not attempted

Result:

A and B removed from Firestore
C and D remain in Firestore
encrypted local history remains intact
Retrying afterward is safe, since deleting something already deleted in Firestore doesn't error out. Local history only gets cleared once every single cloud deletion has actually gone through.
Permanent Account Sign-Out
Signing out of a permanent email/password account is meant to create a clean break between accounts.
Permanent Firebase account
      ↓
Clear encrypted local raw history
      ↓
Remove local history encryption key
      ↓
Firebase sign-out
      ↓
Create/restore fresh anonymous identity
That account's Firestore metadata isn't touched — it stays under its original UID. Signing back into that same account later lets its minimized cloud records load back in as Cloud Records.

Account Isolation
Cloud history always has to be fetched using whichever Firebase UID is currently active.
The app must never keep showing one account's cached cloud metadata after the authenticated identity has changed.
UID A
 ↓
Only users/UID-A/scans

UID B
 ↓
Only users/UID-B/scans
Switching identities means switching the entire Firestore scope.

Anonymous User Cloud Data
Anonymous users get real Firebase UIDs too, so they can absolutely have Firestore scan metadata.
But an anonymous identity isn't the same as a permanent account. If that identity is lost for good before it's upgraded or its records are deleted:
•	the user may no longer be able to sign back in as that UID
•	cloud metadata under that UID may become unreachable
•	there's no longer a way to self-delete that data through the app
Practically:
•	anyone who wants their account to survive should upgrade to email/password
•	anyone who just wants current data gone should run Clear Scan History while the anonymous identity is still working
A proper cleanup policy for abandoned anonymous Firebase data — retention limits, server-side sweeps, whatever form it takes — is still future work, not something built yet.

Firestore Retention

There's currently no automatic Firestore TTL policy in place.
So minimized scan metadata just sits there until it's removed through one of the app's own workflows, or through some other authorized administrative process.
Current self-service options:
•	deleting one scan
•	Clear Scan History
Any future automatic retention rule should be documented and tested before it's treated as live.

Firestore and AI Are Separate Data Flows
It's worth being clear that Firestore sync and AI analysis are two completely different pipelines.
Firestore receives
Privacy-minimized metadata:
scan ID
owner UID
scan type
score
risk level
indicator codes
versions
timestamps
AI analysis receives
For an optional inference request:
raw submitted content
scan type
sanitized local rule assessment
The Worker request also carries a scan request identifier, though the current Worker doesn't pass that identifier along to Workers AI.
So raw content does get transmitted — just for AI inference, never as part of what's stored in Firestore.
See docs/PrivacyModel.md for the full breakdown of these data flows.

Firebase Client Configuration

The app pulls its Firebase client configuration from Expo-compatible environment variables — things like:
API key
Auth domain
Project ID
Storage bucket
Messaging sender ID
App ID
Functions region
These values just identify which Firebase project the app talks to — they're not an authorization mechanism on their own.
Actual security comes from:
•	Firebase Authentication
•	Firestore Security Rules
•	backend Firebase ID-token verification, where relevant
Private server credentials should never end up in the mobile client, full stop.

Repository Boundaries
Firebase-related code is split across clear areas of the project:
src/
├── infrastructure/
│   └── firebase/
│       └── firebaseConfig.js
│
└── features/
    ├── authentication/
    │   ├── context/
    │   └── services/
    │
    └── scanning/
        ├── context/
        ├── models/
        ├── repositories/
        │   ├── firebaseScanRepository.js
        │   └── localScanRepository.js
        └── services/
            └── scanSyncService.js
What each piece is responsible for:
firebaseConfig.js
Spins up the Firebase services.
Authentication service/context
Handles Firebase identity and the account workflows around it.
scanModel.js
Defines what a scan record looks like, both locally and in its minimized cloud form.
firebaseScanRepository.js
Handles Firestore reads, writes, and deletes.
localScanRepository.js
Handles the encrypted local history.
scanSyncService.js
Coordinates getting local scans up to the cloud.
ScanContext.js
Ties everything together — scanning, history, sync, deletion, and presenting cloud history.

Current Firebase Security Principles

The architecture is built around these principles:
1.	Authenticate before touching the cloud.
2.	Use the Firebase UID as the ownership boundary.
3.	Keep Firestore leaner than local history.
4.	Never rely on the UI alone for authorization.
5.	Let Firestore Security Rules enforce ownership.
6.	Keep raw submitted content out of Firestore entirely.
7.	Use an explicit allowlist for what reaches the cloud.
8.	Do destructive operations cloud-first.
9.	Keep local history intact if cloud deletion can't be confirmed.
10.	Never rebuild raw content from cloud metadata.
11.	Assume anonymous identities might not be recoverable.
12.	Keep Firestore sync and optional AI inference as separate flows.

Summary
The Firebase structure, in short:
Firebase Authentication
        ↓
Authenticated UID
        ↓
users/{uid}/scans/{scanId}
        ↓
Privacy-minimized Firestore metadata
Rich scan history runs down its own separate path:
Raw submitted content
        ↓
Local deterministic analysis
        ↓
AES-256-GCM encrypted device-local history
And optional AI analysis runs down yet another separate path:
Raw submitted content
        ↓
Authenticated AI backend request
        ↓
Workers AI inference
Keeping these three things apart — identity, minimized cloud metadata, and encrypted local history — is the core idea behind SEBAShield's privacy architecture.
