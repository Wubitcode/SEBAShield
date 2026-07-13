# 🛡️ SEBAShield

### Secure • Educate • Block • Analyze

**Protect • Detect • Educate**

## 📱 Mobile Capstone Project

**SEBAShield** is a cross-platform cybersecurity mobile application designed to help users identify, analyze, and understand suspicious online content before financial or personal harm occurs.

The application currently provides rule-based scam detection for suspicious messages by examining common indicators such as urgency, credential requests, financial requests, suspicious links, fake employment language, and emotional pressure tactics.

SEBAShield is being developed with **React Native** and **Expo** for both iOS and Android. Firebase and Firestore integration are planned for later phases of the project.


# Project Objectives

The primary objectives of SEBAShield are to:

* Detect suspicious messages and common scam attempts
* Analyze phishing links and unsafe domains
* Identify fraudulent job offers
* Calculate an understandable threat score
* Classify content as Safe, Suspicious, or High Risk
* Explain why submitted content may be dangerous
* Improve cybersecurity awareness
* Help users make safer online decisions



# Problem Being Solved

Cybercriminals commonly use:

* Phishing emails
* Scam text messages
* Fake job offers
* Malicious websites
* Credential-harvesting messages
* Financial manipulation
* Identity impersonation
* Social engineering tactics

Many users cannot easily determine whether a message or link is legitimate.

SEBAShield addresses this problem by analyzing submitted content, identifying recognizable scam indicators, assigning a threat score, and presenting the findings in clear language.

✅ Current Features

# Message Scanner

Users can enter or paste suspicious content such as:

* SMS messages
* Emails
* Social media messages
* Job offers
* General scam messages

### Rule-Based Scam Analyzer

The current detection engine checks content against organized threat-pattern categories.

# Threat Scoring System

The application calculates a score between `0` and `100`.

| Score  | Classification |
| ------ | -------------- |
| 0–29   | 🟢 Safe        |
| 30–69  | 🟡 Suspicious  |
| 70–100 | 🔴 High Risk   |

# Explainable Threat Results

The Result Screen displays:

* Threat score
* Risk classification
* Detected scam indicators
* Original submitted message

# Input Validation

The application prevents users from submitting an empty message for analysis.

# Cross-Platform Navigation

React Navigation manages movement between the Home, Scanner, and Result screens.


# Current Threat-Detection Categories

The application currently analyzes content for:

* Urgency language
* Credential requests
* Banking and financial requests
* Suspicious links
* Shortened URL patterns
* Unusual domain extensions
* Fake employment language
* Unrealistic income claims
* Emotional pressure
* Prize and reward manipulation
* Account suspension or verification language


# Detection Workflow


User submits a suspicious message
                │
                ▼
        ScannerScreen.js
                │
                ▼
        scamAnalyzer.js
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
Threat patterns     Scoring rules
       │                 │
       └────────┬────────┘
                ▼
     Risk score and classification
                │
                ▼
         ResultScreen.js


# Technology Stack

| Technology       | Purpose                                     |
|                  | ------------------------------------------- |
| React Native     | Cross-platform mobile development           |
| Expo             | Development, testing, and simulator support |
| JavaScript       | Application and detection logic             |
| React Navigation | Screen navigation                           |
| Xcode            | iOS Simulator testing                       |
| Android Studio   | Planned Android emulator testing            |
| Firebase         | Planned backend services                    |
| Firestore        | Planned scan-history storage                |
| Git and GitHub   | Version control and project management      |



## 📂 Project Structure


SEBAShield/
│
├── App.js
├── app.json
├── index.js
├── package.json
├── package-lock.json
├── README.md
├── AIReflection.md
├── .gitignore
│
├── app/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── ScannerScreen.js
│   │   ├── ResultScreen.js
│   │   ├── LinkCheckerScreen.js
│   │   ├── FakeJobScreen.js
│   │   ├── HistoryScreen.js
│   │   └── SettingsScreen.js
│   │
│   ├── components/
│   │   ├── Header.js
│   │   ├── CustomButton.js
│   │   ├── ScanInput.js
│   │   ├── RiskCard.js
│   │   └── ThreatIndicator.js
│   │
│   └── constants/
│       ├── colors.js
│       ├── typography.js
│       └── appConfig.js
│
├── navigation/
│   └── AppNavigator.js
│
├── services/
│   ├── scamAnalyzer.js
│   ├── linkChecker.js
│   └── firebaseService.js
│
├── utils/
│   ├── scoringSystem.js
│   ├── threatPatterns.js
│   └── helperFunctions.js
│
├── firebase/
│   └── firebaseConfig.js
│
├── context/
│   └── ScanContext.js
│
├── styles/
│   └── globalStyles.js
│
├── docs/
│   ├── Wireframes.md
│   └── Architecture.md
│
└── assets/
    ├── images/
    │   └── sebashield-logo.png
    ├── icons/
    └── fonts/


