# SEBAShield Privacy Model

This document explains how SEBAShield currently handles data from an engineering standpoint.

It is not a legal privacy policy, does not constitute legal advice, and does not assert regulatory compliance.

SEBAShield's engineering choices are meant to reflect privacy concepts recognized in Canada — collecting only what's needed, limiting how long data is kept and how it's used, applying safeguards, and giving individuals access to and control over deletion of their information. This is not a claim that SEBAShield satisfies PIPEDA, nor that PIPEDA guarantees a universal right to erasure.

## Design Goals

SEBAShield aims to:

1. Keep raw scan history on-device whenever cloud storage isn't actually needed
2. Minimize how much scan information reaches Firestore
3. Tie every cloud record to an authenticated Firebase identity
4. Keep detailed local scan records separate from the stripped-down cloud version
5. Never reconstruct raw content from what's stored in the cloud
6. Confirm destructive cloud operations succeed before removing local copies
7. Make it clear exactly when submitted content leaves the device for AI analysis
8. Keep local analysis functional even if cloud or AI services go down

---

## Data Categories

### Raw Submitted Content

This is whatever the user hands SEBAShield to analyze — the actual material, not a summary of it.

Examples:

- a suspicious text message or chat snippet
- a URL sent to Link Checker
- job-posting text
- recruiter messages
- suspicious employment offers

This is the single most sensitive category of content the app touches.

It can be used by:

- the deterministic local analyzer
- the encrypted on-device history
- an optional, authenticated AI-analysis request

It is deliberately kept out of Firestore.

---

### Local Analysis

The output of SEBAShield's built-in analyzer can include:

- a numeric risk score
- a risk level
- indicator descriptions
- recommendations
- analyzer details
- the scan type
- whatever submitted content the current result screen or history view needs to display

This local analysis is the app's core, dependable output. AI analysis sits on top of it as an optional extra.

---

### Firestore Cloud Metadata

What reaches Firestore is a stripped-down version of a scan — not the full local record.

It can include fields like:

- scan ID
- Firebase owner UID
- scan type
- score
- risk level
- standardized indicator codes
- analyzer version
- cloud schema version
- created/updated timestamps
- cloud sync timestamp

Firestore was never meant to hold the whole local record. The mapping logic deliberately leaves out:

- raw messages, URLs, or job text
- content previews
- free-text indicator descriptions
- free-text recommendations
- detailed local-analysis text
- AI-generated summaries, explanations, and recommendations
- local encryption keys
- encrypted local history payloads
- sync-error details

---

## Encrypted Local History

Before anything goes into persistent local storage, it's encrypted.

The current protections are:

- AES-256-GCM encryption on the history payload
- an encryption key kept separately in Expo SecureStore
- a versioned envelope format for the encrypted history
- authenticated encryption
- automatic key deletion when history is cleared
- Android backup turned off for the app

This encrypted store is meant to be where raw scan history actually lives long-term.

Encryption protects what's stored — it doesn't mean content never leaves the device at all. It can, when the user opts into AI analysis, as covered below.

---

## Firestore Data Minimization

Firestore only ever receives the reduced version of a scan, never the full local one.

This filtering happens in the data/repository layer, not just in what the UI happens to show:

```text
Rich local scan record
        ↓
Cloud-record mapper
        ↓
Approved metadata only
        ↓
Firestore
```

The cloud-history screen doesn't need raw content to function, so the current schema simply doesn't carry it.

---

## Authentication and Ownership

Firebase Authentication is what establishes ownership of cloud data.

Supported flows:

- anonymous sign-in
- creating an email/password account
- upgrading an anonymous identity into an email/password account
- email/password sign-in
- email verification
- password reset
- signing out of a permanent account

Every cloud scan record lives under its owner's authenticated UID:

```text
users/
└── {uid}/
    └── scans/
        └── {scanId}
```

