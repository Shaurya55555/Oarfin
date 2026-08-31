import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Lenis from 'lenis';
import Globe3D from './Globe3D';
import OarfinLogo from './Logo';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// ── Reveal — fades/slides an element up into view the first time it scrolls
// into the viewport. Pass `delay` (ms) to stagger a sequence of siblings so
// they come in one-by-one rather than all at once, matching the reference
// site's scroll-triggered reveal.
function Reveal({ children, style, delay = 0, once = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(36px)',
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Translations ─────────────────────────────────────────────────────
const T = {
  English: {
    activeAlerts: 'ACTIVE ALERTS: 3',
    ticker: [
      'Hurricane Maya — Category 4 — Evacuation ordered for coastal zones',
      'Wildfire CA-47 — 15,240 acres — 35% contained — Updated 4 min ago',
      'Flash Flood Warning — Mumbai Region — 12 districts affected',
    ],
    navLinks: ['Dashboard', 'Alerts', 'Resources', 'Preparedness', 'About'],
    signIn: 'Sign In', emergencyLogin: 'Emergency Login',
    heroTitle1: 'Protecting Communities',
    heroTitle2: 'Before Disaster Strikes',
    heroDesc: 'Official emergency coordination platform. Real-time alerts, evacuation orders, and resource management for responders and civilians.',
    viewDashboard: 'View Live Dashboard',
    reportEmergency: 'Report Emergency',
    operatedBy: 'Operated by OARFIN',
    monitoring: '24/7 Monitoring',
    uptime: '98.5% Uptime',
    currentDeclarations: 'Current Emergency Declarations',
    viewArchive: 'View Archive',
    quickActions: 'Quick Actions',
    statsLabels: ['People Protected', 'Alerts Sent', 'Shelters Mapped', 'Avg Alert Time'],
    footerDesc: 'Official emergency management platform. Operated 24/7 by certified emergency coordinators.',
    footerRights: '© 2026 OARFIN Emergency Management Platform. All rights reserved.',
    footerNote: 'This is an official emergency management system. Unauthorized use is prohibited.',
    platform: 'Platform', support: 'Support',
    platformLinks: ['Dashboard', 'Live Alerts', 'Incident Map', 'Resources'],
    supportLinks: ['Help Center', 'Contact Us', 'Accessibility', 'Privacy Policy'],
    learnMore: 'Learn more',
    updatedAgo: 'Updated 2 min ago',
    secureSystem: 'This is a secure government system. Unauthorized use is prohibited.',
    signInBtn: 'Sign In', createAccount: 'Create Account',
    emailLabel: 'Email Address', passwordLabel: 'Password',
    keepSignedIn: 'Keep me signed in', forgotPassword: 'Forgot password?',
    firstName: 'First Name', lastName: 'Last Name',
    mobileLabel: 'Mobile Number (required for alerts)',
    confirmPassword: 'Confirm Password', userTypeLabel: 'User Type',
    selectUserType: 'Select user type',
    civilian: 'Civilian', responder: 'First Responder',
    agency: 'Government Agency', ngo: 'NGO / Relief Organization',
    termsText: 'I agree to the Terms of Service and Privacy Policy',
    pleaseWait: 'Please wait...',
    systemOperational: 'SYSTEM OPERATIONAL — 98.5% UPTIME',
    liveMap: 'Active Incident Map', live: 'Live',
    aboutTitle: 'About OARFIN',
    aboutDesc: 'OARFIN (Online Alert & Resource For Incident Notification) is a real-time disaster management platform built to protect communities across India. We aggregate live disaster data, coordinate emergency responses, and connect civilians with critical resources during crises.',
    aboutMission: 'Our Mission',
    aboutMissionDesc: 'To reduce disaster-related casualties by providing timely, accurate information and enabling faster coordination between government agencies, first responders, and the public.',
    aboutFeatures: ['Real-time disaster alerts from IMD, NDMA & global sources', 'Interactive incident map with safe spot navigation', 'Emergency shelter locator with live capacity data', 'Resource coordination for relief agencies', 'Multi-language support for wider reach', 'Mobile-first design for field responders'],
    aboutTeam: 'Built as a Bachelor\'s Thesis Project — focused on real-world deployment and impact.',
    aboutAchievement: 'Runner-Up — HackCrux Hackathon',
    aboutLiveDeployments: 'Live Deployments',
    aboutWebsiteLink: 'Website (Vercel)',
    aboutServerLink: 'API Server (Render)',
    alertsTitle: 'Live Alert Feed',
    alertsDesc: 'All active emergency declarations are monitored in real time. Click any alert to expand details.',
    resourcesTitle: 'Emergency Resources',
    resourcesDesc: 'Access critical resources for disaster preparedness and response.',
    preparednessTitle: 'Disaster Preparedness',
    preparednessDesc: 'Be ready before disaster strikes. Follow these guidelines to protect yourself and your family.',
  },
  Hindi: {
    activeAlerts: 'सक्रिय अलर्ट: 3',
    ticker: [
      'तूफान माया — श्रेणी 4 — तटीय क्षेत्रों में निकासी का आदेश',
      'जंगल की आग CA-47 — 15,240 एकड़ — 35% नियंत्रित — 4 मिनट पहले अपडेट',
      'अचानक बाढ़ की चेतावनी — मुंबई क्षेत्र — 12 जिले प्रभावित',
    ],
    navLinks: ['डैशबोर्ड', 'अलर्ट', 'संसाधन', 'तैयारी', 'हमारे बारे में'],
    signIn: 'साइन इन', emergencyLogin: 'आपातकालीन लॉगिन',
    heroTitle1: 'समुदायों की रक्षा',
    heroTitle2: 'आपदा से पहले',
    heroDesc: 'आधिकारिक आपातकालीन समन्वय मंच। रियल-टाइम अलर्ट, निकासी आदेश और संसाधन प्रबंधन।',
    viewDashboard: 'लाइव डैशबोर्ड देखें',
    reportEmergency: 'आपातकाल रिपोर्ट करें',
    operatedBy: 'OARFIN द्वारा संचालित',
    monitoring: '24/7 निगरानी',
    uptime: '98.5% अपटाइम',
    currentDeclarations: 'वर्तमान आपातकालीन घोषणाएं',
    viewArchive: 'संग्रह देखें',
    quickActions: 'त्वरित कार्रवाई',
    statsLabels: ['संरक्षित लोग', 'अलर्ट भेजे', 'आश्रय मैप किए', 'औसत अलर्ट समय'],
    footerDesc: 'आधिकारिक आपातकालीन प्रबंधन मंच। प्रमाणित समन्वयकों द्वारा 24/7 संचालित।',
    footerRights: '© 2026 OARFIN आपातकालीन प्रबंधन मंच। सर्वाधिकार सुरक्षित।',
    footerNote: 'यह एक आधिकारिक आपातकालीन प्रबंधन प्रणाली है। अनधिकृत उपयोग निषिद्ध है।',
    platform: 'प्लेटफॉर्म', support: 'सहायता',
    platformLinks: ['डैशबोर्ड', 'लाइव अलर्ट', 'घटना मानचित्र', 'संसाधन'],
    supportLinks: ['सहायता केंद्र', 'संपर्क करें', 'पहुंच', 'गोपनीयता नीति'],
    learnMore: 'और जानें',
    updatedAgo: '2 मिनट पहले अपडेट',
    secureSystem: 'यह एक सुरक्षित सरकारी प्रणाली है। अनधिकृत उपयोग निषिद्ध है।',
    signInBtn: 'साइन इन', createAccount: 'खाता बनाएं',
    emailLabel: 'ईमेल पता', passwordLabel: 'पासवर्ड',
    keepSignedIn: 'साइन इन रहें', forgotPassword: 'पासवर्ड भूल गए?',
    firstName: 'पहला नाम', lastName: 'अंतिम नाम',
    mobileLabel: 'मोबाइल नंबर (अलर्ट के लिए आवश्यक)',
    confirmPassword: 'पासवर्ड की पुष्टि करें', userTypeLabel: 'उपयोगकर्ता प्रकार',
    selectUserType: 'उपयोगकर्ता प्रकार चुनें',
    civilian: 'नागरिक', responder: 'प्रथम प्रतिक्रियाकर्ता',
    agency: 'सरकारी एजेंसी', ngo: 'एनजीओ / राहत संगठन',
    termsText: 'मैं सेवा की शर्तों और गोपनीयता नीति से सहमत हूं',
    pleaseWait: 'कृपया प्रतीक्षा करें...',
    systemOperational: 'सिस्टम चालू — 98.5% अपटाइम',
    liveMap: 'सक्रिय घटना मानचित्र', live: 'लाइव',
    aboutTitle: 'OARFIN के बारे में',
    aboutDesc: 'OARFIN एक रियल-टाइम आपदा प्रबंधन मंच है जो भारत भर के समुदायों की रक्षा के लिए बनाया गया है।',
    aboutMission: 'हमारा मिशन',
    aboutMissionDesc: 'समय पर सटीक जानकारी प्रदान करके और सरकारी एजेंसियों, प्रथम प्रतिक्रियाकर्ताओं और जनता के बीच समन्वय को तेज करके आपदा से संबंधित हताहतों को कम करना।',
    aboutFeatures: ['IMD, NDMA और वैश्विक स्रोतों से रियल-टाइम आपदा अलर्ट', 'सुरक्षित स्थान नेविगेशन के साथ इंटरैक्टिव घटना मानचित्र', 'लाइव क्षमता डेटा के साथ आपातकालीन आश्रय लोकेटर', 'राहत एजेंसियों के लिए संसाधन समन्वय', 'व्यापक पहुंच के लिए बहु-भाषा समर्थन', 'फील्ड प्रतिक्रियाकर्ताओं के लिए मोबाइल-फर्स्ट डिज़ाइन'],
    aboutTeam: 'स्नातक थीसिस परियोजना के रूप में निर्मित — वास्तविक दुनिया की तैनाती पर केंद्रित।',
    aboutAchievement: 'रनर-अप — हैककृक्स हैकाथॉन',
    aboutLiveDeployments: 'लाइव डिप्लॉयमेंट',
    aboutWebsiteLink: 'वेबसाइट (Vercel)',
    aboutServerLink: 'एपीआई सर्वर (Render)',
    alertsTitle: 'लाइव अलर्ट फीड',
    alertsDesc: 'सभी सक्रिय आपातकालीन घोषणाओं की रियल टाइम में निगरानी की जाती है।',
    resourcesTitle: 'आपातकालीन संसाधन',
    resourcesDesc: 'आपदा तैयारी और प्रतिक्रिया के लिए महत्वपूर्ण संसाधनों तक पहुंचें।',
    preparednessTitle: 'आपदा तैयारी',
    preparednessDesc: 'आपदा आने से पहले तैयार रहें। अपनी और अपने परिवार की रक्षा के लिए इन दिशानिर्देशों का पालन करें।',
  },
  Kannada: {
    activeAlerts: 'ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು: 3',
    ticker: [
      'ಚಂಡಮಾರುತ ಮಾಯಾ — ವರ್ಗ 4 — ಕರಾವಳಿ ಪ್ರದೇಶಗಳಿಗೆ ಸ್ಥಳಾಂತರ ಆದೇಶ',
      'ಕಾಡ್ಗಿಚ್ಚು CA-47 — 15,240 ಎಕರೆ — 35% ನಿಯಂತ್ರಣದಲ್ಲಿ — 4 ನಿಮಿಷಗಳ ಹಿಂದೆ ನವೀಕರಿಸಲಾಗಿದೆ',
      'ಹಠಾತ್ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ — ಮುಂಬೈ ಪ್ರದೇಶ — 12 ಜಿಲ್ಲೆಗಳು ಬಾಧಿತ',
    ],
    navLinks: ['ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'ಎಚ್ಚರಿಕೆಗಳು', 'ಸಂಪನ್ಮೂಲಗಳು', 'ಸಿದ್ಧತೆ', 'ನಮ್ಮ ಬಗ್ಗೆ'],
    signIn: 'ಸೈನ್ ಇನ್', emergencyLogin: 'ತುರ್ತು ಲಾಗಿನ್',
    heroTitle1: 'ಸಮುದಾಯಗಳನ್ನು ರಕ್ಷಿಸುವುದು',
    heroTitle2: 'ವಿಪತ್ತು ಸಂಭವಿಸುವ ಮೊದಲು',
    heroDesc: 'ಅಧಿಕೃತ ತುರ್ತು ಸಮನ್ವಯ ವೇದಿಕೆ. ರಿಯಲ್-ಟೈಮ್ ಎಚ್ಚರಿಕೆಗಳು, ಸ್ಥಳಾಂತರ ಆದೇಶಗಳು ಮತ್ತು ಸಂಪನ್ಮೂಲ ನಿರ್ವಹಣೆ.',
    viewDashboard: 'ಲೈವ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವೀಕ್ಷಿಸಿ',
    reportEmergency: 'ತುರ್ತುಸ್ಥಿತಿ ವರದಿ ಮಾಡಿ',
    operatedBy: 'OARFIN ನಿಂದ ನಿರ್ವಹಿಸಲ್ಪಡುತ್ತದೆ',
    monitoring: '24/7 ಮೇಲ್ವಿಚಾರಣೆ',
    uptime: '98.5% ಅಪ್‌ಟೈಮ್',
    currentDeclarations: 'ಪ್ರಸ್ತುತ ತುರ್ತು ಘೋಷಣೆಗಳು',
    viewArchive: 'ಆರ್ಕೈವ್ ವೀಕ್ಷಿಸಿ',
    quickActions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    statsLabels: ['ರಕ್ಷಿಸಲ್ಪಟ್ಟ ಜನರು', 'ಕಳುಹಿಸಿದ ಎಚ್ಚರಿಕೆಗಳು', 'ಮ್ಯಾಪ್ ಮಾಡಿದ ಆಶ್ರಯಗಳು', 'ಸರಾಸರಿ ಎಚ್ಚರಿಕೆ ಸಮಯ'],
    footerDesc: 'ಅಧಿಕೃತ ತುರ್ತು ನಿರ್ವಹಣಾ ವೇದಿಕೆ. ಪ್ರಮಾಣೀಕೃತ ಸಮನ್ವಯಕಾರರಿಂದ 24/7 ನಿರ್ವಹಿಸಲ್ಪಡುತ್ತದೆ.',
    footerRights: '© 2026 OARFIN ತುರ್ತು ನಿರ್ವಹಣಾ ವೇದಿಕೆ. ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    footerNote: 'ಇದು ಅಧಿಕೃತ ತುರ್ತು ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ. ಅನಧಿಕೃತ ಬಳಕೆ ನಿಷಿದ್ಧ.',
    platform: 'ವೇದಿಕೆ', support: 'ಬೆಂಬಲ',
    platformLinks: ['ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'ಲೈವ್ ಎಚ್ಚರಿಕೆಗಳು', 'ಘಟನೆ ನಕ್ಷೆ', 'ಸಂಪನ್ಮೂಲಗಳು'],
    supportLinks: ['ಸಹಾಯ ಕೇಂದ್ರ', 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ', 'ಪ್ರವೇಶಿಸುವಿಕೆ', 'ಗೌಪ್ಯತೆ ನೀತಿ'],
    learnMore: 'ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ',
    updatedAgo: '2 ನಿಮಿಷಗಳ ಹಿಂದೆ ನವೀಕರಿಸಲಾಗಿದೆ',
    secureSystem: 'ಇದು ಸುರಕ್ಷಿತ ಸರ್ಕಾರಿ ವ್ಯವಸ್ಥೆ. ಅನಧಿಕೃತ ಬಳಕೆ ನಿಷಿದ್ಧ.',
    signInBtn: 'ಸೈನ್ ಇನ್', createAccount: 'ಖಾತೆ ರಚಿಸಿ',
    emailLabel: 'ಇಮೇಲ್ ವಿಳಾಸ', passwordLabel: 'ಪಾಸ್‌ವರ್ಡ್',
    keepSignedIn: 'ನನ್ನನ್ನು ಸೈನ್ ಇನ್ ಆಗಿ ಇರಿಸಿ', forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
    firstName: 'ಮೊದಲ ಹೆಸರು', lastName: 'ಕೊನೆಯ ಹೆಸರು',
    mobileLabel: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಎಚ್ಚರಿಕೆಗಳಿಗಾಗಿ ಅಗತ್ಯ)',
    confirmPassword: 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ', userTypeLabel: 'ಬಳಕೆದಾರ ಪ್ರಕಾರ',
    selectUserType: 'ಬಳಕೆದಾರ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ',
    civilian: 'ನಾಗರಿಕ', responder: 'ಪ್ರಥಮ ಪ್ರತಿಸ್ಪಂದಕ',
    agency: 'ಸರ್ಕಾರಿ ಸಂಸ್ಥೆ', ngo: 'ಎನ್‌ಜಿಒ / ಪರಿಹಾರ ಸಂಸ್ಥೆ',
    termsText: 'ನಾನು ಸೇವಾ ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತೆ ನೀತಿಗೆ ಒಪ್ಪುತ್ತೇನೆ',
    pleaseWait: 'ದಯವಿಟ್ಟು ಕಾಯಿರಿ...',
    systemOperational: 'ಸಿಸ್ಟಮ್ ಕಾರ್ಯಾಚರಣೆಯಲ್ಲಿದೆ — 98.5% ಅಪ್‌ಟೈಮ್',
    liveMap: 'ಸಕ್ರಿಯ ಘಟನೆ ನಕ್ಷೆ', live: 'ಲೈವ್',
    aboutTitle: 'OARFIN ಬಗ್ಗೆ',
    aboutDesc: 'OARFIN ಭಾರತದಾದ್ಯಂತ ಸಮುದಾಯಗಳನ್ನು ರಕ್ಷಿಸಲು ನಿರ್ಮಿಸಲಾದ ರಿಯಲ್-ಟೈಮ್ ವಿಪತ್ತು ನಿರ್ವಹಣಾ ವೇದಿಕೆಯಾಗಿದೆ.',
    aboutMission: 'ನಮ್ಮ ಧ್ಯೇಯ',
    aboutMissionDesc: 'ಸಕಾಲಿಕ, ನಿಖರವಾದ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸುವ ಮೂಲಕ ಮತ್ತು ಸರ್ಕಾರಿ ಸಂಸ್ಥೆಗಳು, ಪ್ರಥಮ ಪ್ರತಿಸ್ಪಂದಕರು ಮತ್ತು ಸಾರ್ವಜನಿಕರ ನಡುವೆ ವೇಗದ ಸಮನ್ವಯವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸುವ ಮೂಲಕ ವಿಪತ್ತು ಸಂಬಂಧಿತ ಸಾವುನೋವುಗಳನ್ನು ಕಡಿಮೆ ಮಾಡುವುದು.',
    aboutFeatures: ['IMD, NDMA ಮತ್ತು ಜಾಗತಿಕ ಮೂಲಗಳಿಂದ ರಿಯಲ್-ಟೈಮ್ ವಿಪತ್ತು ಎಚ್ಚರಿಕೆಗಳು', 'ಸುರಕ್ಷಿತ ಸ್ಥಳ ಸಂಚರಣೆಯೊಂದಿಗೆ ಸಂವಾದಾತ್ಮಕ ಘಟನೆ ನಕ್ಷೆ', 'ಲೈವ್ ಸಾಮರ್ಥ್ಯ ಡೇಟಾದೊಂದಿಗೆ ತುರ್ತು ಆಶ್ರಯ ಶೋಧಕ', 'ಪರಿಹಾರ ಸಂಸ್ಥೆಗಳಿಗೆ ಸಂಪನ್ಮೂಲ ಸಮನ್ವಯ', 'ವಿಶಾಲ ವ್ಯಾಪ್ತಿಗಾಗಿ ಬಹು-ಭಾಷಾ ಬೆಂಬಲ', 'ಕ್ಷೇತ್ರ ಪ್ರತಿಸ್ಪಂದಕರಿಗಾಗಿ ಮೊಬೈಲ್-ಫಸ್ಟ್ ವಿನ್ಯಾಸ'],
    aboutTeam: 'ಬ್ಯಾಚುಲರ್ ಥೀಸಿಸ್ ಯೋಜನೆಯಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ — ನೈಜ-ಜಗತ್ತಿನ ನಿಯೋಜನೆ ಮತ್ತು ಪ್ರಭಾವದ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸಲಾಗಿದೆ.',
    aboutAchievement: 'ರನ್ನರ್-ಅಪ್ — ಹ್ಯಾಕ್‌ಕ್ರಕ್ಸ್ ಹ್ಯಾಕಥಾನ್',
    aboutLiveDeployments: 'ಲೈವ್ ನಿಯೋಜನೆಗಳು',
    aboutWebsiteLink: 'ವೆಬ್‌ಸೈಟ್ (Vercel)',
    aboutServerLink: 'API ಸರ್ವರ್ (Render)',
    alertsTitle: 'ಲೈವ್ ಎಚ್ಚರಿಕೆ ಫೀಡ್',
    alertsDesc: 'ಎಲ್ಲಾ ಸಕ್ರಿಯ ತುರ್ತು ಘೋಷಣೆಗಳನ್ನು ರಿಯಲ್ ಟೈಮ್‌ನಲ್ಲಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತದೆ.',
    resourcesTitle: 'ತುರ್ತು ಸಂಪನ್ಮೂಲಗಳು',
    resourcesDesc: 'ವಿಪತ್ತು ಸಿದ್ಧತೆ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆಗಾಗಿ ನಿರ್ಣಾಯಕ ಸಂಪನ್ಮೂಲಗಳನ್ನು ಪ್ರವೇಶಿಸಿ.',
    preparednessTitle: 'ವಿಪತ್ತು ಸಿದ್ಧತೆ',
    preparednessDesc: 'ವಿಪತ್ತು ಸಂಭವಿಸುವ ಮೊದಲು ಸಿದ್ಧರಾಗಿರಿ. ನಿಮ್ಮನ್ನು ಮತ್ತು ನಿಮ್ಮ ಕುಟುಂಬವನ್ನು ರಕ್ಷಿಸಲು ಈ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಅನುಸರಿಸಿ.',
  },
  Tamil: {
    activeAlerts: 'செயலில் உள்ள எச்சரிக்கைகள்: 3',
    ticker: [
      'சூறாவளி மாயா — வகை 4 — கடலோர பகுதிகளுக்கு வெளியேற்ற உத்தரவு',
      'காட்டுத் தீ CA-47 — 15,240 ஏக்கர் — 35% கட்டுப்பாட்டில் — 4 நிமிடங்களுக்கு முன் புதுப்பிக்கப்பட்டது',
      'திடீர் வெள்ள எச்சரிக்கை — மும்பை பகுதி — 12 மாவட்டங்கள் பாதிக்கப்பட்டுள்ளன',
    ],
    navLinks: ['டாஷ்போர்டு', 'எச்சரிக்கைகள்', 'வளங்கள்', 'தயார்நிலை', 'எங்களைப் பற்றி'],
    signIn: 'உள்நுழைக', emergencyLogin: 'அவசர உள்நுழைவு',
    heroTitle1: 'சமூகங்களைப் பாதுகாத்தல்',
    heroTitle2: 'பேரிடர் ஏற்படுவதற்கு முன்',
    heroDesc: 'அதிகாரப்பூர்வ அவசரகால ஒருங்கிணைப்பு தளம். நிகழ்நேர எச்சரிக்கைகள், வெளியேற்ற உத்தரவுகள் மற்றும் வள மேலாண்மை.',
    viewDashboard: 'நேரடி டாஷ்போர்டைக் காண்க',
    reportEmergency: 'அவசரநிலையை புகாரளிக்கவும்',
    operatedBy: 'OARFIN ஆல் இயக்கப்படுகிறது',
    monitoring: '24/7 கண்காணிப்பு',
    uptime: '98.5% இயங்குநேரம்',
    currentDeclarations: 'தற்போதைய அவசரகால அறிவிப்புகள்',
    viewArchive: 'காப்பகத்தைக் காண்க',
    quickActions: 'விரைவு செயல்கள்',
    statsLabels: ['பாதுகாக்கப்பட்ட மக்கள்', 'அனுப்பப்பட்ட எச்சரிக்கைகள்', 'வரைபடமிடப்பட்ட தங்குமிடங்கள்', 'சராசரி எச்சரிக்கை நேரம்'],
    footerDesc: 'அதிகாரப்பூர்வ அவசரகால மேலாண்மை தளம். சான்றளிக்கப்பட்ட ஒருங்கிணைப்பாளர்களால் 24/7 இயக்கப்படுகிறது.',
    footerRights: '© 2026 OARFIN அவசரகால மேலாண்மை தளம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    footerNote: 'இது ஒரு அதிகாரப்பூர்வ அவசரகால மேலாண்மை அமைப்பு. அங்கீகரிக்கப்படாத பயன்பாடு தடைசெய்யப்பட்டுள்ளது.',
    platform: 'தளம்', support: 'ஆதரவு',
    platformLinks: ['டாஷ்போர்டு', 'நேரடி எச்சரிக்கைகள்', 'சம்பவ வரைபடம்', 'வளங்கள்'],
    supportLinks: ['உதவி மையம்', 'எங்களை தொடர்பு கொள்ள', 'அணுகல்தன்மை', 'தனியுரிமைக் கொள்கை'],
    learnMore: 'மேலும் அறிக',
    updatedAgo: '2 நிமிடங்களுக்கு முன் புதுப்பிக்கப்பட்டது',
    secureSystem: 'இது ஒரு பாதுகாப்பான அரசாங்க அமைப்பு. அங்கீகரிக்கப்படாத பயன்பாடு தடைசெய்யப்பட்டுள்ளது.',
    signInBtn: 'உள்நுழைக', createAccount: 'கணக்கை உருவாக்கவும்',
    emailLabel: 'மின்னஞ்சல் முகவரி', passwordLabel: 'கடவுச்சொல்',
    keepSignedIn: 'என்னை உள்நுழைந்தே வைத்திரு', forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    firstName: 'முதல் பெயர்', lastName: 'கடைசி பெயர்',
    mobileLabel: 'மொபைல் எண் (எச்சரிக்கைகளுக்கு தேவை)',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்', userTypeLabel: 'பயனர் வகை',
    selectUserType: 'பயனர் வகையைத் தேர்ந்தெடுக்கவும்',
    civilian: 'குடிமகன்', responder: 'முதல் பதிலளிப்பாளர்',
    agency: 'அரசு நிறுவனம்', ngo: 'என்ஜிஓ / நிவாரண அமைப்பு',
    termsText: 'சேவை விதிமுறைகள் மற்றும் தனியுரிமைக் கொள்கையை ஏற்கிறேன்',
    pleaseWait: 'தயவுசெய்து காத்திருக்கவும்...',
    systemOperational: 'அமைப்பு இயங்குகிறது — 98.5% இயங்குநேரம்',
    liveMap: 'செயலில் உள்ள சம்பவ வரைபடம்', live: 'நேரலை',
    aboutTitle: 'OARFIN பற்றி',
    aboutDesc: 'OARFIN என்பது இந்தியா முழுவதும் உள்ள சமூகங்களைப் பாதுகாக்க உருவாக்கப்பட்ட நிகழ்நேர பேரிடர் மேலாண்மை தளமாகும்.',
    aboutMission: 'எங்கள் நோக்கம்',
    aboutMissionDesc: 'சரியான நேரத்தில் துல்லியமான தகவல்களை வழங்குவதன் மூலமும், அரசு நிறுவனங்கள், முதல் பதிலளிப்பாளர்கள் மற்றும் பொதுமக்களிடையே விரைவான ஒருங்கிணைப்பை செயல்படுத்துவதன் மூலமும் பேரிடர் தொடர்பான உயிரிழப்புகளைக் குறைத்தல்.',
    aboutFeatures: ['IMD, NDMA மற்றும் உலகளாவிய ஆதாரங்களிலிருந்து நிகழ்நேர பேரிடர் எச்சரிக்கைகள்', 'பாதுகாப்பான இட வழிசெலுத்தலுடன் ஊடாடும் சம்பவ வரைபடம்', 'நேரடி கொள்ளளவு தரவுடன் அவசர தங்குமிட கண்டுபிடிப்பான்', 'நிவாரண நிறுவனங்களுக்கான வள ஒருங்கிணைப்பு', 'பரந்த சென்றடைவதற்கான பல்மொழி ஆதரவு', 'கள பதிலளிப்பாளர்களுக்கான மொபைல்-முதல் வடிவமைப்பு'],
    aboutTeam: 'இளங்கலை ஆய்வுக்கட்டுரை திட்டமாக உருவாக்கப்பட்டது — நிஜ-உலக வரிசைப்படுத்தல் மற்றும் தாக்கத்தில் கவனம் செலுத்துகிறது.',
    aboutAchievement: 'இரண்டாமிடம் — ஹேக்க்ரக்ஸ் ஹேக்கத்தான்',
    aboutLiveDeployments: 'நேரடி வரிசைப்படுத்தல்கள்',
    aboutWebsiteLink: 'இணையதளம் (Vercel)',
    aboutServerLink: 'API சர்வர் (Render)',
    alertsTitle: 'நேரடி எச்சரிக்கை ஊட்டம்',
    alertsDesc: 'அனைத்து செயலில் உள்ள அவசரகால அறிவிப்புகளும் நிகழ்நேரத்தில் கண்காணிக்கப்படுகின்றன.',
    resourcesTitle: 'அவசரகால வளங்கள்',
    resourcesDesc: 'பேரிடர் தயார்நிலை மற்றும் பதிலளிப்பிற்கான முக்கியமான வளங்களை அணுகவும்.',
    preparednessTitle: 'பேரிடர் தயார்நிலை',
    preparednessDesc: 'பேரிடர் ஏற்படுவதற்கு முன் தயாராக இருங்கள். உங்களையும் உங்கள் குடும்பத்தையும் பாதுகாக்க இந்த வழிகாட்டுதல்களைப் பின்பற்றவும்.',
  },
  Marathi: {
    activeAlerts: 'सक्रिय इशारे: 3',
    ticker: [
      'चक्रीवादळ माया — श्रेणी 4 — किनारपट्टी भागांसाठी स्थलांतराचा आदेश',
      'वणवा CA-47 — 15,240 एकर — 35% नियंत्रणात — 4 मिनिटांपूर्वी अद्यतनित',
      'अचानक पूर इशारा — मुंबई प्रदेश — 12 जिल्हे प्रभावित',
    ],
    navLinks: ['डॅशबोर्ड', 'इशारे', 'संसाधने', 'सज्जता', 'आमच्याबद्दल'],
    signIn: 'साइन इन', emergencyLogin: 'आपत्कालीन लॉगिन',
    heroTitle1: 'समुदायांचे संरक्षण',
    heroTitle2: 'आपत्ती येण्यापूर्वी',
    heroDesc: 'अधिकृत आपत्कालीन समन्वय व्यासपीठ. रिअल-टाइम इशारे, स्थलांतर आदेश आणि संसाधन व्यवस्थापन.',
    viewDashboard: 'लाइव्ह डॅशबोर्ड पहा',
    reportEmergency: 'आपत्कालीन स्थिती नोंदवा',
    operatedBy: 'OARFIN द्वारे संचालित',
    monitoring: '24/7 देखरेख',
    uptime: '98.5% अपटाइम',
    currentDeclarations: 'सध्याच्या आपत्कालीन घोषणा',
    viewArchive: 'संग्रह पहा',
    quickActions: 'त्वरित कृती',
    statsLabels: ['संरक्षित लोक', 'पाठवलेले इशारे', 'नकाशित निवारे', 'सरासरी इशारा वेळ'],
    footerDesc: 'अधिकृत आपत्कालीन व्यवस्थापन व्यासपीठ. प्रमाणित समन्वयकांद्वारे 24/7 संचालित.',
    footerRights: '© 2026 OARFIN आपत्कालीन व्यवस्थापन व्यासपीठ. सर्व हक्क राखीव.',
    footerNote: 'ही एक अधिकृत आपत्कालीन व्यवस्थापन प्रणाली आहे. अनधिकृत वापर प्रतिबंधित आहे.',
    platform: 'व्यासपीठ', support: 'समर्थन',
    platformLinks: ['डॅशबोर्ड', 'लाइव्ह इशारे', 'घटना नकाशा', 'संसाधने'],
    supportLinks: ['मदत केंद्र', 'आमच्याशी संपर्क साधा', 'सुलभता', 'गोपनीयता धोरण'],
    learnMore: 'अधिक जाणून घ्या',
    updatedAgo: '2 मिनिटांपूर्वी अद्यतनित',
    secureSystem: 'ही एक सुरक्षित सरकारी प्रणाली आहे. अनधिकृत वापर प्रतिबंधित आहे.',
    signInBtn: 'साइन इन', createAccount: 'खाते तयार करा',
    emailLabel: 'ईमेल पत्ता', passwordLabel: 'पासवर्ड',
    keepSignedIn: 'मला साइन इन ठेवा', forgotPassword: 'पासवर्ड विसरलात?',
    firstName: 'पहिले नाव', lastName: 'आडनाव',
    mobileLabel: 'मोबाइल नंबर (इशाऱ्यांसाठी आवश्यक)',
    confirmPassword: 'पासवर्डची पुष्टी करा', userTypeLabel: 'वापरकर्ता प्रकार',
    selectUserType: 'वापरकर्ता प्रकार निवडा',
    civilian: 'नागरिक', responder: 'प्रथम प्रतिसादकर्ता',
    agency: 'सरकारी संस्था', ngo: 'एनजीओ / मदत संस्था',
    termsText: 'मी सेवा अटी आणि गोपनीयता धोरणाशी सहमत आहे',
    pleaseWait: 'कृपया प्रतीक्षा करा...',
    systemOperational: 'प्रणाली कार्यरत — 98.5% अपटाइम',
    liveMap: 'सक्रिय घटना नकाशा', live: 'लाइव्ह',
    aboutTitle: 'OARFIN बद्दल',
    aboutDesc: 'OARFIN हे संपूर्ण भारतातील समुदायांचे संरक्षण करण्यासाठी तयार केलेले रिअल-टाइम आपत्ती व्यवस्थापन व्यासपीठ आहे.',
    aboutMission: 'आमचे ध्येय',
    aboutMissionDesc: 'वेळेवर, अचूक माहिती पुरवून आणि सरकारी संस्था, प्रथम प्रतिसादकर्ते आणि जनता यांच्यातील जलद समन्वय सक्षम करून आपत्तीशी संबंधित मृत्यू कमी करणे.',
    aboutFeatures: ['IMD, NDMA आणि जागतिक स्रोतांकडून रिअल-टाइम आपत्ती इशारे', 'सुरक्षित स्थान नेव्हिगेशनसह परस्परसंवादी घटना नकाशा', 'लाइव्ह क्षमता डेटासह आपत्कालीन निवारा शोधक', 'मदत संस्थांसाठी संसाधन समन्वय', 'व्यापक पोहोचण्यासाठी बहुभाषिक समर्थन', 'क्षेत्रीय प्रतिसादकर्त्यांसाठी मोबाइल-फर्स्ट डिझाइन'],
    aboutTeam: 'बॅचलर थीसिस प्रकल्प म्हणून तयार — वास्तविक-जगातील तैनाती आणि परिणामावर केंद्रित.',
    aboutAchievement: 'उपविजेता — हॅककृक्स हॅकाथॉन',
    aboutLiveDeployments: 'लाइव्ह तैनाती',
    aboutWebsiteLink: 'वेबसाइट (Vercel)',
    aboutServerLink: 'API सर्व्हर (Render)',
    alertsTitle: 'लाइव्ह इशारा फीड',
    alertsDesc: 'सर्व सक्रिय आपत्कालीन घोषणांचे रिअल टाइममध्ये निरीक्षण केले जाते.',
    resourcesTitle: 'आपत्कालीन संसाधने',
    resourcesDesc: 'आपत्ती सज्जता आणि प्रतिसादासाठी महत्त्वाच्या संसाधनांमध्ये प्रवेश करा.',
    preparednessTitle: 'आपत्ती सज्जता',
    preparednessDesc: 'आपत्ती येण्यापूर्वी सज्ज रहा. स्वतःचे आणि आपल्या कुटुंबाचे संरक्षण करण्यासाठी या मार्गदर्शक तत्त्वांचे पालन करा.',
  },
  Gujarati: {
    activeAlerts: 'સક્રિય ચેતવણીઓ: 3',
    ticker: [
      'વાવાઝોડું માયા — શ્રેણી 4 — દરિયાકાંઠાના વિસ્તારો માટે સ્થળાંતરનો આદેશ',
      'જંગલની આગ CA-47 — 15,240 એકર — 35% નિયંત્રણમાં — 4 મિનિટ પહેલા અપડેટ',
      'અચાનક પૂરની ચેતવણી — મુંબઈ પ્રદેશ — 12 જિલ્લાઓ અસરગ્રસ્ત',
    ],
    navLinks: ['ડેશબોર્ડ', 'ચેતવણીઓ', 'સંસાધનો', 'તૈયારી', 'અમારા વિશે'],
    signIn: 'સાઇન ઇન', emergencyLogin: 'ઇમરજન્સી લોગિન',
    heroTitle1: 'સમુદાયોનું રક્ષણ',
    heroTitle2: 'આપત્તિ આવે તે પહેલાં',
    heroDesc: 'સત્તાવાર કટોકટી સંકલન પ્લેટફોર્મ. રીઅલ-ટાઇમ ચેતવણીઓ, સ્થળાંતર આદેશો અને સંસાધન વ્યવસ્થાપન.',
    viewDashboard: 'લાઇવ ડેશબોર્ડ જુઓ',
    reportEmergency: 'કટોકટીની જાણ કરો',
    operatedBy: 'OARFIN દ્વારા સંચાલિત',
    monitoring: '24/7 મોનિટરિંગ',
    uptime: '98.5% અપટાઇમ',
    currentDeclarations: 'હાલની કટોકટી ઘોષણાઓ',
    viewArchive: 'આર્કાઇવ જુઓ',
    quickActions: 'ઝડપી ક્રિયાઓ',
    statsLabels: ['સુરક્ષિત લોકો', 'મોકલેલી ચેતવણીઓ', 'મેપ કરેલા આશ્રયસ્થાનો', 'સરેરાશ ચેતવણી સમય'],
    footerDesc: 'સત્તાવાર કટોકટી વ્યવસ્થાપન પ્લેટફોર્મ. પ્રમાણિત સંયોજકો દ્વારા 24/7 સંચાલિત.',
    footerRights: '© 2026 OARFIN કટોકટી વ્યવસ્થાપન પ્લેટફોર્મ. તમામ હકો અનામત.',
    footerNote: 'આ એક સત્તાવાર કટોકટી વ્યવસ્થાપન સિસ્ટમ છે. અનધિકૃત ઉપયોગ પ્રતિબંધિત છે.',
    platform: 'પ્લેટફોર્મ', support: 'સપોર્ટ',
    platformLinks: ['ડેશબોર્ડ', 'લાઇવ ચેતવણીઓ', 'ઘટના નકશો', 'સંસાધનો'],
    supportLinks: ['સહાય કેન્દ્ર', 'અમારો સંપર્ક કરો', 'સુલભતા', 'ગોપનીયતા નીતિ'],
    learnMore: 'વધુ જાણો',
    updatedAgo: '2 મિનિટ પહેલા અપડેટ',
    secureSystem: 'આ એક સુરક્ષિત સરકારી સિસ્ટમ છે. અનધિકૃત ઉપયોગ પ્રતિબંધિત છે.',
    signInBtn: 'સાઇન ઇન', createAccount: 'ખાતું બનાવો',
    emailLabel: 'ઈમેલ સરનામું', passwordLabel: 'પાસવર્ડ',
    keepSignedIn: 'મને સાઇન ઇન રાખો', forgotPassword: 'પાસવર્ડ ભૂલી ગયા?',
    firstName: 'પ્રથમ નામ', lastName: 'છેલ્લું નામ',
    mobileLabel: 'મોબાઇલ નંબર (ચેતવણીઓ માટે જરૂરી)',
    confirmPassword: 'પાસવર્ડની પુષ્ટિ કરો', userTypeLabel: 'વપરાશકર્તા પ્રકાર',
    selectUserType: 'વપરાશકર્તા પ્રકાર પસંદ કરો',
    civilian: 'નાગરિક', responder: 'પ્રથમ પ્રતિસાદકર્તા',
    agency: 'સરકારી એજન્સી', ngo: 'એનજીઓ / રાહત સંસ્થા',
    termsText: 'હું સેવાની શરતો અને ગોપનીયતા નીતિ સાથે સંમત છું',
    pleaseWait: 'કૃપા કરી રાહ જુઓ...',
    systemOperational: 'સિસ્ટમ કાર્યરત — 98.5% અપટાઇમ',
    liveMap: 'સક્રિય ઘટના નકશો', live: 'લાઇવ',
    aboutTitle: 'OARFIN વિશે',
    aboutDesc: 'OARFIN એ સમગ્ર ભારતમાં સમુદાયોનું રક્ષણ કરવા માટે બનાવવામાં આવેલ રીઅલ-ટાઇમ આપત્તિ વ્યવસ્થાપન પ્લેટફોર્મ છે.',
    aboutMission: 'અમારું મિશન',
    aboutMissionDesc: 'સમયસર, સચોટ માહિતી પ્રદાન કરીને અને સરકારી એજન્સીઓ, પ્રથમ પ્રતિસાદકર્તાઓ અને જનતા વચ્ચે ઝડપી સંકલન સક્ષમ કરીને આપત્તિ સંબંધિત જાનહાનિ ઘટાડવી.',
    aboutFeatures: ['IMD, NDMA અને વૈશ્વિક સ્ત્રોતોમાંથી રીઅલ-ટાઇમ આપત્તિ ચેતવણીઓ', 'સુરક્ષિત સ્થળ નેવિગેશન સાથે ઇન્ટરેક્ટિવ ઘટના નકશો', 'લાઇવ ક્ષમતા ડેટા સાથે કટોકટી આશ્રય શોધક', 'રાહત એજન્સીઓ માટે સંસાધન સંકલન', 'વ્યાપક પહોંચ માટે બહુભાષી સપોર્ટ', 'ફિલ્ડ પ્રતિસાદકર્તાઓ માટે મોબાઇલ-ફર્સ્ટ ડિઝાઇન'],
    aboutTeam: 'બેચલર થીસીસ પ્રોજેક્ટ તરીકે બનાવેલ — વાસ્તવિક-વિશ્વ પરિનિયોજન અને અસર પર કેન્દ્રિત.',
    aboutAchievement: 'રનર-અપ — હેકક્રક્સ હેકાથોન',
    aboutLiveDeployments: 'લાઇવ ડિપ્લોયમેન્ટ્સ',
    aboutWebsiteLink: 'વેબસાઇટ (Vercel)',
    aboutServerLink: 'API સર્વર (Render)',
    alertsTitle: 'લાઇવ ચેતવણી ફીડ',
    alertsDesc: 'બધી સક્રિય કટોકટી ઘોષણાઓનું રીઅલ ટાઇમમાં નિરીક્ષણ કરવામાં આવે છે.',
    resourcesTitle: 'કટોકટી સંસાધનો',
    resourcesDesc: 'આપત્તિ તૈયારી અને પ્રતિભાવ માટે મહત્વપૂર્ણ સંસાધનોને ઍક્સેસ કરો.',
    preparednessTitle: 'આપત્તિ તૈયારી',
    preparednessDesc: 'આપત્તિ આવે તે પહેલાં તૈયાર રહો. તમારી અને તમારા પરિવારની સુરક્ષા માટે આ માર્ગદર્શિકાઓનું પાલન કરો.',
  },
  Telugu: {
    activeAlerts: 'క్రియాశీల హెచ్చరికలు: 3',
    ticker: [
      'తుఫాను మాయా — వర్గం 4 — తీర ప్రాంతాలకు తరలింపు ఆదేశం',
      'అడవి మంటలు CA-47 — 15,240 ఎకరాలు — 35% నియంత్రణలో — 4 నిమిషాల క్రితం నవీకరించబడింది',
      'ఆకస్మిక వరద హెచ్చరిక — ముంబై ప్రాంతం — 12 జిల్లాలు ప్రభావితమయ్యాయి',
    ],
    navLinks: ['డాష్‌బోర్డ్', 'హెచ్చరికలు', 'వనరులు', 'సంసిద్ధత', 'మా గురించి'],
    signIn: 'సైన్ ఇన్', emergencyLogin: 'అత్యవసర లాగిన్',
    heroTitle1: 'సమాజాలను రక్షించడం',
    heroTitle2: 'విపత్తు సంభవించే ముందు',
    heroDesc: 'అధికారిక అత్యవసర సమన్వయ వేదిక. రియల్-టైమ్ హెచ్చరికలు, తరలింపు ఆదేశాలు మరియు వనరుల నిర్వహణ.',
    viewDashboard: 'లైవ్ డాష్‌బోర్డ్ చూడండి',
    reportEmergency: 'అత్యవసర పరిస్థితిని నివేదించండి',
    operatedBy: 'OARFIN ద్వారా నిర్వహించబడుతుంది',
    monitoring: '24/7 పర్యవేక్షణ',
    uptime: '98.5% అప్‌టైమ్',
    currentDeclarations: 'ప్రస్తుత అత్యవసర ప్రకటనలు',
    viewArchive: 'ఆర్కైవ్ చూడండి',
    quickActions: 'త్వరిత చర్యలు',
    statsLabels: ['రక్షించబడిన ప్రజలు', 'పంపిన హెచ్చరికలు', 'మ్యాప్ చేసిన ఆశ్రయాలు', 'సగటు హెచ్చరిక సమయం'],
    footerDesc: 'అధికారిక అత్యవసర నిర్వహణ వేదిక. ధృవీకరించబడిన సమన్వయకర్తలచే 24/7 నిర్వహించబడుతుంది.',
    footerRights: '© 2026 OARFIN అత్యవసర నిర్వహణ వేదిక. అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.',
    footerNote: 'ఇది అధికారిక అత్యవసర నిర్వహణ వ్యవస్థ. అనధికార వినియోగం నిషేధించబడింది.',
    platform: 'వేదిక', support: 'మద్దతు',
    platformLinks: ['డాష్‌బోర్డ్', 'లైవ్ హెచ్చరికలు', 'సంఘటన మ్యాప్', 'వనరులు'],
    supportLinks: ['సహాయ కేంద్రం', 'మమ్మల్ని సంప్రదించండి', 'ప్రాప్యత', 'గోప్యతా విధానం'],
    learnMore: 'మరింత తెలుసుకోండి',
    updatedAgo: '2 నిమిషాల క్రితం నవీకరించబడింది',
    secureSystem: 'ఇది సురక్షితమైన ప్రభుత్వ వ్యవస్థ. అనధికార వినియోగం నిషేధించబడింది.',
    signInBtn: 'సైన్ ఇన్', createAccount: 'ఖాతా సృష్టించండి',
    emailLabel: 'ఇమెయిల్ చిరునామా', passwordLabel: 'పాస్‌వర్డ్',
    keepSignedIn: 'నన్ను సైన్ ఇన్‌గా ఉంచండి', forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    firstName: 'మొదటి పేరు', lastName: 'చివరి పేరు',
    mobileLabel: 'మొబైల్ నంబర్ (హెచ్చరికల కోసం అవసరం)',
    confirmPassword: 'పాస్‌వర్డ్‌ను నిర్ధారించండి', userTypeLabel: 'వినియోగదారు రకం',
    selectUserType: 'వినియోగదారు రకాన్ని ఎంచుకోండి',
    civilian: 'పౌరుడు', responder: 'ప్రథమ స్పందనదారు',
    agency: 'ప్రభుత్వ సంస్థ', ngo: 'ఎన్జీవో / సహాయ సంస్థ',
    termsText: 'నేను సేవా నిబంధనలు మరియు గోప్యతా విధానానికి అంగీకరిస్తున్నాను',
    pleaseWait: 'దయచేసి వేచి ఉండండి...',
    systemOperational: 'సిస్టమ్ పనిచేస్తోంది — 98.5% అప్‌టైమ్',
    liveMap: 'క్రియాశీల సంఘటన మ్యాప్', live: 'ప్రత్యక్ష ప్రసారం',
    aboutTitle: 'OARFIN గురించి',
    aboutDesc: 'OARFIN అనేది భారతదేశం అంతటా సమాజాలను రక్షించడానికి నిర్మించబడిన రియల్-టైమ్ విపత్తు నిర్వహణ వేదిక.',
    aboutMission: 'మా లక్ష్యం',
    aboutMissionDesc: 'సకాలంలో, ఖచ్చితమైన సమాచారాన్ని అందించడం ద్వారా మరియు ప్రభుత్వ సంస్థలు, ప్రథమ స్పందనదారులు మరియు ప్రజల మధ్య వేగవంతమైన సమన్వయాన్ని ఎనేబుల్ చేయడం ద్వారా విపత్తు సంబంధిత మరణాలను తగ్గించడం.',
    aboutFeatures: ['IMD, NDMA మరియు గ్లోబల్ మూలాల నుండి రియల్-టైమ్ విపత్తు హెచ్చరికలు', 'సురక్షిత స్థల నావిగేషన్‌తో ఇంటరాక్టివ్ సంఘటన మ్యాప్', 'లైవ్ కెపాసిటీ డేటాతో అత్యవసర ఆశ్రయ లొకేటర్', 'సహాయ సంస్థల కోసం వనరుల సమన్వయం', 'విస్తృత చేరువ కోసం బహుభాషా మద్దతు', 'ఫీల్డ్ స్పందనదారుల కోసం మొబైల్-ఫస్ట్ డిజైన్'],
    aboutTeam: 'బ్యాచిలర్ థీసిస్ ప్రాజెక్ట్‌గా నిర్మించబడింది — నిజ-ప్రపంచ విస్తరణ మరియు ప్రభావంపై దృష్టి సారించింది.',
    aboutAchievement: 'రన్నర్-అప్ — హ్యాక్‌క్రక్స్ హ్యాకథాన్',
    aboutLiveDeployments: 'లైవ్ డిప్లాయ్‌మెంట్‌లు',
    aboutWebsiteLink: 'వెబ్‌సైట్ (Vercel)',
    aboutServerLink: 'API సర్వర్ (Render)',
    alertsTitle: 'లైవ్ హెచ్చరిక ఫీడ్',
    alertsDesc: 'అన్ని క్రియాశీల అత్యవసర ప్రకటనలు రియల్ టైమ్‌లో పర్యవేక్షించబడతాయి.',
    resourcesTitle: 'అత్యవసర వనరులు',
    resourcesDesc: 'విపత్తు సంసిద్ధత మరియు స్పందన కోసం కీలకమైన వనరులను యాక్సెస్ చేయండి.',
    preparednessTitle: 'విపత్తు సంసిద్ధత',
    preparednessDesc: 'విపత్తు సంభవించే ముందు సిద్ధంగా ఉండండి. మిమ్మల్ని మరియు మీ కుటుంబాన్ని రక్షించుకోవడానికి ఈ మార్గదర్శకాలను అనుసరించండి.',
  },
};


const ALERTS_DATA = [
  { color: '#EF4444', badge: 'CRITICAL', badgeBg: '#EF4444', icon: 'fa-hurricane', title: 'Hurricane Maya', meta: 'Category 4 — ETA 18 hours', detail: 'Evacuation ordered for all coastal zones within 50km. Shelters open at designated centers.', status: 'Evacuation Ordered', source: 'National Hurricane Center', updated: '8 minutes ago' },
  { color: '#F59E0B', badge: 'HIGH', badgeBg: '#D97706', icon: 'fa-fire', title: 'Wildfire CA-47', meta: '15,240 acres — 35% contained', detail: 'Air quality index critical. Residents advised to stay indoors. Firefighting crews deployed.', status: 'Active Response', source: 'CAL FIRE', updated: '4 minutes ago' },
  { color: '#3B82F6', badge: 'MODERATE', badgeBg: '#2563EB', icon: 'fa-water', title: 'Flash Flood Warning', meta: 'Mumbai Region — 12 districts', detail: 'Heavy rainfall expected for next 6 hours. Avoid low-lying areas and river banks.', status: 'Watch Active', source: 'India Meteorological Dept', updated: '12 minutes ago' },
];

const RESOURCES_META = [
  { icon: 'fa-house-chimney-medical', color: '#1E3A5F', link: '#' },
  { icon: 'fa-truck-medical', color: '#1E3A5F', link: '#' },
  { icon: 'fa-phone-volume', color: '#B91C1C', link: '#' },
  { icon: 'fa-map-location-dot', color: '#1E3A5F', link: '#' },
  { icon: 'fa-droplet', color: '#1E3A5F', link: '#' },
  { icon: 'fa-hospital', color: '#1E3A5F', link: '#' },
];

const RESOURCES_DATA_BY_LANG = {
  English: [
    { title: 'Emergency Shelters', desc: '420+ shelters mapped across India with live capacity data. Find the nearest open shelter.' },
    { title: 'Relief Camps', desc: 'Active relief camps with food, water, and medical aid. Updated every 30 minutes by field teams.' },
    { title: 'Helpline Numbers', desc: 'NDMA: 1078 | Police: 100 | Ambulance: 108 | Fire: 101 | Flood Control: 1070' },
    { title: 'Evacuation Routes', desc: 'Real-time road closure data and safe evacuation corridors updated by traffic authorities.' },
    { title: 'Water & Supplies', desc: 'Locate nearest clean water distribution points and essential supply depots in your area.' },
    { title: 'Medical Facilities', desc: 'Hospitals and medical camps accepting disaster victims. Includes blood bank availability.' },
  ],
  Hindi: [
    { title: 'आपातकालीन आश्रय स्थल', desc: 'पूरे भारत में 420+ आश्रय स्थल लाइव क्षमता डेटा के साथ मैप किए गए। निकटतम खुला आश्रय स्थल खोजें।' },
    { title: 'राहत शिविर', desc: 'भोजन, पानी और चिकित्सा सहायता वाले सक्रिय राहत शिविर। फील्ड टीमों द्वारा हर 30 मिनट में अपडेट किया जाता है।' },
    { title: 'हेल्पलाइन नंबर', desc: 'NDMA: 1078 | पुलिस: 100 | एम्बुलेंस: 108 | फायर: 101 | बाढ़ नियंत्रण: 1070' },
    { title: 'निकासी मार्ग', desc: 'यातायात अधिकारियों द्वारा अपडेट की गई रीयल-टाइम सड़क बंद होने की जानकारी और सुरक्षित निकासी मार्ग।' },
    { title: 'पानी और आपूर्ति', desc: 'अपने क्षेत्र में निकटतम स्वच्छ जल वितरण केंद्र और आवश्यक आपूर्ति डिपो खोजें।' },
    { title: 'चिकित्सा सुविधाएं', desc: 'आपदा पीड़ितों को स्वीकार करने वाले अस्पताल और चिकित्सा शिविर। ब्लड बैंक उपलब्धता शामिल है।' },
  ],
  Kannada: [
    { title: 'ತುರ್ತು ಆಶ್ರಯ ತಾಣಗಳು', desc: 'ಭಾರತದಾದ್ಯಂತ 420+ ಆಶ್ರಯ ತಾಣಗಳು ಲೈವ್ ಸಾಮರ್ಥ್ಯ ಡೇಟಾದೊಂದಿಗೆ ಮ್ಯಾಪ್ ಮಾಡಲಾಗಿದೆ. ಹತ್ತಿರದ ತೆರೆದ ಆಶ್ರಯ ಹುಡುಕಿ.' },
    { title: 'ಪರಿಹಾರ ಶಿಬಿರಗಳು', desc: 'ಆಹಾರ, ನೀರು ಮತ್ತು ವೈದ್ಯಕೀಯ ನೆರವಿನೊಂದಿಗೆ ಸಕ್ರಿಯ ಪರಿಹಾರ ಶಿಬಿರಗಳು. ಕ್ಷೇತ್ರ ತಂಡಗಳಿಂದ ಪ್ರತಿ 30 ನಿಮಿಷಗಳಿಗೊಮ್ಮೆ ನವೀಕರಿಸಲಾಗುತ್ತದೆ.' },
    { title: 'ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆಗಳು', desc: 'NDMA: 1078 | ಪೊಲೀಸ್: 100 | ಆಂಬ್ಯುಲೆನ್ಸ್: 108 | ಅಗ್ನಿಶಾಮಕ: 101 | ಪ್ರವಾಹ ನಿಯಂತ್ರಣ: 1070' },
    { title: 'ಸ್ಥಳಾಂತರ ಮಾರ್ಗಗಳು', desc: 'ಸಂಚಾರ ಅಧಿಕಾರಿಗಳು ನವೀಕರಿಸಿದ ರಿಯಲ್-ಟೈಮ್ ರಸ್ತೆ ಮುಚ್ಚುವಿಕೆ ಡೇಟಾ ಮತ್ತು ಸುರಕ್ಷಿತ ಸ್ಥಳಾಂತರ ಕಾರಿಡಾರ್‌ಗಳು.' },
    { title: 'ನೀರು ಮತ್ತು ಸರಬರಾಜು', desc: 'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಹತ್ತಿರದ ಶುದ್ಧ ನೀರಿನ ವಿತರಣಾ ಕೇಂದ್ರಗಳು ಮತ್ತು ಅಗತ್ಯ ಸರಬರಾಜು ಡಿಪೋಗಳನ್ನು ಪತ್ತೆ ಮಾಡಿ.' },
    { title: 'ವೈದ್ಯಕೀಯ ಸೌಲಭ್ಯಗಳು', desc: 'ವಿಪತ್ತು ಸಂತ್ರಸ್ತರನ್ನು ಸ್ವೀಕರಿಸುವ ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ವೈದ್ಯಕೀಯ ಶಿಬಿರಗಳು. ರಕ್ತ ಬ್ಯಾಂಕ್ ಲಭ್ಯತೆ ಸೇರಿದೆ.' },
  ],
  Tamil: [
    { title: 'அவசர தங்குமிடங்கள்', desc: 'இந்தியா முழுவதும் 420+ தங்குமிடங்கள் நேரடி கொள்ளளவு தரவுடன் வரைபடமாக்கப்பட்டுள்ளன. அருகிலுள்ள திறந்த தங்குமிடத்தைக் கண்டறியவும்.' },
    { title: 'நிவாரண முகாம்கள்', desc: 'உணவு, தண்ணீர் மற்றும் மருத்துவ உதவியுடன் செயலில் உள்ள நிவாரண முகாம்கள். கள குழுக்களால் ஒவ்வொரு 30 நிமிடங்களுக்கும் புதுப்பிக்கப்படுகிறது.' },
    { title: 'உதவி எண்கள்', desc: 'NDMA: 1078 | காவல்துறை: 100 | ஆம்புலன்ஸ்: 108 | தீயணைப்பு: 101 | வெள்ள கட்டுப்பாடு: 1070' },
    { title: 'வெளியேற்ற வழிகள்', desc: 'போக்குவரத்து அதிகாரிகளால் புதுப்பிக்கப்பட்ட நேரடி சாலை மூடல் தரவு மற்றும் பாதுகாப்பான வெளியேற்ற பாதைகள்.' },
    { title: 'தண்ணீர் & பொருட்கள்', desc: 'உங்கள் பகுதியில் அருகிலுள்ள சுத்தமான தண்ணீர் விநியோக மையங்கள் மற்றும் அத்தியாவசிய பொருட்கள் கிடங்குகளைக் கண்டறியவும்.' },
    { title: 'மருத்துவ வசதிகள்', desc: 'பேரிடர் பாதிக்கப்பட்டோரை ஏற்கும் மருத்துவமனைகள் மற்றும் மருத்துவ முகாம்கள். இரத்த வங்கி கிடைப்பது உட்பட.' },
  ],
  Marathi: [
    { title: 'आपत्कालीन निवारे', desc: 'संपूर्ण भारतात 420+ निवारे लाइव्ह क्षमता डेटासह मॅप केलेले आहेत. जवळचे उघडे निवारे शोधा.' },
    { title: 'मदत छावण्या', desc: 'अन्न, पाणी आणि वैद्यकीय मदतीसह सक्रिय मदत छावण्या. फील्ड टीमद्वारे दर 30 मिनिटांनी अद्ययावत केले जाते.' },
    { title: 'हेल्पलाइन क्रमांक', desc: 'NDMA: 1078 | पोलीस: 100 | रुग्णवाहिका: 108 | अग्निशमन: 101 | पूर नियंत्रण: 1070' },
    { title: 'निर्वासन मार्ग', desc: 'वाहतूक अधिकाऱ्यांनी अद्ययावत केलेली रिअल-टाइम रस्ता बंद माहिती आणि सुरक्षित निर्वासन मार्ग.' },
    { title: 'पाणी आणि साहित्य', desc: 'तुमच्या भागातील जवळचे स्वच्छ पाणी वितरण केंद्र आणि आवश्यक साहित्य डेपो शोधा.' },
    { title: 'वैद्यकीय सुविधा', desc: 'आपत्ती पीडितांना स्वीकारणारी रुग्णालये आणि वैद्यकीय छावण्या. रक्तपेढी उपलब्धतेसह.' },
  ],
  Gujarati: [
    { title: 'કટોકટી આશ્રયસ્થાનો', desc: 'સમગ્ર ભારતમાં 420+ આશ્રયસ્થાનો લાઇવ ક્ષમતા ડેટા સાથે મેપ કરવામાં આવ્યા છે. નજીકનું ખુલ્લું આશ્રયસ્થાન શોધો.' },
    { title: 'રાહત શિબિરો', desc: 'ખોરાક, પાણી અને તબીબી સહાય સાથે સક્રિય રાહત શિબિરો. ફિલ્ડ ટીમો દ્વારા દર 30 મિનિટે અપડેટ કરવામાં આવે છે.' },
    { title: 'હેલ્પલાઇન નંબરો', desc: 'NDMA: 1078 | પોલીસ: 100 | એમ્બ્યુલન્સ: 108 | ફાયર: 101 | પૂર નિયંત્રણ: 1070' },
    { title: 'સ્થળાંતર માર્ગો', desc: 'ટ્રાફિક અધિકારીઓ દ્વારા અપડેટ કરાયેલ રીઅલ-ટાઇમ રોડ બંધ ડેટા અને સલામત સ્થળાંતર માર્ગો.' },
    { title: 'પાણી અને પુરવઠો', desc: 'તમારા વિસ્તારમાં નજીકના સ્વચ્છ પાણી વિતરણ કેન્દ્રો અને આવશ્યક પુરવઠા ડેપો શોધો.' },
    { title: 'તબીબી સુવિધાઓ', desc: 'આપત્તિ પીડિતોને સ્વીકારતી હોસ્પિટલો અને તબીબી શિબિરો. બ્લડ બેંક ઉપલબ્ધતા સહિત.' },
  ],
  Telugu: [
    { title: 'అత్యవసర ఆశ్రయాలు', desc: 'భారతదేశం అంతటా 420+ ఆశ్రయాలు లైవ్ కెపాసిటీ డేటాతో మ్యాప్ చేయబడ్డాయి. సమీప తెరిచిన ఆశ్రయాన్ని కనుగొనండి.' },
    { title: 'సహాయ శిబిరాలు', desc: 'ఆహారం, నీరు మరియు వైద్య సహాయంతో క్రియాశీల సహాయ శిబిరాలు. ఫీల్డ్ బృందాలచే ప్రతి 30 నిమిషాలకు నవీకరించబడుతుంది.' },
    { title: 'హెల్ప్‌లైన్ నంబర్లు', desc: 'NDMA: 1078 | పోలీస్: 100 | అంబులెన్స్: 108 | అగ్నిమాపక: 101 | వరద నియంత్రణ: 1070' },
    { title: 'తరలింపు మార్గాలు', desc: 'ట్రాఫిక్ అధికారులు నవీకరించిన రియల్-టైమ్ రోడ్ మూసివేత డేటా మరియు సురక్షిత తరలింపు మార్గాలు.' },
    { title: 'నీరు & సామాగ్రి', desc: 'మీ ప్రాంతంలో సమీప స్వచ్ఛమైన నీటి పంపిణీ కేంద్రాలు మరియు అవసరమైన సామాగ్రి డిపోలను గుర్తించండి.' },
    { title: 'వైద్య సదుపాయాలు', desc: 'విపత్తు బాధితులను స్వీకరించే ఆసుపత్రులు మరియు వైద్య శిబిరాలు. బ్లడ్ బ్యాంక్ లభ్యతతో సహా.' },
  ],
};

const PREPAREDNESS_META = [
  { icon: 'fa-list-check', color: '#1E3A5F' },
  { icon: 'fa-kit-medical', color: '#1E3A5F' },
  { icon: 'fa-mobile-screen', color: '#1E3A5F' },
  { icon: 'fa-house-flood-water', color: '#1E3A5F' },
];

const PREPAREDNESS_DATA_BY_LANG = {
  English: [
    { title: 'Make a Family Plan', steps: ['Identify two meeting points — one near home, one outside your neighborhood', 'Save emergency contacts on every family member\'s phone', 'Assign roles: who carries the kit, who checks on elderly neighbors', 'Practice your evacuation route at least once a year'] },
    { title: 'Build a 72-Hour Kit', steps: ['3 days of water (1 gallon per person per day)', 'Non-perishable food, manual can opener, utensils', 'First aid kit, prescription medications, copies of documents', 'Flashlight, batteries, whistle, dust masks, local maps'] },
    { title: 'Stay Informed', steps: ['Register on OARFIN for SMS alerts in your area', 'Follow IMD and NDMA on official channels', 'Know your district\'s warning siren signals', 'Keep a battery-powered or hand-crank radio'] },
    { title: 'Flood Preparedness', steps: ['Know your flood zone — check NDMA flood maps', 'Move valuables and documents to higher floors', 'Never walk or drive through floodwater', 'Turn off electricity at the breaker if flooding is imminent'] },
  ],
  Hindi: [
    { title: 'पारिवारिक योजना बनाएं', steps: ['दो मिलन बिंदु तय करें — एक घर के पास, एक अपने मोहल्ले के बाहर', 'हर परिवार के सदस्य के फोन में आपातकालीन संपर्क सेव करें', 'भूमिकाएं तय करें: किट कौन ले जाएगा, बुज़ुर्ग पड़ोसियों की जांच कौन करेगा', 'साल में कम से कम एक बार निकासी मार्ग का अभ्यास करें'] },
    { title: '72 घंटे की किट बनाएं', steps: ['3 दिन का पानी (प्रति व्यक्ति प्रति दिन 1 गैलन)', 'बिना खराब होने वाला भोजन, हाथ से चलने वाला कैन ओपनर, बर्तन', 'फर्स्ट एड किट, ज़रूरी दवाइयां, दस्तावेज़ों की प्रतियां', 'टॉर्च, बैटरी, सीटी, धूल मास्क, स्थानीय नक्शे'] },
    { title: 'सूचित रहें', steps: ['अपने क्षेत्र में SMS अलर्ट के लिए OARFIN पर रजिस्टर करें', 'IMD और NDMA के आधिकारिक चैनल फॉलो करें', 'अपने ज़िले के चेतावनी सायरन संकेत जानें', 'बैटरी या हैंड-क्रैंक रेडियो पास रखें'] },
    { title: 'बाढ़ की तैयारी', steps: ['अपना बाढ़ क्षेत्र जानें — NDMA के बाढ़ मानचित्र देखें', 'कीमती सामान और दस्तावेज़ ऊंची मंज़िलों पर रखें', 'बाढ़ के पानी में कभी न चलें और न वाहन चलाएं', 'बाढ़ की आशंका होने पर ब्रेकर से बिजली बंद कर दें'] },
  ],
  Kannada: [
    { title: 'ಕುಟುಂಬ ಯೋಜನೆ ರೂಪಿಸಿ', steps: ['ಎರಡು ಭೇಟಿ ಸ್ಥಳಗಳನ್ನು ಗುರುತಿಸಿ — ಒಂದು ಮನೆಯ ಬಳಿ, ಇನ್ನೊಂದು ನಿಮ್ಮ ನೆರೆಹೊರೆಯ ಹೊರಗೆ', 'ಪ್ರತಿ ಕುಟುಂಬ ಸದಸ್ಯರ ಫೋನ್‌ನಲ್ಲಿ ತುರ್ತು ಸಂಪರ್ಕಗಳನ್ನು ಉಳಿಸಿ', 'ಪಾತ್ರಗಳನ್ನು ನಿಗದಿಪಡಿಸಿ: ಕಿಟ್ ಯಾರು ಒಯ್ಯುತ್ತಾರೆ, ಹಿರಿಯ ನೆರೆಹೊರೆಯವರನ್ನು ಯಾರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ', 'ವರ್ಷಕ್ಕೊಮ್ಮೆಯಾದರೂ ನಿಮ್ಮ ಸ್ಥಳಾಂತರ ಮಾರ್ಗವನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ'] },
    { title: '72-ಗಂಟೆಗಳ ಕಿಟ್ ಸಿದ್ಧಪಡಿಸಿ', steps: ['3 ದಿನಗಳ ನೀರು (ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ ಪ್ರತಿ ದಿನ 1 ಗ್ಯಾಲನ್)', 'ಹಾಳಾಗದ ಆಹಾರ, ಕೈಯಾರೆ ಕ್ಯಾನ್ ಓಪನರ್, ಪಾತ್ರೆಗಳು', 'ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಕಿಟ್, ಔಷಧಿಗಳು, ದಾಖಲೆಗಳ ಪ್ರತಿಗಳು', 'ಟಾರ್ಚ್, ಬ್ಯಾಟರಿಗಳು, ಸೀಟಿ, ಧೂಳಿನ ಮಾಸ್ಕ್‌ಗಳು, ಸ್ಥಳೀಯ ನಕ್ಷೆಗಳು'] },
    { title: 'ಮಾಹಿತಿ ಪಡೆಯುತ್ತಿರಿ', steps: ['ನಿಮ್ಮ ಪ್ರದೇಶದ SMS ಎಚ್ಚರಿಕೆಗಳಿಗಾಗಿ OARFIN ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ', 'IMD ಮತ್ತು NDMA ಅಧಿಕೃತ ಚಾನೆಲ್‌ಗಳನ್ನು ಅನುಸರಿಸಿ', 'ನಿಮ್ಮ ಜಿಲ್ಲೆಯ ಎಚ್ಚರಿಕೆ ಸೈರನ್ ಸಂಕೇತಗಳನ್ನು ತಿಳಿಯಿರಿ', 'ಬ್ಯಾಟರಿ ಅಥವಾ ಕೈ-ಚಾಲಿತ ರೇಡಿಯೊ ಇಟ್ಟುಕೊಳ್ಳಿ'] },
    { title: 'ಪ್ರವಾಹ ಸನ್ನದ್ಧತೆ', steps: ['ನಿಮ್ಮ ಪ್ರವಾಹ ವಲಯ ತಿಳಿಯಿರಿ — NDMA ಪ್ರವಾಹ ನಕ್ಷೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ', 'ಬೆಲೆಬಾಳುವ ವಸ್ತುಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಎತ್ತರದ ಮಹಡಿಗಳಿಗೆ ಸ್ಥಳಾಂತರಿಸಿ', 'ಪ್ರವಾಹದ ನೀರಿನಲ್ಲಿ ಎಂದಿಗೂ ನಡೆಯಬೇಡಿ ಅಥವಾ ವಾಹನ ಚಲಾಯಿಸಬೇಡಿ', 'ಪ್ರವಾಹದ ಭೀತಿಯಿದ್ದರೆ ಬ್ರೇಕರ್‌ನಲ್ಲಿ ವಿದ್ಯುತ್ ಆಫ್ ಮಾಡಿ'] },
  ],
  Tamil: [
    { title: 'குடும்பத் திட்டம் தயாரிக்கவும்', steps: ['இரண்டு சந்திப்பு இடங்களைக் குறிக்கவும் — ஒன்று வீட்டிற்கு அருகில், மற்றொன்று உங்கள் வட்டாரத்திற்கு வெளியே', 'ஒவ்வொரு குடும்ப உறுப்பினரின் தொலைபேசியிலும் அவசர தொடர்புகளைச் சேமிக்கவும்', 'பொறுப்புகளை நிர்ணயிக்கவும்: கிட் யார் எடுத்துச் செல்வார்கள், வயதான அண்டை வீட்டாரை யார் பார்த்துக்கொள்வார்கள்', 'ஆண்டுக்கு ஒருமுறையாவது வெளியேற்ற வழியைப் பயிற்சி செய்யவும்'] },
    { title: '72 மணி நேர கிட் தயாரிக்கவும்', steps: ['3 நாட்களுக்கான தண்ணீர் (ஒரு நபருக்கு ஒரு நாளைக்கு 1 காலன்)', 'கெடாத உணவு, கை கேன் ஓப்பனர், பாத்திரங்கள்', 'முதலுதவி பெட்டி, மருந்துகள், ஆவணங்களின் நகல்கள்', 'டார்ச், பேட்டரிகள், விசில், தூசி முகக்கவசங்கள், உள்ளூர் வரைபடங்கள்'] },
    { title: 'தகவல் அறிந்திருங்கள்', steps: ['உங்கள் பகுதியில் SMS எச்சரிக்கைகளுக்கு OARFIN இல் பதிவு செய்யவும்', 'IMD மற்றும் NDMA அதிகாரப்பூர்வ சேனல்களைப் பின்பற்றவும்', 'உங்கள் மாவட்டத்தின் எச்சரிக்கை சைரன் சமிக்ஞைகளை அறிந்திருங்கள்', 'பேட்டரி அல்லது கை-சுழற்சி ரேடியோவை வைத்திருங்கள்'] },
    { title: 'வெள்ளத் தயார்நிலை', steps: ['உங்கள் வெள்ள மண்டலத்தை அறியவும் — NDMA வெள்ள வரைபடங்களைச் சரிபார்க்கவும்', 'மதிப்புமிக்க பொருட்களையும் ஆவணங்களையும் உயரமான தளங்களுக்கு நகர்த்தவும்', 'வெள்ள நீரில் ஒருபோதும் நடக்கவோ வாகனம் ஓட்டவோ வேண்டாம்', 'வெள்ளம் ஏற்படும் அபாயம் இருந்தால் பிரேக்கரில் மின்சாரத்தை அணைக்கவும்'] },
  ],
  Marathi: [
    { title: 'कौटुंबिक योजना तयार करा', steps: ['दोन भेटीची ठिकाणे ठरवा — एक घराजवळ, एक तुमच्या परिसराबाहेर', 'प्रत्येक कुटुंब सदस्याच्या फोनमध्ये आपत्कालीन संपर्क साठवा', 'भूमिका ठरवा: किट कोण घेऊन जाईल, वृद्ध शेजाऱ्यांची काळजी कोण घेईल', 'वर्षातून किमान एकदा निर्वासन मार्गाचा सराव करा'] },
    { title: '72 तासांची किट तयार करा', steps: ['3 दिवसांचे पाणी (प्रति व्यक्ती प्रति दिन 1 गॅलन)', 'न खराब होणारे अन्न, हाताने चालणारा कॅन ओपनर, भांडी', 'फर्स्ट एड किट, आवश्यक औषधे, कागदपत्रांच्या प्रती', 'टॉर्च, बॅटरी, शिट्टी, धूळ मास्क, स्थानिक नकाशे'] },
    { title: 'माहितीपूर्ण रहा', steps: ['तुमच्या भागातील SMS सूचनांसाठी OARFIN वर नोंदणी करा', 'IMD आणि NDMA च्या अधिकृत माध्यमांचे अनुसरण करा', 'तुमच्या जिल्ह्याचे इशारा सायरन संकेत जाणून घ्या', 'बॅटरी किंवा हात-चलित रेडिओ जवळ ठेवा'] },
    { title: 'पूर सज्जता', steps: ['तुमचा पूर क्षेत्र जाणून घ्या — NDMA पूर नकाशे तपासा', 'मौल्यवान वस्तू आणि कागदपत्रे उंच मजल्यांवर हलवा', 'पुराच्या पाण्यातून कधीही चालू नका किंवा वाहन चालवू नका', 'पूर येण्याची शक्यता असल्यास ब्रेकरवरून वीज बंद करा'] },
  ],
  Gujarati: [
    { title: 'કૌટુંબિક યોજના બનાવો', steps: ['બે મળવાના સ્થળો નક્કી કરો — એક ઘરની નજીક, એક તમારા પડોશની બહાર', 'દરેક કુટુંબના સભ્યના ફોનમાં કટોકટીના સંપર્કો સાચવો', 'ભૂમિકાઓ સોંપો: કિટ કોણ લઈ જશે, વૃદ્ધ પડોશીઓની તપાસ કોણ કરશે', 'વર્ષમાં ઓછામાં ઓછું એકવાર તમારા બહાર નીકળવાના માર્ગનો અભ્યાસ કરો'] },
    { title: '72-કલાકની કિટ બનાવો', steps: ['3 દિવસનું પાણી (વ્યક્તિ દીઠ દિવસ દીઠ 1 ગેલન)', 'ન બગડે તેવો ખોરાક, હાથથી ચાલતું કેન ઓપનર, વાસણો', 'ફર્સ્ટ એઇડ કિટ, જરૂરી દવાઓ, દસ્તાવેજોની નકલો', 'ટોર્ચ, બેટરી, સીટી, ધૂળ માસ્ક, સ્થાનિક નકશા'] },
    { title: 'માહિતગાર રહો', steps: ['તમારા વિસ્તારમાં SMS ચેતવણીઓ માટે OARFIN પર નોંધણી કરો', 'IMD અને NDMA ના સત્તાવાર ચેનલોને અનુસરો', 'તમારા જિલ્લાના ચેતવણી સાયરન સંકેતો જાણો', 'બેટરી અથવા હેન્ડ-ક્રેન્ક રેડિયો પાસે રાખો'] },
    { title: 'પૂર માટેની તૈયારી', steps: ['તમારો પૂર ઝોન જાણો — NDMA પૂર નકશા તપાસો', 'કિંમતી ચીજવસ્તુઓ અને દસ્તાવેજો ઊંચા માળે ખસેડો', 'પૂરના પાણીમાં ક્યારેય ચાલશો નહીં કે વાહન ચલાવશો નહીં', 'પૂરની શક્યતા હોય તો બ્રેકરથી વીજળી બંધ કરો'] },
  ],
  Telugu: [
    { title: 'కుటుంబ ప్రణాళిక రూపొందించండి', steps: ['రెండు కలిసే ప్రదేశాలను గుర్తించండి — ఒకటి ఇంటికి దగ్గర, ఒకటి మీ పరిసర ప్రాంతానికి బయట', 'ప్రతి కుటుంబ సభ్యుని ఫోన్‌లో అత్యవసర సంప్రదింపులను సేవ్ చేయండి', 'పాత్రలను నిర్ణయించండి: కిట్ ఎవరు తీసుకువెళతారు, వృద్ధ పొరుగువారిని ఎవరు చూసుకుంటారు', 'సంవత్సరానికి కనీసం ఒకసారి మీ తరలింపు మార్గాన్ని సాధన చేయండి'] },
    { title: '72-గంటల కిట్ తయారు చేయండి', steps: ['3 రోజుల నీరు (వ్యక్తికి రోజుకు 1 గ్యాలన్)', 'పాడవని ఆహారం, చేతి కాన్ ఓపెనర్, పాత్రలు', 'ఫస్ట్ ఎయిడ్ కిట్, అవసరమైన మందులు, పత్రాల నకళ్లు', 'టార్చ్, బ్యాటరీలు, విజిల్, డస్ట్ మాస్క్‌లు, స్థానిక మ్యాప్‌లు'] },
    { title: 'సమాచారం తెలుసుకోండి', steps: ['మీ ప్రాంతంలో SMS హెచ్చరికల కోసం OARFIN లో నమోదు చేసుకోండి', 'IMD మరియు NDMA అధికారిక ఛానెల్‌లను అనుసరించండి', 'మీ జిల్లా హెచ్చరిక సైరన్ సంకేతాలను తెలుసుకోండి', 'బ్యాటరీ లేదా హ్యాండ్-క్రాంక్ రేడియోను అందుబాటులో ఉంచుకోండి'] },
    { title: 'వరద సన్నద్ధత', steps: ['మీ వరద జోన్‌ను తెలుసుకోండి — NDMA వరద మ్యాప్‌లను తనిఖీ చేయండి', 'విలువైన వస్తువులను మరియు పత్రాలను ఎత్తైన అంతస్తులకు తరలించండి', 'వరద నీటిలో ఎప్పుడూ నడవవద్దు లేదా వాహనం నడపవద్దు', 'వరద ముంచెత్తే ప్రమాదం ఉంటే బ్రేకర్ వద్ద విద్యుత్తును ఆపివేయండి'] },
  ],
};


// ── Navbar ───────────────────────────────────────────────────────────
// Horizontal top nav, active from the second page onward -- fixed to the
// viewport (not sticky) so it can fully collapse offscreen while the Hero's
// VerticalNav is showing, then slide/fade in once the hero scrolls out.
function Navbar({ onLoginClick, onRegisterClick, lang, onNavClick, hidden, darkMode, onDarkToggle }) {
  const t = T[lang];
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navKeys = ['dashboard', 'alerts', 'resources', 'preparedness', 'about'];

  const handleNav = (idx) => {
    setMenuOpen(false);
    onNavClick(navKeys[idx]);
  };

  return (
    <nav style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--border-subtle)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.08)' : 'none', opacity: hidden ? 0 : 1, transform: hidden ? 'translateY(-100%)' : 'translateY(0)', pointerEvents: hidden ? 'none' : 'auto', transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease, box-shadow 0.3s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 62, gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <OarfinLogo size={26} color="var(--color-primary)" />
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '0.06em' }}>OARFIN</span>
        </div>
        <div style={{ display: 'flex', gap: '0.1rem', flex: 1, justifyContent: 'center' }} className="desktop-nav">
          {t.navLinks.map((l, i) => (
            <button key={l} onClick={() => handleNav(i)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--nav-link)', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.target.style.background = 'var(--bg-section)'; e.target.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--nav-link)'; }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={onDarkToggle} title="Toggle Dark Mode" aria-label="Toggle dark mode"
            style={{ background: 'var(--bg-section)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem' }}>
            <i className={`fa-solid ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>
          <button className="btn-modern" onClick={onLoginClick} style={{ background: 'none', border: 'none', fontSize: '0.88rem', color: 'var(--color-primary)', fontWeight: 600, padding: '0.4rem 0.6rem', cursor: 'pointer' }}>
            {t.signIn}
          </button>
          <button className="btn-modern" onClick={onRegisterClick} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.45rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(37,99,235,0.25)', cursor: 'pointer' }}>
            {t.emergencyLogin}
          </button>
        </div>
        <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-primary)', cursor: 'pointer' }} className="hamburger">
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>
      {menuOpen && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--nav-bg)', padding: '0.5rem 1.5rem 1rem' }}>
          {t.navLinks.map((l, i) => (
            <button key={l} onClick={() => handleNav(i)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0', fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border-subtle)', cursor: 'pointer' }}>{l}</button>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button onClick={onLoginClick} style={{ flex: 1, background: 'none', border: '1px solid var(--color-primary)', borderRadius: 6, padding: '0.5rem', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>{t.signIn}</button>
            <button onClick={onRegisterClick} style={{ flex: 1, background: 'var(--color-primary)', border: 'none', borderRadius: 6, padding: '0.5rem', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{t.emergencyLogin}</button>
            <button onClick={onDarkToggle} title="Toggle Dark Mode" aria-label="Toggle dark mode"
              style={{ background: 'var(--bg-section)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '0.5rem 0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <i className={`fa-solid ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}


// ── VerticalNav — first-page-only nav overlay: OARFIN logo + nav links in a
// horizontal row along the top-left of the hero. Same translucent text
// treatment as the original stacked-column version (no background box, just
// upright letter-spaced text that brightens on hover) -- only the layout
// direction changed, column -> row.
function VerticalNav({ lang, onNavClick, darkMode = true }) {
  const t = T[lang];
  const navKeys = ['dashboard', 'alerts', 'resources', 'preparedness', 'about'];
  const base = darkMode ? '#fff' : '#0f172a';
  const dim = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.65)';
  return (
    <div className="vertical-nav" style={{ position: 'absolute', top: '1.75rem', left: '1.75rem', zIndex: 3, display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <OarfinLogo size={22} color={base} />
        <span style={{ fontWeight: 800, fontSize: '1rem', color: base, letterSpacing: '0.06em' }}>OARFIN</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {t.navLinks.map((l, i) => (
          <button key={l} onClick={() => onNavClick(navKeys[i])}
            style={{ background: 'none', border: 'none', color: dim, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '0.15rem 0', textAlign: 'left', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color = base; }}
            onMouseLeave={e => { e.currentTarget.style.color = dim; }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}


// GDACS event-type -> marker styling, matching the color language used
// elsewhere in the app (ALERTS_DATA/DisasterFilter).
const GDACS_TYPE_STYLE = {
  EQ: { color: '#A78BFA', label: 'Earthquake' },
  FL: { color: '#3B82F6', label: 'Flood' },
  TC: { color: '#EF4444', label: 'Cyclone' },
  VO: { color: '#F97316', label: 'Volcano' },
  DR: { color: '#CA8A04', label: 'Drought' },
  WF: { color: '#F59E0B', label: 'Wildfire' },
};
// Real on-land fallback (Gulf Coast FL / Southern CA / Bangladesh delta,
// verified earlier against actual coastline data) used only if the live
// GDACS fetch fails or is empty, so the globe never has to show nothing.
const FALLBACK_PINS = [
  { color: '#EF4444', label: 'Hurricane', lat: 26, lon: -81 },
  { color: '#F59E0B', label: 'Wildfire', lat: 36, lon: -119 },
  { color: '#3B82F6', label: 'Flood', lat: 23, lon: 90 },
];

// ── Hero ─────────────────────────────────────────────────────────────
function Hero({ onLoginClick, onRegisterClick, onNavClick, lang, onLangChange, showVerticalNav = true }) {
  const t = T[lang];
  const [pins, setPins] = useState(FALLBACK_PINS);
  // Hero (the site's first page) always renders in dark mode -- light
  // mode is intentionally not offered here, regardless of the rest of
  // the site's theme preference. No toggle is rendered for it either.
  const darkMode = true;

  useEffect(() => {
    let cancelled = false;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 14);
    axios.get(
      `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,FL,TC,VO,DR,WF&fromdate=${fromDate.toISOString().split('T')[0]}&todate=&alertlevel=&country=&limit=50`
    ).then(res => {
      if (cancelled) return;
      const features = res.data?.features || [];
      const realPins = features
        .filter(f => Array.isArray(f.geometry?.coordinates) && f.geometry.coordinates.length >= 2)
        .slice(0, 6)
        .map(f => {
          const type = f.properties?.eventtype;
          const style = GDACS_TYPE_STYLE[type] || { color: '#94A3B8', label: type || 'Event' };
          const [lon, lat] = f.geometry.coordinates;
          return { ...style, lat, lon };
        });
      if (realPins.length > 0) setPins(realPins);
    }).catch(() => { /* keep the fallback pins */ });
    return () => { cancelled = true; };
  }, []);

  const heroText = darkMode ? '#fff' : '#0f172a';
  const heroTextMuted = darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.72)';
  const heroTextFaint = darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
  const heroTextStrong = darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)';
  const heroPillBg = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
  const heroPillBorder = darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.14)';
  const heroBtnBg = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const heroBtnBorder = darkMode ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.16)';

  return (
    <section id="dashboard-section" style={{ position: 'relative', overflow: 'hidden', background: darkMode ? 'radial-gradient(ellipse at 65% 90%, #0c1024 0%, #05060f 45%, #000000 100%)' : 'radial-gradient(ellipse at 65% 90%, #ffffff 0%, #fffdf4 30%, #fff8e0 55%, #ffefb8 80%, #ffe28f 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Globe3D scrollContainerId="dashboard-section" markers={pins} darkMode={darkMode} />
      {showVerticalNav && <VerticalNav lang={lang} onNavClick={onNavClick} onLoginClick={onLoginClick} darkMode={darkMode} />}
      <div style={{ position: 'absolute', top: '1.75rem', right: '1.75rem', zIndex: 4, display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <select
          value={lang}
          onChange={e => onLangChange(e.target.value)}
          aria-label="Language"
          style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.78rem', borderRadius: 6, background: heroBtnBg, color: heroText, border: `1px solid ${heroBtnBorder}`, cursor: 'pointer' }}>
          <option style={{ color: '#111' }}>English</option>
          <option style={{ color: '#111' }}>Hindi</option>
          <option style={{ color: '#111' }}>Kannada</option>
          <option style={{ color: '#111' }}>Tamil</option>
          <option style={{ color: '#111' }}>Marathi</option>
          <option style={{ color: '#111' }}>Gujarati</option>
          <option style={{ color: '#111' }}>Telugu</option>
        </select>
        <button className="btn-modern" onClick={onLoginClick} style={{ background: 'none', border: 'none', color: heroText, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: '0.4rem 0.2rem' }}>
          {t.signIn}
        </button>
        <button className="btn-modern" onClick={onRegisterClick} style={{ background: darkMode ? '#fff' : '#0f172a', color: darkMode ? '#0a1e4d' : '#fff', border: 'none', borderRadius: 999, padding: '0.55rem 1.2rem', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }}>
          {t.createAccount}
        </button>
      </div>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '5rem 1.5rem', width: '100%', pointerEvents: 'none' }}>
        <div style={{ flex: '0 1 590px', maxWidth: 590, pointerEvents: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: heroPillBg, border: `1px solid ${heroPillBorder}`, borderRadius: 20, padding: '0.3rem 0.9rem', marginBottom: '1.5rem', backdropFilter: 'blur(6px)' }}>
            <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.78rem', color: heroTextStrong, fontWeight: 600, letterSpacing: '0.04em' }}>{t.systemOperational}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 2.9vw, 2.6rem)', fontWeight: 600, textTransform: 'uppercase', color: heroText, lineHeight: 1.18, marginBottom: '1.3rem', letterSpacing: '0.005em', overflowWrap: 'break-word' }}>
            {t.heroTitle1}<br />
            <span style={{ color: darkMode ? '#5b8fff' : '#2563eb' }}>{t.heroTitle2}</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: heroTextMuted, marginBottom: '2rem', maxWidth: 480, lineHeight: 1.7 }}>{t.heroDesc}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.25rem' }} className="animate-fade-in delay-200">
            <button className="btn-modern" onClick={onLoginClick} style={{ pointerEvents: 'auto', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.75rem 1.6rem', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', cursor: 'pointer' }}>
              <i className="fa-solid fa-gauge-high" style={{ marginRight: '0.5rem' }}></i>{t.viewDashboard}
            </button>
            <button className="btn-modern" onClick={onLoginClick} style={{ pointerEvents: 'auto', background: 'transparent', color: '#ff6b6b', border: '2px solid #ff6b6b', borderRadius: 10, padding: '0.75rem 1.6rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ff6b6b'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff6b6b'; }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i>{t.reportEmergency}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            {[['fa-building-columns', t.operatedBy], ['fa-clock', t.monitoring], ['fa-server', t.uptime]].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: heroTextFaint }}>
                <i className={`fa-solid ${icon}`} style={{ color: darkMode ? '#5b8fff' : '#2563eb' }}></i>{text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


// ── Active Alerts + Stats — two vertical columns: alert feed | live numbers ──
function AlertsAndStats({ lang }) {
  const t = T[lang];
  const [expanded, setExpanded] = useState(null);
  const vals = ['1,240', '3,800+', '420+', '< 2 min'];
  const icons = ['fa-users', 'fa-bell', 'fa-house-chimney-medical', 'fa-clock-rotate-left'];
  return (
    <section id="alerts-section" style={{ background: 'var(--alert-section-bg)', borderBottom: '1px solid var(--border-subtle)', padding: '3.5rem 0', transition: 'background 0.4s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="alerts-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left column — Live Alert Feed */}
          <div>
            <Reveal style={{ marginBottom: '0.75rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ color: 'var(--color-critical)' }}></i>
                {t.alertsTitle}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t.alertsDesc}</p>
            </Reveal>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
              <a href="#" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {t.viewArchive} <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
              </a>
            </div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {ALERTS_DATA.map((alert, i) => (
                <Reveal key={i} delay={i * 130}>
                  <div onClick={() => setExpanded(expanded === i ? null : i)}
                    className="card-hover"
                    style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '1.25rem', cursor: 'pointer', borderLeft: `4px solid ${alert.color}`, border: `1px solid var(--card-border)`, transition: 'background 0.4s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className={`fa-solid ${alert.icon}`} style={{ color: alert.color, fontSize: '1rem' }}></i>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{alert.title}</span>
                      </div>
                      <span style={{ background: alert.badgeBg, color: '#fff', fontSize: '0.66rem', fontWeight: 800, padding: '0.18rem 0.55rem', borderRadius: 4, letterSpacing: '0.06em' }}>{alert.badge}</span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{alert.meta}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: alert.color }}>{alert.status}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Updated {alert.updated}</span>
                    </div>
                    {expanded === i && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--expanded-border)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--expanded-text)', marginBottom: '0.5rem', lineHeight: 1.6 }}>{alert.detail}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source: {alert.source}</p>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Right column — active-alerts ticker, then live numbers */}
          <div>
            <Reveal style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#1E1400', border: '1px solid #3D2E00', borderRadius: 8, padding: '0.6rem 0.9rem', overflow: 'hidden' }}>
                <span style={{ background: '#D32F2F', color: '#fff', fontSize: '0.66rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 3, whiteSpace: 'nowrap', letterSpacing: '0.04em', flexShrink: 0 }}>
                  ● {t.activeAlerts}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E3B341', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ALERTS_DATA[1].title} — {ALERTS_DATA[1].meta} — {t.updatedAgo}
                </span>
              </div>
            </Reveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {vals.map((v, i) => (
                <Reveal key={i} delay={i * 130} once={false}>
                  <div style={{ background: 'var(--color-primary)', borderRadius: 12, padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className={`fa-solid ${icons[i]}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.3rem', width: 28, flexShrink: 0 }}></i>
                    <div>
                      <div style={{ fontSize: 'clamp(1.8rem, 2.4vw, 2.4rem)', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>{v}</div>
                      <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.3rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.statsLabels[i]}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ── Resources Section ────────────────────────────────────────────────
function Resources({ lang }) {
  const t = T[lang];
  const items = (RESOURCES_DATA_BY_LANG[lang] || RESOURCES_DATA_BY_LANG.English)
    .map((r, i) => ({ ...r, ...RESOURCES_META[i] }));
  return (
    <>
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t.resourcesDesc}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {items.map((r, i) => (
          <Reveal key={i} delay={i * 100}>
            <a href={r.link}
              className="card-hover"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '1.5rem', textDecoration: 'none', display: 'block', transition: 'background 0.4s ease' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <i className={`fa-solid ${r.icon}`} style={{ color: r.color, fontSize: '1.25rem' }}></i>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{r.title}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>{r.desc}</div>
              <span style={{ fontSize: '0.84rem', color: r.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {t.learnMore} <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.72rem' }}></i>
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </>
  );
}

// ── Preparedness Section ─────────────────────────────────────────────
function Preparedness({ lang }) {
  const t = T[lang];
  const items = (PREPAREDNESS_DATA_BY_LANG[lang] || PREPAREDNESS_DATA_BY_LANG.English)
    .map((item, i) => ({ ...item, ...PREPAREDNESS_META[i] }));
  return (
    <>
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t.preparednessDesc}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="card-hover"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '1.5rem', transition: 'background 0.4s ease' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: '1.25rem' }}></i>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{item.title}</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {item.steps.map((step, j) => (
                  <li key={j} style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.35rem' }}>{step}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}


// ── About Section ────────────────────────────────────────────────────
function About({ lang }) {
  const t = T[lang];
  return (
    <>
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 340px' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.5rem' }}>{t.aboutDesc}</p>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-bullseye" style={{ color: 'var(--color-primary)' }}></i> {t.aboutMission}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{t.aboutMissionDesc}</p>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t.aboutTeam}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.9rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: 999, padding: '0.4rem 0.9rem' }}>
              <i className="fa-solid fa-trophy" style={{ color: '#F59E0B', fontSize: '0.85rem' }}></i>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.aboutAchievement}</span>
            </div>
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }}></i> What OARFIN Does
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {t.aboutFeatures.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.65rem' }}>
                    <i className="fa-solid fa-check" style={{ color: '#10B981', marginTop: '0.2rem', flexShrink: 0 }}></i>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-link" style={{ color: 'var(--color-primary)' }}></i> {t.aboutLiveDeployments}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <a href="https://oarfin-website-nine.vercel.app" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                  <i className="fa-brands fa-vercel"></i> {t.aboutWebsiteLink}
                </a>
                <a href="https://oarfin-server.onrender.com" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                  <i className="fa-solid fa-server"></i> {t.aboutServerLink}
                </a>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}


// ── InfoTabs — horizontal tab bar switching between Resources / Preparedness / About ──
const INFO_TABS = [
  { key: 'resources', icon: 'fa-box-open' },
  { key: 'preparedness', icon: 'fa-shield-halved' },
  { key: 'about', icon: 'fa-circle-info' },
];

function InfoTabs({ lang, activeTab, setActiveTab }) {
  const t = T[lang];
  const labels = { resources: t.resourcesTitle, preparedness: t.preparednessTitle, about: t.aboutTitle };
  const panels = { resources: <Resources lang={lang} />, preparedness: <Preparedness lang={lang} />, about: <About lang={lang} /> };

  return (
    <section id="info-tabs-section" style={{ background: 'var(--hero-bg)', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.4s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
          {INFO_TABS.map(({ key, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '1.1rem 1.4rem', marginBottom: '-1px',
                fontFamily: 'var(--font)', fontSize: '0.85rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: activeTab === key ? 'var(--color-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}>
              <i className={`fa-solid ${icon}`}></i>
              {labels[key]}
            </button>
          ))}
        </div>
        <Reveal style={{ padding: '2.5rem 0' }}>
          {panels[activeTab]}
        </Reveal>
      </div>
    </section>
  );
}


// ── Footer ───────────────────────────────────────────────────────────
function Footer({ lang }) {
  const t = T[lang];
  return (
    <footer style={{ background: 'var(--footer-bg)', color: 'var(--footer-text)', padding: '2.5rem 0 1.5rem', transition: 'background 0.4s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <OarfinLogo size={24} color="var(--color-primary)" />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.06em' }}>OARFIN</span>
            </div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--footer-text)' }}>{t.footerDesc}</p>
          </div>
          {[[t.platform, t.platformLinks], [t.support, t.supportLinks]].map(([title, links]) => (
            <div key={title} style={{ flex: '1 1 140px' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</div>
              {links.map(l => (
                <div key={l} style={{ marginBottom: '0.45rem' }}>
                  <a href="#" style={{ color: 'var(--footer-link)', fontSize: '0.84rem', transition: 'color 0.2s', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = '#fff'}
                    onMouseLeave={e => e.target.style.color = 'var(--footer-link)'}>{l}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--footer-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem' }}>{t.footerRights}</span>
          <span style={{ fontSize: '0.78rem' }}>{t.footerNote}</span>
        </div>
      </div>
    </footer>
  );
}


// ── Auth Modal ───────────────────────────────────────────────────────
function AuthModal({ tab, onClose, onSuccess, lang }) {
  const t = T[lang];
  const [activeTab, setActiveTab] = useState(tab || 'login');
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => { setActiveTab(tab || 'login'); }, [tab]);
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); setServerError(''); };

  const validateLogin = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };
  const validateRegister = () => {
    const e = {};
    if (!form.firstName) e.firstName = 'Required';
    if (!form.lastName) e.lastName = 'Required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.mobile) e.mobile = 'Mobile is required for alerts';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    if (!form.userType) e.userType = 'Please select a user type';
    if (!form.terms) e.terms = 'You must accept the terms';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = activeTab === 'login' ? validateLogin() : validateRegister();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (activeTab === 'login') {
        const res = await axios.post(`${SERVER_URL}/api/users/login`, { email: form.email, password: form.password });
        localStorage.setItem('oarfin_token', res.data.token);
        localStorage.setItem('oarfin_user', JSON.stringify(res.data.user));
        onSuccess(res.data.user);
      } else {
        await axios.post(`${SERVER_URL}/api/users/register`, { firstName: form.firstName, lastName: form.lastName, email: form.email, mobile: form.mobile, password: form.password, userType: form.userType });
        const res = await axios.post(`${SERVER_URL}/api/users/login`, { email: form.email, password: form.password });
        localStorage.setItem('oarfin_token', res.data.token);
        localStorage.setItem('oarfin_user', JSON.stringify(res.data.user));
        onSuccess(res.data.user);
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '0.9rem' }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--label-color)', marginBottom: '0.3rem' }}>{label}</label>
      <input type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{ borderColor: errors[key] ? 'var(--color-critical)' : undefined, background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
      {errors[key] && <span style={{ fontSize: '0.75rem', color: 'var(--color-critical)', marginTop: '0.2rem', display: 'block' }}>{errors[key]}</span>}
    </div>
  );

  return (
    <div className="animate-fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--modal-overlay)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} data-lenis-prevent className="animate-slide-up" style={{ background: 'var(--modal-bg)', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', transition: 'background 0.4s ease' }}>
        <div style={{ padding: '1.25rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <OarfinLogo size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '0.05em' }}>OARFIN</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: 'var(--text-secondary)', padding: '0.25rem', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', margin: '1rem 1.5rem 0', gap: '1.5rem' }}>
          {['login', 'register'].map(tabKey => (
            <button key={tabKey} onClick={() => { setActiveTab(tabKey); setErrors({}); setServerError(''); }}
              style={{ background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '0.9rem', fontWeight: 700, color: activeTab === tabKey ? 'var(--color-primary)' : 'var(--text-secondary)', borderBottom: activeTab === tabKey ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -1, transition: 'all 0.2s', cursor: 'pointer' }}>
              {tabKey === 'login' ? t.signInBtn : t.createAccount}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem' }}>
          {serverError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '0.6rem 0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-critical)' }}>
              {serverError}
            </div>
          )}
          {activeTab === 'login' ? (
            <>
              {field('email', t.emailLabel, 'email', 'you@example.com')}
              {field('password', t.passwordLabel, 'password')}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--label-color)', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 'auto' }} onChange={e => set('remember', e.target.checked)} /> {t.keepSignedIn}
                </label>
                <a href="#" style={{ fontSize: '0.82rem', color: 'var(--color-primary)' }}>{t.forgotPassword}</a>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                {field('firstName', t.firstName)}
                {field('lastName', t.lastName)}
              </div>
              {field('email', t.emailLabel, 'email', 'you@example.com')}
              {field('mobile', t.mobileLabel, 'tel', '+91 98765 43210')}
              {field('password', t.passwordLabel, 'password')}
              {field('confirm', t.confirmPassword, 'password')}
              <div style={{ marginBottom: '0.9rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--label-color)', marginBottom: '0.3rem' }}>{t.userTypeLabel}</label>
                <select value={form.userType || ''} onChange={e => set('userType', e.target.value)} style={{ borderColor: errors.userType ? 'var(--color-critical)' : undefined }}>
                  <option value="">{t.selectUserType}</option>
                  <option value="civilian">{t.civilian}</option>
                  <option value="responder">{t.responder}</option>
                  <option value="agency">{t.agency}</option>
                  <option value="ngo">{t.ngo}</option>
                </select>
                {errors.userType && <span style={{ fontSize: '0.75rem', color: 'var(--color-critical)', marginTop: '0.2rem', display: 'block' }}>{errors.userType}</span>}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--label-color)', marginBottom: '1.25rem', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 'auto', marginTop: 2 }} onChange={e => set('terms', e.target.checked)} />
                <span>{t.termsText}</span>
              </label>
              {errors.terms && <span style={{ fontSize: '0.75rem', color: 'var(--color-critical)', display: 'block', marginTop: '-1rem', marginBottom: '0.75rem' }}>{errors.terms}</span>}
            </>
          )}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: loading ? 'var(--text-muted)' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem', fontWeight: 700, fontSize: '0.95rem', transition: 'background 0.2s', boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.25)', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? t.pleaseWait : activeTab === 'login' ? t.signInBtn : t.createAccount}
          </button>
        </form>
        <div style={{ padding: '0.75rem 1.5rem 1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-lock" style={{ marginRight: '0.3rem' }}></i>
            {t.secureSystem}
          </p>
        </div>
      </div>
    </div>
  );
}


// ── HomePage (main export) ───────────────────────────────────────────
export default function HomePage({ onLogin }) {
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState('resources');
  const [lang, setLang] = useState(() => localStorage.getItem('oarfin_lang') || 'English');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('oarfin_theme') === 'dark' ||
      (!localStorage.getItem('oarfin_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('oarfin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('oarfin_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('oarfin_lang', lang);
  }, [lang]);

  useEffect(() => {
    const fn = () => {
      if (window.location.hash === '#login') setModal('login');
      else if (window.location.hash === '#register') setModal('register');
    };
    fn();
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  const openModal = (tab) => { setModal(tab); window.location.hash = tab; };
  const closeModal = () => { setModal(null); window.location.hash = ''; };
  const handleSuccess = (user) => { closeModal(); onLogin(user); };

  // First page (hero) uses the VerticalNav overlay instead of the horizontal
  // bar; the horizontal Navbar collapses to zero height while the hero is in
  // view and expands back in once the user scrolls past it onto page two.
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const el = document.getElementById('dashboard-section');
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Below 768px the VerticalNav column doesn't fit alongside the hamburger
  // menu -- fall back to the horizontal Navbar (with its hamburger) always.
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // Real inertia/momentum smooth scrolling (Lenis) -- the reference site runs
  // the same library. Lenis smooths the native scroll position directly, so
  // window.scrollY / scroll listeners elsewhere (Navbar shadow, Globe3D scroll
  // progress, Reveal's IntersectionObserver) all benefit automatically without
  // needing to know Lenis exists; programmatic nav jumps go through
  // lenis.scrollTo so they animate with the same easing instead of snapping.
  const lenisRef = useRef(null);
  useEffect(() => {
    // autoRaf: true delegates the requestAnimationFrame loop to Lenis's own
    // internal, battle-tested scheduler instead of a hand-rolled one -- a
    // custom `raf = requestAnimationFrame(loop)` chain permanently dies if
    // any single frame throws (the reschedule call after it never runs),
    // which reproduces exactly "works once, then scrolling goes still."
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      autoRaf: true,
    });
    lenisRef.current = lenis;
    return () => { lenis.destroy(); lenisRef.current = null; };
  }, []);

  const handleNav = (key) => {
    const targetId = (key === 'resources' || key === 'preparedness' || key === 'about') ? 'info-tabs-section' : `${key}-section`;
    if (key === 'resources' || key === 'preparedness' || key === 'about') setActiveTab(key);
    const el = document.getElementById(targetId);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.3 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-mesh-flow min-h-screen">
      <Navbar onLoginClick={() => openModal('login')} onRegisterClick={() => openModal('register')} lang={lang} onNavClick={handleNav} hidden={heroVisible && !isMobile} darkMode={darkMode} onDarkToggle={() => setDarkMode(d => !d)} />
      <main>
        <Hero onLoginClick={() => openModal('login')} onRegisterClick={() => openModal('register')} onNavClick={handleNav} lang={lang} onLangChange={setLang} showVerticalNav={!isMobile} />
        <div style={{ paddingTop: (heroVisible && !isMobile) ? 0 : 62, transition: 'padding-top 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <AlertsAndStats lang={lang} />
        </div>
        <InfoTabs lang={lang} activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
      <Footer lang={lang} />
      {modal && <AuthModal tab={modal} onClose={closeModal} onSuccess={handleSuccess} lang={lang} />}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
          .alerts-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