Some files are currently placeholders and will be implemented during later development phases.


# Application Screens

# Home Screen

The primary dashboard that displays the SEBAShield brand and provides access to application features.

# Scanner Screen

Allows users to enter or paste suspicious messages for analysis.

# Result Screen

Displays the calculated threat score, risk classification, detected indicators, and submitted message.

# Link Checker Screen

Planned feature for evaluating suspicious URLs and domains.

# Fake Job Detector Screen

Planned feature for detecting employment and recruitment scams.

# History Screen

Planned feature for reviewing previous analyses stored with Firebase Firestore.

# Settings Screen

Planned feature for managing application preferences.

# Running the Project

# Prerequisites

Install the following:

* Node.js
* npm
* Expo
* Xcode for iOS testing
* Android Studio for Android testing

#Install Dependencies

bash
npm install


# Start Expo

bash
npx expo start


# Start with a Cleared Cache

bash
npx expo start -c


# Open the iOS Simulator

After Expo starts, press:

text
i


# Run with the npm Script

bash
npm run ios


# Test Messages

### High-Risk Test

text
URGENT: Your bank account has been suspended. Click http://secure-bank-login.com immediately to verify your identity, password, and verification code.


Expected result:

* High threat score
* High Risk classification
* Urgency indicator
* Suspicious-link indicator
* Credential-request indicator
* Financial-scam indicator

# Safe Test

text
Hello, this is a reminder that your appointment is scheduled for Friday at 2:00 PM. Please call the office if you need to reschedule.


Expected result:

* Low threat score
* Safe classification
* No major scam indicators


## 🗓️ Development Roadmap

| Week   | Milestone                                           | Status     |
| ------ | --------------------------------------------------- | ---------- |
| Week 1 | Project Architecture and Detailed Scaffolding       | ✅ Complete |
| Week 2 | Core Scam Detection Engine                          | ✅ Complete |
| Week 3 | Advanced Link Checker                               | ⏳ Next     |
| Week 4 | Fake Job Detector                                   | Planned    |
| Week 5 | Firebase and Scan History                           | Planned    |
| Week 6 | AI-Assisted Scam Analysis                           | Planned    |
| Week 7 | Testing, UI Polish, Documentation, and Presentation | Planned    |



##  Future Enhancements

Planned future capabilities include:

* Advanced URL analysis
* Real-time URL-reputation services
* Fake job detection
* Firebase authentication
* Firestore scan history
* OCR screenshot analysis
* QR code scanning
* Scam phone-number reporting
* Community threat reporting
* AI-assisted threat explanations
* Personalized cybersecurity recommendations
* Cybersecurity education center


## 🎓 Learning Outcomes

This project strengthens practical skills in:

* React Native development
* Cross-platform mobile application design
* JavaScript
* React Navigation
* Modular software architecture
* Rule-based detection systems
* Cybersecurity analysis
* User-interface design
* Git and GitHub
* Testing and debugging
* Firebase integration



## ⚠️ Disclaimer

SEBAShield is an educational mobile capstone project and an early-stage prototype.

The application provides risk indicators based on rule-based pattern matching. It should not be treated as a guaranteed determination that content is safe or malicious. Users should independently verify suspicious communications and avoid sharing sensitive personal or financial information.

# 👩‍💻 Author

Wubit 

Mobile and Web Development using AI Student
Computer Networking and Cybersecurity Engineering Graduate


Project:SEBAShield Mobile Capstone
Year: 2026



## 📄 License

This project is currently developed for educational and portfolio purposes as part of a Mobile Capstone Project.
Mobile and Web Development using AI Student