Firestore Security Rules are the actual server-side enforcement of this boundary.

---

## Permanent Account Sign-Out

Signing out of an email/password account triggers a local wipe first: encrypted scan history is cleared before the sign-out itself completes.

```text
Permanent account
    ↓
Sign out
    ↓
Encrypted local raw history cleared
    ↓
Local history encryption key removed
    ↓
Firebase permanent-account session ends
    ↓
Fresh anonymous Firebase session
```

The reduced Firestore metadata tied to that account isn't touched by sign-out — it stays under the permanent UID until the user deletes it directly.

Signing back in reverses the visibility, not the content:

```text
Permanent account restored
    ↓
Same account UID available
    ↓
Firestore metadata retrieved
    ↓
Metadata-only Cloud Records displayed
```

None of the original raw content comes back — only the metadata was ever recoverable.

---

## Anonymous Account Lifecycle

Anonymous accounts don't have an equivalent "sign out" button the way permanent accounts do — the anonymous identity is inherently temporary.

While that identity is still around:

- scanning works normally
- rich history can still be encrypted and stored on-device
- reduced metadata can still sync under that anonymous UID
- **Clear Scan History** still works, wiping both local and cloud records
- the identity can be upgraded into a real account at any time

Upgrading before the identity is lost is the only way to guarantee it stays recoverable.

### Local anonymous data

An anonymous user's local history sticks around until something removes it — a single deletion, a full history clear, storage being wiped, or the app being uninstalled. Exactly how uninstall behaves varies by OS and storage mechanism, so SEBAShield doesn't treat uninstallation as a reliable deletion method in its own right.

### Anonymous cloud metadata

Reduced metadata tied to an anonymous UID is only reachable — for viewing or deleting — while that anonymous identity still exists.

If the identity is lost first, that metadata becomes effectively stranded: the user can no longer authenticate as that UID to do anything about it.

Practically, that means:

- if you want your account to survive identity loss, upgrade it
- if you just want current data gone, run Clear Scan History while you can still sign in

A more permanent solution — automatic cleanup, expiration windows, or similar — is still on the roadmap rather than built yet.

---

## Cloud-Only History

Sometimes a scan exists in Firestore with no local counterpart — these show up as metadata-only "Cloud Records."

When history refreshes for a logged-in user, SEBAShield merges:

```text
Encrypted local history
        +
Current Firebase UID's Firestore metadata
        ↓
In-memory combined history
```

Rules for the merge:

- if the same scan ID exists in both places, the local version wins
- cloud-only entries stay minimal — no raw content is invented or backfilled
- cloud-only entries live only in memory, never written into local encrypted storage
- everything pulled from Firestore passes through an approved-fields allowlist before it's shown

These entries are visibly labeled **Cloud Record** on the History screen so users know they're seeing metadata, not the original content.

---

# AI Data Flow

AI analysis is the one place where raw content is designed to leave the device — this is fundamentally different from what happens with Firestore.

Firestore only ever gets minimized metadata. The AI backend gets what it actually needs to do inference.

---

## Application-to-AI Analysis Contract

When AI analysis is triggered, the app sends:

- `scanId`
- `scanType`
- the raw `content`
- context from the local rule-based analysis

```text
{
  scanId,
  scanType,
  content,
  localAnalysis
}
```

`content` is the actual submitted message, URL, job posting, or recruitment text. `localAnalysis` comes straight from the deterministic analyzer.

This request is entirely separate from what ends up in the minimized Firestore record.

---

## Cloudflare Worker Request Processing

The Worker checks the request before doing anything with it.

It recognizes:

- `scanId`
- `scanType`
- `content`
- `localAnalysis`

And enforces:

- only supported scan types are accepted
- overall request-size limits
- content-length limits
- Firebase ID-token verification
- rate limiting per authenticated user
- rate limiting at the network level

Before any local-analysis context reaches Workers AI, the Worker trims it down to just:

