# LeWan - Elderly Health Companion WeChat Mini Program

## Developers
- **Aaron Xu (徐浩然)** - Student ID: 2354171
- **Wenda Yu (于闻达)** - Student ID: 2354098
Both are sophomore Software Engineering students at Tongji University. This is their first experience with WeChat Mini Program development, so any feedback or suggestions would be greatly appreciated.

## Project Introduction

"LeWan" Elderly Health Companion is a WeChat Mini Program specifically designed for seniors, dedicated to helping elderly users manage their health, medication reminders, safety assurance, and social communication. The Mini Program features large fonts, voice interaction, and a simple, intuitive interface that fully considers the usage habits of elderly users.

## Innovation Points

1. **Intelligent Voice Interaction**: Integrates speech recognition and large language model technology, allowing elderly users to complete operations through natural language, reducing the digital divide.
2. **Age-Friendly Interface Design**: Large fonts, high contrast, simplified operation processes, customized for the visual and operational characteristics of the elderly.
3. **Multi-dimensional Health Management**: Not only provides medication reminders but also integrates health records and trend analysis, building a complete health monitoring loop.
4. **One-Click Emergency Assistance**: Considering the safety needs of the elderly, designed an intuitive emergency assistance function that supports location sharing and emergency contact notification.
5. **WeChat Ecosystem Integration**: Fully utilizes the advantages of the WeChat platform to lower installation and learning barriers, increasing acceptance.

## Target Users and Needs

### Target Users
- Seniors aged 60 and above with basic smartphone usage abilities
- Family members concerned about the health of elderly relatives
- Community workers providing care services for the elderly

### User Needs
1. **Health Management Needs**: Elderly often need to take multiple medications, requiring accurate medication reminders and health status records.
2. **Safety Assurance Needs**: Elderly living alone or spending the day alone need convenient emergency assistance channels.
3. **Social Communication Needs**: Elderly wish to maintain contact with relatives and friends but may not be skilled at complex communication operations.
4. **Technology Adaptation Needs**: Elderly face physiological changes such as declining vision and reduced finger dexterity, requiring age-friendly interaction design.
5. **Psychological Companionship Needs**: Elderly have psychological needs to be understood and listened to, with the intelligent assistant providing emotional support.

## Main Features
- Medication reminders and management
- Health diary and trend analysis
- Emergency SOS assistance and location sharing
- Quick call and social contact
- Intelligent voice assistant
- Personal center and user settings

## How to Run and Experience
> **Note: This Mini Program has not been officially released and cannot be directly searched and run in the WeChat Mini Program store.**

To experience and test this Mini Program, please follow these steps:

1. **Contact Us for Access**
   - Please contact the project team to add your WeChat account as a "Tester" for the Mini Program.

2. **Get the Test QR Code**
   - After becoming a tester, you will receive a QR code for the Mini Program.

3. **Scan the QR Code**
   - Open "Scan" in your mobile WeChat and scan the QR code to enter the Mini Program for experience and testing.

## Development and Debugging
- This project is implemented based on [WeChat Cloud Development](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html).
- You can use [WeChat Developer Tools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) for local development and debugging.
- After cloning this repository, open it with WeChat Developer Tools to run and preview.

## Cloud Development Quick Guide
This project demonstrates how to get started with the three basic capabilities of cloud development:
- Database: A JSON document database that can be operated from both the Mini Program frontend and cloud functions
- File Storage: Directly upload/download cloud files from the Mini Program frontend, with visual management in the cloud development console
- Cloud Functions: Code running in the cloud, with WeChat's private protocol for natural authentication, developers only need to write business logic code

## Project Structure

```
ElderCareCompanion/
├── miniprogram/                             # Mini Program frontend code
├── cloudfunctions/                          # Cloud functions directory
├── project.config.json                      # Project configuration file
├── project.private.config.json              # Local/private configuration file
├── README.md                                # Project documentation
├── uploadCloudFunction.sh                   # Cloud function upload script
├── English-HCI Final Project Document.docx  # English version of the project report
├── 中文-HCI期末项目文档.docx                  # Chinese version of the project report
└── Demo Video.mp4                           # Project demonstration video
```

## Contact
For experience, or any questions, please contact the project team.(2354171@tongji.edu.cn)