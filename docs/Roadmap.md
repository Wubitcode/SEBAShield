 SEBAShield Roadmap

This roadmap distinguishes functionality already implemented in the current SEBAShield capstone from functionality planned for future development.

SEBAShield currently focuses on three core goals:

1. useful local scam detection
2. privacy-conscious cloud synchronization
3. optional authenticated AI-assisted analysis

Detailed privacy and data-flow behavior is documented in:


docs/PrivacyModel.md


Firebase ownership, synchronization, and cloud-storage behavior are documented in:

docs/FirebaseStructure.md

 Current Capstone Scope

The current application provides three primary analysis tools:

•	Message Scanner
•	Link Checker
•	Fake Job Detector

Each tool performs deterministic local analysis first.

Optional AI analysis acts as a supplemental intelligence layer rather than replacing the local analyzer.

 Implemented: Application Architecture

SEBAShield uses a feature-oriented architecture.

src/
├── app/
├── features/
├── infrastructure/
└── shared/


Major application domains include:

features/
├── aiAnalysis/
├── alerts/
├── authentication/
├── communityReports/
├── history/
├── scanning/
├── settings/
└── threatIntelligence/

This architecture separates:

•	application composition
•	authentication
•	scan analysis
•	persistence
•	synchronization
•	AI integration
•	history
•	shared UI
•	future feature domains

Reserved architecture does not imply that every domain is already implemented.


Implemented: Message Scanner

The Message Scanner performs deterministic analysis of suspicious text messages.

Current capabilities include:

•	suspicious keyword detection
•	urgency indicators
•	financial/payment language detection
•	credential-related warnings
•	social-engineering pattern detection
•	risk scoring
•	risk classification
•	user recommendations
•	optional AI-assisted analysis



 Implemented: Link Checker

The Link Checker analyzes suspicious URLs.

Current capabilities include:

•	URL validation
•	suspicious-domain patterns
•	IP-address URL detection
•	suspicious protocol/pattern checks
•	risky URL characteristics
•	deterministic scoring
•	user recommendations
•	optional AI-assisted analysis

SEBAShield does not need to open or visit the submitted URL to perform its current local rule-based analysis.


Implemented: Fake Job Detector

The Fake Job Detector analyzes employment and recruitment content for common scam indicators.

Current capabilities include:

•	suspicious payment requests
•	unrealistic employment claims
•	urgent recruitment language
•	communication-pattern indicators
•	credential or personal-information requests
•	deterministic scoring
•	user recommendations
•	optional AI-assisted analysis


Implemented: Deterministic Local Analysis

The local rule-based analyzer remains the primary SEBAShield analysis layer.

User submission
      ↓
Local deterministic analyzer
      ↓
Risk score
      ↓
Risk classification
      ↓
Indicators
      ↓
Recommendations

A successful local scan does not depend on:

•	Firestore availability
•	Cloudflare availability
•	Workers AI availability

This preserves useful scanning functionality when external services fail.

•	Implemented: Scan History

SEBAShield supports scan history for completed analyses.

The current history system can display:

•	scan type
•	risk score
•	risk level
•	creation date
•	local content preview when available
•	synchronization state
•	cloud-only metadata records

History can combine:
Rich local records
+
Privacy-minimized Firestore records

Implemented: Encrypted Local History

Rich device-local history is encrypted before persistent storage.

Current protection includes:

•	AES-256-GCM encryption
•	Expo SecureStore key storage
•	authenticated encryption
•	versioned encrypted-history format
•	local encryption-key removal when history is cleared
•	Android application backup disabled

Raw scan content is intended to remain in encrypted local history rather than Firestore.

•	Implemented: Firebase Authentication

SEBAShield supports:

•	anonymous authentication
•	persisted Firebase-session restoration
•	email/password account creation
•	anonymous-to-email/password upgrade
•	email/password sign-in
•	email verification
•	resend verification email
•	refresh verification state
•	password reset
•	permanent-account sign-out


Implemented: Anonymous Account Upgrade

Anonymous users can upgrade their current Firebase identity to an email/password account.

Anonymous Firebase identity
        ↓
Link email/password credential
        ↓
Permanent Firebase account