- `score`
- `riskLevel`
- `indicators`
- `recommendations`

It doesn't blindly pass along whatever properties happen to be in the `localAnalysis` object — anything outside that approved list (raw content that snuck in, sync metadata, ownership fields, etc.) gets dropped at this step.

---

## Worker-to-Workers-AI Payload

What Workers AI actually sees for a given inference call is:

```text
scanType
submittedContent
localRuleAssessment
```

### `scanType`

Which analyzer was used — message, link, or fake job.

### `submittedContent`

The raw content itself, since the model needs it to do the analysis.

### `localRuleAssessment`

The trimmed-down deterministic result: score, risk level, indicator strings, recommendation strings.

Notably, the `scanId` doesn't make it this far — it's part of what the app sends the Worker, but the Worker doesn't include it in what it hands to the AI model.

---

## AI Flow Diagram

```text
User submission
      ↓
Local deterministic analysis
      ↓
Encrypted local persistence
      ↓
Optional AI analysis request
      │
      ├── scanId
      ├── scanType
      ├── raw submitted content
      └── local analysis context
      ↓
Authenticated Cloudflare Worker
      ↓
Request validation
      ↓
Local-analysis sanitization
      │
      ├── score
      ├── risk level
      ├── indicators
      └── recommendations
      ↓
Workers AI receives
      │
      ├── scan type
      ├── raw submitted content
      └── sanitized local rule assessment
      ↓
Structured AI response
      ↓
SEBAShield application
```

---

## AI Response

What comes back can include:

- risk level
- confidence
- summary
- findings or indicators
- recommendations
- explanation

This is always treated as a supplement to the local result, never a replacement. If the AI service fails, the deterministic local analysis still stands on its own.

---

## AI Persistence and Logging

Raw AI request content never lands in Firestore.

The Worker itself is built to avoid deliberately holding onto raw submitted content, and it's designed not to log:

- raw scan content
- Firebase auth tokens
- full request payloads

The AI response sent back to the app doesn't echo the original raw content either.

One honest caveat: the underlying infrastructure providers may keep their own operational or telemetry data outside SEBAShield's control, and this document isn't claiming otherwise.

---

# Deletion Model

Wherever a scan has a Firestore counterpart, deletion happens cloud-first, on purpose.

The reasoning: the app shouldn't tell a user their history is gone if the cloud copy failed to delete and is still sitting there.

---

## Individual Scan Deletion

```text
Delete requested
      ↓
Verify Firebase Authentication
      ↓
Delete matching Firestore document
      ↓
Delete encrypted local record if present
      ↓
Refresh combined history
```

If auth or the Firestore delete fails, the local copy is left alone, the user sees an error, and they can try again.

For a Cloud Record with no local copy at all, deleting it from Firestore is all that's needed to make it disappear from the combined view.

---

## Clear Scan History

The full-wipe sequence:

1. confirm Firebase Authentication is ready
2. pull the current user's Firestore scan documents
3. delete them one at a time
4. only once every cloud delete has succeeded, clear the encrypted local history
5. remove the local encryption key
6. reset in-memory history

```text
Clear Scan History
      ↓
Verify current Firebase UID
      ↓
Retrieve cloud records
      ↓
Delete cloud record 1
      ↓
Delete cloud record 2
      ↓
...
      ↓
All cloud deletions succeeded
      ↓
Clear encrypted local history
      ↓
Remove local encryption key
      ↓
Reset in-memory history
```

---

## Clear Scan History Partial-Failure Policy

This operation is built to fail closed on the local side.

If any single Firestore deletion fails mid-loop:

- the loop halts right there
- local encrypted history stays intact
- the local encryption key stays intact
- the app does not claim the history was fully cleared
- the user sees an error and can retry

Because the deletes happen one after another, it's possible for some cloud records to already be gone while others remain when a failure hits — leaving a temporary state of:

```text
Some cloud records deleted
+
Remaining cloud records still present
+
Complete encrypted local history preserved
```

Retrying is harmless here, since re-deleting an already-deleted Firestore document doesn't cause an error.

Local history only gets cleared once every cloud deletion has actually gone through. The design deliberately favors avoiding an orphaned, unverifiable cloud record over rushing to wipe the local copy.

---

# Retention

## Device-Local Raw History

Local raw history sticks around until one of these happens:

- the user deletes a specific scan
- the user runs Clear Scan History
- a permanent-account sign-out clears it
- the app or device storage gets wiped some other way

Anonymous accounts don't have that sign-out trigger, since they don't have a sign-out flow.

---

## Firestore Metadata

Reduced Firestore metadata sticks around until the user deletes it themselves — either one scan at a time or via Clear Scan History.

There's currently no automatic expiration (TTL) policy running on this data.

If a TTL policy gets added later, this document and the related deletion tests need to be updated in step.

---

## Anonymous Identity Retention Limitation

An anonymous user can only view or delete their cloud metadata for as long as that specific anonymous identity is still usable.

Lose the identity, and that metadata effectively becomes unreachable to the original user.

A more production-ready version should define something concrete here — a retention cap, automatic server-side cleanup, minimizing anonymous cloud persistence in the first place, or some other proper lifecycle rule.

---

# Configuration and Secrets

None of the following should ever end up in the Git repository:

- `.env`
- `.env.save`
- Firebase service-account private keys
- Cloudflare secrets
- account passwords
- private API tokens

`.env.example` is fine for documenting variable names with placeholder values.

Firebase's client-side config isn't a secret in itself — actual authorization comes from Firebase Authentication, backend token checks, and Firestore Security Rules.

---

# Canadian Privacy Design Context

SEBAShield is being built with a Canadian context in mind.

The engineering choices deliberately echo PIPEDA's Fair Information Principles — limiting what's collected, limiting use/disclosure/retention, applying safeguards, being transparent, giving individuals access, and properly destroying or anonymizing data once it's no longer needed.

In practice, that shows up as:

- Firestore holding less than what's kept locally
- raw content kept separate from cloud metadata
- rich local history being encrypted
- Firestore access scoped to authenticated identities
- both single-scan and bulk deletion being available to users
- the AI data-transfer boundary being clearly documented
- a clear, traceable data lifecycle overall

These choices support privacy-minded obligations, but they don't amount to legal compliance on their own. An actual production deployment would still need proper legal review, operational and organizational processes, a real retention policy, consent handling, an access-request process, a breach-response plan, and policy review suited to wherever the app is actually deployed.

---

# Security and Product Limitations

SEBAShield can't promise:

- that it will catch every scam
- that a low-risk result means the content is actually trustworthy
- that AI output is always accurate
- that local rules will catch every new scam technique
- that any employer, account, phone number, or website stays legitimate over time
- that infrastructure providers collect zero operational telemetry
- that a lost anonymous Firebase identity can be recovered

Anything high-stakes — money, employment, security, legal matters, identity — should be independently verified by the user, not taken on the app's word.

---

# Summary

SEBAShield's major data flows break down like this:

```text
RAW CONTENT
    │
    ├── Local deterministic analysis
    │
    ├── Encrypted local history
    │
    └── Optional authenticated AI inference
    │
    └── NOT stored in Firestore
    │
    ↓

FIRESTORE
    │
    └── Privacy-minimized scan metadata
    │
    ↓

AI BACKEND
    │
    ├── Raw submitted content for inference
    ├── Scan type
    ├── Scan request ID (Worker only — not forwarded to the model)
    └── Sanitized local rule assessment for Workers AI
```

So the actual privacy guarantee here isn't **"raw content never leaves the device."**

It's closer to:

> Raw scan content stays encrypted for local history, is excluded from Firestore entirely, and only travels externally when the user specifically requests AI analysis.