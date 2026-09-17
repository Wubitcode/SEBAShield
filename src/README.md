 SEBAShield Source Architecture

This directory contains the source code for the SEBAShield mobile application.
SEBAShield uses a feature-oriented architecture so that scanning, authentication, history, settings, AI integration, infrastructure, and shared UI code remain separated.
For detailed privacy and Firebase behavior, see:

- `../docs/PrivacyModel.md`
- `../docs/FirebaseStructure.md`

Structure
src/
├── app/
│   ├── config/
│   ├── navigation/
│   └── providers/
│
├── features/
│   ├── aiAnalysis/
│   ├── alerts/
│   ├── authentication/
│   ├── communityReports/
│   ├── history/
│   ├── scanning/
│   ├── settings/
│   └── threatIntelligence/
│
├── infrastructure/
│   ├── firebase/
│   ├── logging/
│   ├── networking/
│   ├── security/
│   └── storage/
│
└── shared/
    ├── components/
    ├── constants/
    ├── errors/
    ├── styles/
    └── utils/

 `

app/`

Contains application-level composition.

`config/`

Application configuration.

`navigation/`

Contains the main React Navigation setup.

Primary file:
app/navigation/AppNavigator.js

`providers/`

Combines application providers.

Current provider order is:

App
 ↓
AuthProvider
 ↓
ScanProvider
 ↓
AppNavigator

Authentication wraps scanning because scan synchronization and cloud history depend on the current Firebase user.

`features/scanning/`
The main SEBAShield scanning domain.
scanning/
├── analyzers/
├── components/
├── context/
├── models/
├── repositories/
├── scoring/
├── screens/
└── services/


Analyzers

Current deterministic analyzers include:
messageScamAnalyzer.js
linkAnalyzer.js
jobScamAnalyzer.js

They perform local rule-based analysis.

Context
context/ScanContext.js
Coordinates:

•	scan submission
•	history
•	synchronization
•	cloud-history recovery
•	deletion
•	optional AI analysis

Models

models/scanModel.js
Defines scan records and the reduced Firestore representation.

Repositories
repositories/localScanRepository.js
repositories/firebaseScanRepository.js

The local repository handles encrypted local history.
The Firebase repository handles privacy-minimized Firestore records.

Services

services/scanService.js
services/scanSyncService.js

These coordinate deterministic analysis and local-to-cloud synchronization.
features/authentication/`

Contains Firebase Authentication behavior.

Primary files:

authentication/context/AuthContext.js
authentication/services/authService.js

Current functionality includes:

•	anonymous authentication
•	email/password account creation
•	anonymous account upgrade
•	sign-in
•	email verification
•	password reset
•	sign-out

features/history/`

Contains scan-history presentation.

Primary screen:

history/screens/HistoryScreen.js

The History screen displays both:

•	rich local records
•	metadata-only Cloud Records
`features/settings/`
Contains account and privacy controls.
Primary screen
settings/screens/SettingsScreen.js
Current functionality includes:

•	account creation/upgrade
•	sign-in
•	verification controls
•	password reset
•	sign-out
•	Clear Scan History


`
features/aiAnalysis/`

Contains the mobile-side optional AI integration.
Current files include:
aiAnalysis/models/aiAnalysisModel.js
aiAnalysis/providers/aiProvider.js
aiAnalysis/services/aiAnalysisService.js

AI analysis is supplemental.

The deterministic local result remains available if AI is unavailable.

Detailed AI data-flow behavior is documented in:

../docs/PrivacyModel.md

 Reserved Feature Areas

The following directories support future development but should not be treated as completed features:

alerts/
communityReports/
threatIntelligence/


Current implementation status is documented in:

../docs/Roadmap.md

infrastructure/`

Contains technical integrations shared across features.

Firebase

infrastructure/firebase/firebaseConfig.js

This is the active Firebase configuration used by authentication and Firestore code.

Other infrastructure folders are reserved for reusable networking, security, storage, and logging functionality.


`shared/`

Contains reusable application code.

Examples include:

shared/components/CustomButton.js
shared/components/Header.js
shared/constants/colors.js
shared/constants/typography.js
shared/styles/globalStyles.js
shared/utils/helperFunctions.js

Feature-specific logic should remain inside its feature rather than being moved into `shared` unnecessarily.

Dependency Flow

The preferred dependency direction is:

Screens
   ↓
Contexts / Services
   ↓
Analyzers / Models
   ↓
Repositories
   ↓
Infrastructure

For example:

Scanner Screen
     ↓
ScanContext
     ↓
scanService
     ↓
Local Analyzer


ScanContext
     ↓
scanSyncService
     ↓
firebaseScanRepository
     ↓
Firebase


Architecture Rules

1. Screens should not write directly to Firestore.
2. Screens should not manage encrypted storage directly.
3. Analyzers should remain focused on deterministic analysis.
4. Firebase SDK behavior should remain behind services or repositories.
5. Rich local scan data and reduced cloud metadata must remain separate.
6. AI analysis must remain optional.
7. Cloud-only records must not reconstruct raw submitted content.
8. Authentication state determines cloud ownership.
9. Feature-specific code should remain inside its feature.
10. `shared/` should contain only genuinely reusable code.


Related Documentation

- `../README.md` — project overview
- `../docs/PrivacyModel.md` — privacy and AI data flows
- `../docs/FirebaseStructure.md` — Firebase and Firestore design
- `../docs/Roadmap.md` — implemented and future features
- `../docs/Wireframes.md` — screen and navigation flows