When Firebase preserves the UID during upgrade, existing Firestore metadata remains associated with the same account.

Implemented: Account Privacy Boundary

Permanent-account sign-out removes device-local rich scan history before moving away from the permanent identity.

Email account
    ↓
Sign out
    ↓
Encrypted local history cleared
    ↓
Local encryption key removed
    ↓
Firebase sign-out
    ↓
Fresh anonymous Firebase identity

The permanent account's privacy-minimized Firestore metadata remains associated with its Firebase UID until explicitly deleted.

Implemented: Privacy-Minimized Firestore Synchronization

SEBAShield synchronizes a reduced metadata representation rather than complete rich scan records.

Firestore can contain fields such as:

•	scan ID
•	owner UID
•	scan type
•	score
•	risk level
•	indicator codes
•	analyzer version
•	cloud schema version
•	timestamps

Firestore intentionally excludes:

•	raw submitted messages
•	raw submitted URLs
•	raw submitted job text
•	local content previews
•	free-text indicator descriptions
•	free-text recommendations
•	AI summaries
•	AI explanations
•	local encryption information

Detailed cloud-schema behavior is documented in:

docs/FirebaseStructure.md



Implemented: UID-Scoped Cloud Ownership

Firestore records are scoped beneath the authenticated Firebase UID.

users/
└── {uid}/
    └── scans/
        └── {scanId}


Firestore Security Rules are designed to prevent one Firebase identity from accessing another user's scans.

Implemented: Cloud History Recovery

When an email/password user signs back into an existing account, SEBAShield can retrieve that account's Firestore metadata.

Permanent account sign-in
        ↓
Firebase UID restored
        ↓
Firestore metadata retrieved
        ↓
Cloud-only records created in memory
        ↓
History screen restored

Useful metadata can therefore return without restoring raw submitted content.

Implemented: Cloud-Only Records

A Firestore-only history record is presented as a Cloud Record.

Cloud Records can display metadata such as:

•	scan type
•	risk level
•	score
•	date

They do not reconstruct:

o	submitted content
o	local preview
o	detailed recommendations
o	free-text analysis
o	AI output

Cloud-only records remain in memory rather than being persisted as artificial rich local records.
 Implemented: Individual Scan Deletion

Individual deletion uses a cloud-first approach.

Delete requested
      ↓
Verify Firebase identity
      ↓
Delete Firestore document
      ↓
Delete encrypted local copy if present
      ↓
Refresh history

If cloud deletion fails:

o	local content is preserved
o	the operation reports an error
o	the user can retry

This prevents SEBAShield from reporting permanent deletion while a known cloud copy may remain.


 Implemented: Clear Scan History

The application can remove the current user's scan history.

Verify Firebase Authentication
      ↓
Retrieve user's Firestore scans
      ↓
Delete cloud documents sequentially
      ↓
All cloud deletions succeed
      ↓
Clear encrypted local history
      ↓
Remove local encryption key
      ↓
Reset application history state


 Implemented: Clear-History Partial Failure Handling

Bulk deletion fails closed with respect to local history.

If a Firestore deletion fails:

o	the cloud-delete loop stops
o	encrypted local history is preserved
o	the encryption key is preserved
o	an error is reported
o	cloud documents already deleted remain deleted
o	remaining cloud documents can be retried later

Firestore document deletion is idempotent, so retrying is safe.

 Implemented: Offline-First Synchronization

Firestore synchronization is secondary to local analysis.

If Firestore synchronization fails:

Local scan remains successful
      ↓
Encrypted local record retained
      ↓
Synchronization can retry later

A network failure therefore does not invalidate a completed local scan.

Implemented: AI-Assisted Analysis

SEBAShield includes an optional AI-analysis layer.

The AI path:

o	requires Firebase-authenticated backend access
o	sends information required for inference
o	uses sanitized deterministic-analysis context
o	returns structured supplemental analysis
o	does not replace the local rule-based result

The exact current application-to-Worker and Worker-to-model data contract is intentionally documented in one place:

docs/PrivacyModel.md

That document is the source of truth for:

o	which raw content leaves the device
o	which local-analysis fields are transmitted
o	which fields are removed before model inference
o	whether the scan ID reaches the model
o	AI persistence and logging boundaries

This roadmap should not duplicate that detailed payload contract because implementation details may evolve.

Implemented: AI Backend

The AI backend uses Cloudflare Workers.

Current capabilities include:

o	`/health` endpoint
o	authenticated `/analyze` endpoint
o	Firebase ID-token validation
o	supported scan-type validation
o	request-size limits
o	submitted-content length validation
o	structured AI response validation
o	Workers AI integration
o	no-store response behavior
o	defensive prompt framing
o	normalized error handling


 Implemented: AI Authentication

The AI analysis endpoint requires a valid Firebase ID token.

The backend validates properties including:

o	token signature
o	signing-key identifier
o	Firebase project audience
o	Firebase issuer
o	token expiration
o	authentication timing
o	Firebase subject / UID

Unauthenticated analysis requests are rejected.


 Implemented: Two-Layer AI Rate Limiting

The AI backend uses two rate-limiting layers for different abuse scenarios.
 Per-User Rate Limiting

Requests are limited using the authenticated Firebase UID.

This constrains repeated requests from one authenticated identity.

Network-Level Rate Limiting

An additional network-level limiter constrains aggregate traffic from a network source.

This second layer exists because anonymous Firebase identities can be inexpensive to create.

Without a second control, an attacker could potentially create many anonymous identities and spread requests across many UIDs to weaken the effectiveness of per-UID limiting.

Conceptually:

One UID
 ↓
Per-user limiter

Many UIDs from same network
 ↓
Network limiter


The two controls are therefore complementary rather than redundant.

They reduce abuse but are not a complete abuse-prevention system.


 Implemented: AI Input Safety

Submitted scam content is treated as untrusted evidence.

The backend prompt instructs the model not to:

o	follow instructions contained in submitted messages
o	obey embedded role-change requests
o	follow jailbreak text
o	visit links
o	execute instructions found in suspicious content
o	treat unverified claims as facts

The Worker validates and normalizes the model response before returning it to the application.

 Implemented: AI Failure Isolation

AI analysis is supplemental.

If AI analysis is unavailable:

Local deterministic result
      ↓
Still displayed


AI failure does not erase or invalidate a successful local analysis.


 Implemented: Settings

The Settings screen currently provides:

o	create/upgrade account
o	sign in
o	password reset
o	verification controls
o	sign out
o	Clear Scan History


# Implemented: Security Documentation

The repository documents:

o	local encryption
o	Firestore data minimization
o	Firebase ownership
o	cloud-only recovery
o	deletion behavior
o	AI data transfer
o	anonymous identity limitations
o	retention limitations

Primary documents include:

README.md
docs/FirebaseStructure.md
docs/PrivacyModel.md
docs/Roadmap.md
docs/Wireframes.md
src/README.md


 Current Limitations

Scam Detection Is Not Definitive

A low-risk result does not prove that content is safe.

A malicious message may avoid known patterns.

A legitimate message may trigger suspicious indicators.

AI Output Can Be Incorrect

AI output can:

o	misunderstand context
o	miss scam indicators
o	overestimate risk
o	underestimate risk
o	produce incomplete explanations

AI output should be treated as supplemental analysis.


Anonymous Accounts Are Not Fully Recoverable

An anonymous Firebase identity can be lost.

If this occurs before account upgrade or deletion:

o	cloud metadata may become inaccessible to that user
o	self-service deletion through the application may no longer be possible

Planned remediation is described under:

Future: Anonymous Data Lifecycle

No Automatic Firestore TTL Is Currently Active

Firestore metadata currently remains until deletion through an available application workflow or another authorized lifecycle process.

The project must not claim automatic expiration until a retention mechanism is configured and tested.

See:
Future: Anonymous Data Lifecycle
Future: Privacy and Legal Readiness

Threat Intelligence Is Not Yet Integrated

The architecture reserves a threat-intelligence domain, but external reputation services are not part of the current implementation.

Future: Threat Intelligence
 Community Reports Are Not Yet Implemented

The architecture contains a community-reporting domain, but community submissions, moderation, and reputation scoring are not current functionality.

