#  SEBA Shield 

### Secure • Educate • Block • Analyze

**Protect. Detect. Educate.**

## 📱 Mobile Capstone Project

SEBA Shield AI is a cybersecurity-focused mobile application designed to help users identify, analyze, and understand online scams before they become victims.

The application provides intelligent scam detection for suspicious messages, phishing links, and fraudulent job offers while educating users about common cyber threats through explainable risk analysis.

Built using React Native and Firebase, SEBA Shield  is a cross-platform application that runs on both Android and iOS devices.


##  Project Objectives

The primary objectives of SEBA Shield AI are to:

* Detect suspicious messages and scam attempts
* Analyze phishing URLs and unsafe websites
* Identify fake job offer scams
* Provide understandable threat explanations
* Increase cybersecurity awareness
* Help users make safer online decisions


##  Problems Being Solved

Cybercriminals increasingly use:

* Phishing emails
* Scam text messages
* Fake job offers
* Credential harvesting attacks
* Malicious websites
* Social engineering tactics

Many users cannot easily determine whether a message or link is legitimate.

SEBA Shield  helps users evaluate potential threats and understand why content may be dangerous before taking action.



##  Core Features

### Message Scanner

Analyze suspicious:

* SMS messages
* Emails
* Social media messages
* Online advertisements

### Link Safety Checker

Evaluate:

* URLs
* Websites
* Suspicious domains

### Fake Job Detector

Identify:

* Employment scams
* Unrealistic job offers
* Requests for sensitive information

### Threat Scoring

Risk classifications:

* 🟢 Safe
* 🟡 Suspicious
* 🔴 High Risk

### Explainable Results

Displays:

* Threat indicators
* Scam patterns detected
* Risk explanations
* Cybersecurity recommendations

### Scan History

Store previous analyses using Firebase Firestore.


## Technology Stack

| Technology       | Purpose                           |
| ---------------- | --------------------------------- |
| React Native     | Cross-platform mobile development |
| Expo             | Development and testing           |
| Firebase         | Backend services                  |
| Firestore        | Data storage                      |
| JavaScript       | Application logic                 |
| React Navigation | Navigation system                 |
| GitHub           | Version control                   |
| Xcode            | iOS Simulator                     |
| Android Studio 
| VScode                  |



## Project Structure


SEBAShieldAI/
│
├── app/
│   ├── screens/
│   ├── components/
│   └── constants/
│
├── navigation/
├── firebase/
├── services/
├── utils/
├── styles/
├── context/
├── docs/
├── assets/
│
├── App.js
├── package.json
├── README.md
└── AIReflection.md


## Planned Screens

### Home Screen

Application dashboard and navigation hub.

### Scanner Screen

Paste and analyze suspicious messages.

### Result Screen

Display risk score and threat indicators.

### Link Checker Screen

Analyze URLs and suspicious domains.

### Fake Job Detector

Analyze employment offers for scam patterns.

### History Screen

Review previous scans.

### Settings Screen

Manage application preferences.


## 🔐 Threat Detection Categories

The application will analyze:

* Urgency language
* Suspicious URLs
* Requests for money
* Requests for personal information
* Credential theft attempts
* Identity impersonation
* Fake employment offers
* Social engineering tactics



##  Future Enhancements

Planned future features include:

* OCR screenshot analysis
* QR code scanning
* Scam phone number reporting
* AI-powered threat explanations
* Community threat reporting
* Real-time URL reputation checking
* Cybersecurity learning center


##  Learning Outcomes

This project strengthens skills in:

* Mobile Application Development
* React Native
* Firebase Integration
* Cybersecurity Analysis
* UI/UX Design
* Secure Software Development
* GitHub Project Management


## 👩‍💻 Author

**Wubit Eco**

Computer Networking & Cybersecurity Engineering Graduate
Mobile Web developer student 

Mobile Capstone Project

2026


##  License

This project is developed for educational purposes as part of a Mobile Capstone Project.

Detailed Scaffolding 
SEBAShield/
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
├── firebase/
│   └── firebaseConfig.js
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
├── styles/
│   └── globalStyles.js
│
├── context/
│   └── ScanContext.js
│
├── docs/
│   ├── Wireframes.md
│   └── Architecture.md
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── App.js
├── app.json
├── index.js
├── package.json
├── package-lock.json
├── README.md
├── AIReflection.md
├── .gitignore
└── LICENSE

