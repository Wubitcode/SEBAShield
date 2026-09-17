# SEBAShield Wireframes

## Overview

This document describes the current user-interface structure and navigation flow of the SEBAShield mobile application.

SEBAShield provides three primary cybersecurity analysis tools:

- Message Scanner
- Link Checker
- Fake Job Detector

The application also provides Scan History and Settings screens.

---

# 1. Application Flow

```text
                    ┌──────────────────────┐
                    │        Home          │
                    │      SEBAShield      │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ Message Scanner │  │  Link Checker   │  │ Fake Job Detector   │
└────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘
         │                    │                      │
         ▼                    ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ Threat Analysis │  │  Link Analysis  │  │ Fake Job Analysis   │
└─────────────────┘  └─────────────────┘  └─────────────────────┘

                    ┌──────────────────────┐
                    │     Scan History     │
                    └──────────────────────┘

                    ┌──────────────────────┐
                    │       Settings       │
                    └──────────────────────┘

                    ┌─────────────────────────────────────┐



 Home Screen

The Home screen provides direct access to the main SEBAShield features.
│                                     │
│           SEBAShield Logo           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Message Icon                   │ │
│ │  Message Scanner                │ │
│ │  Check suspicious messages      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Link Icon                      │ │
│ │  Link Checker                   │ │
│ │  Check suspicious URLs          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Briefcase Icon                 │ │
│ │  Fake Job Detector              │ │
│ │  Check job offers               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  History Icon                   │ │
│ │  Scan History                   │ │
│ │  View saved scans               │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

 Message Scanner

The Message Scanner allows users to paste suspicious SMS messages, emails, or social-media messages.

┌─────────────────────────────────────┐
│ ←           Message Scanner         │
├─────────────────────────────────────┤
│                                     │
│             [Message Icon]          │
│                                     │
│     Paste the message you want      │
│             to check.               │
│                                     │
│ Suspicious Message             0    │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │ Paste suspicious message...     │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       Analyze Message           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠ Avoid sharing unnecessary        │
│   sensitive information.           │
│                                     │
└─────────────────────────────────────┘

Message Analysis Result

┌─────────────────────────────────────┐
│ ←          Threat Analysis          │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          Threat Score           │ │
│ │                                 │ │
│ │             100%                │ │
│ │                                 │ │
│ │          [ High Risk ]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Local Analysis                  │ │
│ │                                 │ │
│ │ • Urgency language              │ │
│ │ • Credential request            │ │
│ │ • Suspicious link               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ AI Analysis                     │ │
│ │                                 │ │
│ │ AI Risk              High Risk  │ │
│ │ Confidence                 95%   │ │
│ │                                 │ │
│ │ Summary                         │ │
│ │ Findings                        │ │
│ │ Recommendations                 │ │
│ │ Why It Was Flagged              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Submitted Message               │ │
│ │ Original local message...       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠ Verify suspicious requests       │
│   independently.                   │
│                                     │
└─────────────────────────────────────┘



 Link Checker
 ┌─────────────────────────────────────┐
│ ←            Link Checker           │
├─────────────────────────────────────┤
│                                     │
│              [Link Icon]            │
│                                     │
│      Paste the link you want        │
│             to check.               │
│                                     │
│ Website Address                     │
│ ┌─────────────────────────────────┐ │
│ │ http://example.com             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Analyze Link            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠ Do not open suspicious links.    │
│                                     │
└─────────────────────────────────────┘

Link Analysis Result

┌─────────────────────────────────────┐
│ ←           Link Analysis           │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          Threat Score           │ │
│ │             85%                 │ │
│ │          [ High Risk ]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Local Analysis                  │ │
│ │ • Suspicious domain             │ │
│ │ • Insecure HTTP                 │ │
│ │                                 │ │
│ │ Recommended Actions             │ │
│ │ • Do not open the link          │ │
│ │ • Verify the sender             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ AI Analysis                     │ │
│ │ Risk + Confidence               │ │
│ │ Findings                        │ │
│ │ Recommendations                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Analyzed URL                    │ │
│ │ http://example.com             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

Fake Job Detector

┌─────────────────────────────────────┐
│ ←          Fake Job Detector        │
├─────────────────────────────────────┤
│                                     │
│           [Briefcase Icon]          │
│                                     │
│   Paste the job offer you want      │
│             to check.               │
│                                     │
│ Job Offer or Recruiter Message  0   │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │ Paste suspicious job offer...   │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       Analyze Job Offer         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠ Never send money or sensitive    │
│   information to an unverified     │
│   recruiter.                       │
│                                     │
└─────────────────────────────────────┘

Fake Job Analysis Result

┌─────────────────────────────────────┐
│ ←         Fake Job Analysis         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          Threat Score           │ │
│ │            100%                 │ │
│ │          [ High Risk ]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Local Analysis                  │ │
│ │ • No-interview hiring           │ │
│ │ • Sensitive data request        │ │
│ │ • Unusual compensation          │ │
│ │                                 │ │
│ │ Recommended Actions             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ AI Analysis                     │ │
│ │ Risk + Confidence               │ │
│ │ Summary                         │ │
│ │ Findings                        │ │
│ │ Recommendations                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Submitted Job Offer             │ │
│ │ Original content...             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Official Guidance                  │
│ • Canadian Anti-Fraud Centre       │
│ • Competition Bureau Canada        │
│ • Federal Trade Commission         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Analyze Another Job Offer       │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

Scan History

The History screen displays locally saved analyses.

┌─────────────────────────────────────┐
│ ←            Scan History           │
├─────────────────────────────────────┤
│                                     │
│ 3 saved scans             Clear All │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Message Scanner            100% │ │
│ │ Sep 15, 2026                   │ │
│ │                                │ │
│ │ [ High Risk ]                  │ │
│ │                                │ │
│ │ URGENT: Your account...        │ │
│ │                         Delete │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Link Checker                85% │ │
│ │ Sep 15, 2026                   │ │
│ │ [ High Risk ]                  │ │
│ │ http://example...              │ │
│ │                         Delete │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

Settings

┌─────────────────────────────────────┐
│ ←              Settings             │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Privacy & Data                  │ │
│ │                                 │ │
│ │ Local Scan Content              │ │
│ │ Private Cloud Records           │ │
│ │ Anonymous Authentication        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Scan History                    │ │
│ │                                 │ │
│ │ Clear saved history             │ │
│ │                                 │ │
│ │ [ Clear Scan History ]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ About                           │ │
│ │                                 │ │
│ │ Application       SEBAShield    │ │
│ │ Version                 1.0.0   │ │
│ │ Technology    React Native      │ │
│ │ Developer               Wubit   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠ Analysis Guidance                │
│                                     │
└─────────────────────────────────────┘