Future: Community Reports
 Alerts Are Not Yet Implemented

The alerts architecture is reserved for future functionality.

Push threat alerts are not part of the current capstone.

Future: Alerts
 Capstone Finalization

Before the capstone repository is considered finalized, the following checks should complete successfully:

o	final iOS export
o	final Android export
o	backend TypeScript validation
o	backend automated tests
o	authentication regression testing
o	cloud-history recovery testing
o	deletion testing
o	Git secret review
o	staged-diff review
o	documentation review
o	final GitHub push
 Public Production Release Gates

A successful capstone build is not sufficient for public production deployment.

Before SEBAShield is used as a real public service processing real-user scam, phishing, job, or security-related content, the following should be treated as release gates rather than optional enhancements.

Independent Security Assessment

A production release should undergo an independent application-security review.

For a higher-risk or broadly deployed service, this should include penetration testing covering relevant surfaces such as:

o	mobile-to-backend authentication
o	Firebase authorization boundaries
o	Firestore Security Rules
o	account isolation
o	AI endpoint authentication
o	rate-limit bypass attempts
o	input validation
o	cloud-history access
o	deletion flows
o	secret exposure
o	backend configuration

Material security findings should be remediated before public production deployment.

This is a project release requirement, not a claim that a particular law universally requires penetration testing.


 Privacy and Legal Review

A public deployment should also complete appropriate review of:

o	privacy notices
o	consent
o	retention
o	user access processes
o	deletion processes
o	anonymous-account lifecycle
o	AI processing
o	infrastructure providers
o	incident response
o	breach procedures
o	applicable jurisdictional requirements



Production Configuration Review

Before release:

o	production Firebase rules should be reviewed
o	Cloudflare configuration should be reviewed
o	secrets should be verified outside Git
o	development/test endpoints should be removed or secured
o	rate-limit configuration should be validated
o	logging should be reviewed for sensitive data
o	production application identifiers should be finalized



Future: Automated Testing

Recommended future coverage includes:
 Local Analyzers

o	known scam messages
o	known legitimate messages
o	malformed links
o	suspicious links
o	fake-job patterns
o	edge cases

 History

o	encryption/decryption
o	local migration
o	cloud/local merging
o	Cloud Record rendering
o	corrupted ciphertext
o	individual deletion
o	bulk deletion
o	partial cloud-deletion failure

 Authentication

o	anonymous initialization
o	account upgrade
o	existing-account sign-in
o	email verification
o	password reset
o	permanent-account sign-out
o	account isolation
o	anonymous-data account-switch protection
o	lost anonymous identity scenarios

Firebase

o	owner-only access
o	cross-account rejection
o	Firestore write schema
o	cloud recovery
o	synchronization retry
o	partial deletion failure

AI Backend

o	valid authenticated analysis
o	expired Firebase token
o	invalid Firebase token
o	oversized requests
o	unsupported scan types
o	UID rate limiting
o	network rate limiting
o	multi-anonymous-identity abuse attempts
o	malformed AI output
o	AI-provider failure
o	prompt-injection inputs



Future: Continuous Integration

A future CI pipeline should automatically run:

dependency installation
TypeScript validation
backend tests
mobile export/build checks
secret scanning
formatting checks
linting

CI should prevent repository changes that introduce:

o	committed secrets
o	broken tests
o	invalid TypeScript
o	broken application bundles

 Future: Anonymous Data Lifecycle

This work directly addresses the current limitation described under:

Anonymous Accounts Are Not Fully Recoverable

A production version should define a formal server-side lifecycle for abandoned anonymous accounts.

Possible approaches include:

o	bounded anonymous cloud-retention periods
o	server-side cleanup
o	Firestore TTL where technically and financially appropriate
o	minimizing anonymous cloud persistence
o	encouraging account upgrade before long-term synchronization

The selected lifecycle should be documented, implemented, and tested before being represented as active.

Future: Account Deletion

Permanent account deletion is different from scan-history deletion.

A production implementation should define how account deletion handles:

o	Firebase Authentication identity
o	Firestore scan metadata
o	other account-owned records
o	deletion confirmation
o	reauthentication
o	partial failure
o	retry behavior

 Future: Data Export

A future privacy feature could allow a permanent account holder to export accessible account data.

Because raw history may exist only on a device, export should clearly distinguish:

local rich data
vs.
cloud metadata

Future: Threat Intelligence

The `threatIntelligence` domain can support external reputation services.

Potential future capabilities include:

o	domain reputation
o	malicious URL feeds
o	phishing databases
o	suspicious IP intelligence
o	known scam indicators
o	source attribution
o	caching
o	provider fallback

Providers should be evaluated for:

o	accuracy
o	privacy
o	data retention
o	rate limits
o	cost
o	terms of service

Future: Retrieval-Augmented AI

Future AI analysis could incorporate trusted cybersecurity knowledge using retrieval-augmented generation.

Potential sources include:

o	verified threat-intelligence feeds
o	anti-fraud guidance
o	cybersecurity advisories
o	known scam patterns

Any RAG implementation should preserve:

o	trusted-source controls
o	source attribution
o	data minimization
o	prompt-injection protection

Future: Community Reports
Community reporting may eventually allow users to submit scam indicators.
Before implementation, the project should define:

- allowed report content
o	raw-content storage policy
o	moderation
o	abuse prevention
o	false-report handling
o	authentication
o	rate limiting
o	privacy disclosures
o	retention periods

Future: Alerts

Potential alert functionality includes:

o	high-risk scam alerts
o	threat-intelligence notifications
o	local warning notifications
o	user-controlled notification preferences

Raw submitted scan content should not appear in notifications by default.

Future: Additional Security Hardening

After the production security gate is established, ongoing security work should include:

o	automated dependency monitoring
o	automated secret scanning
o	backend integration tests
o	security-event monitoring
o	abuse analytics
o	formal threat modeling
o	privacy regression tests
o	recurring security review after significant architectural changes

Penetration testing for initial production readiness is treated separately as a release gate rather than as an ordinary future enhancement.
Future: Store Publication

SEBAShield is intended to be prepared for:

o	Apple App Store
o	Google Play Store

Publication work will require:

o	developer accounts
o	production application identifiers
o	signing configuration
o	final icons
o	screenshots
o	store descriptions
o	privacy disclosures
o	data-safety declarations
o	production backend configuration
o	release builds
 Future: Privacy and Legal Readiness

The current engineering model includes privacy-oriented safeguards, but engineering controls alone do not establish legal compliance.

Before public production operation, review should address:

o	privacy-policy requirements
o	consent
o	retention
o	user access
o	account deletion
o	abandoned anonymous data
o	third-party AI processing
o	incident response
o	breach handling
o	organizational safeguards
o	applicable Canadian and other jurisdictional requirements

Detailed current engineering privacy behavior belongs in:

docs/PrivacyModel.md

Capstone Completion Criteria

For the current capstone, SEBAShield should be considered technically complete when:

o	all three scanning tools function
o	deterministic analysis works without AI
o	history is encrypted locally
o	Firestore receives only minimized metadata
o	Firebase Authentication works
o	anonymous-to-permanent account upgrade works
o	cloud metadata recovery works
o	individual deletion works
o	Clear Scan History works
o	partial deletion behavior is defined and tested
o	AI analysis works through the authenticated backend
o	backend authentication and both rate-limit layers are enabled
o	iOS and Android exports complete successfully
o	backend TypeScript validation passes
o	backend tests pass
o	repository documentation reflects implemented behavior
o	private environment files and secrets are not tracked by Git
o	final staged Git changes are reviewed before push



# Project Direction

SEBAShield's long-term direction can be summarized as:

Phase 1
Local scam detection
        ↓

Phase 2
Encrypted history + Firebase identity
        ↓

Phase 3
Privacy-minimized cloud synchronization
        ↓

Phase 4
Authenticated AI assistance
        ↓

Phase 5
Threat intelligence
        ↓

Phase 6
Community intelligence and alerts
        ↓

Phase 7
Production security, privacy, and store release


The current capstone has implemented the core foundations through Phase 4.

Future development should prioritize:

o	security
o	privacy
o	testing
o	reliable threat intelligence
o	lifecycle management
