import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Lenis from 'lenis';
import Globe3D from './Globe3D';

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
  Spanish: {
    activeAlerts: 'ALERTAS ACTIVAS: 3',
    ticker: [
      'Huracán Maya — Categoría 4 — Evacuación ordenada en zonas costeras',
      'Incendio CA-47 — 15,240 acres — 35% contenido — Actualizado hace 4 min',
      'Alerta de inundación repentina — Región de Mumbai — 12 distritos afectados',
    ],
    navLinks: ['Panel', 'Alertas', 'Recursos', 'Preparación', 'Acerca de'],
    signIn: 'Iniciar sesión', emergencyLogin: 'Acceso de emergencia',
    heroTitle1: 'Protegiendo Comunidades',
    heroTitle2: 'Antes del Desastre',
    heroDesc: 'Plataforma oficial de coordinación de emergencias. Alertas en tiempo real, órdenes de evacuación y gestión de recursos.',
    viewDashboard: 'Ver Panel en Vivo',
    reportEmergency: 'Reportar Emergencia',
    operatedBy: 'Operado por OARFIN',
    monitoring: 'Monitoreo 24/7',
    uptime: '98.5% Disponibilidad',
    currentDeclarations: 'Declaraciones de Emergencia Actuales',
    viewArchive: 'Ver Archivo',
    quickActions: 'Acciones Rápidas',
    statsLabels: ['Personas Protegidas', 'Alertas Enviadas', 'Refugios Mapeados', 'Tiempo Promedio de Alerta'],
    footerDesc: 'Plataforma oficial de gestión de emergencias. Operada 24/7 por coordinadores certificados.',
    footerRights: '© 2026 Plataforma de Gestión de Emergencias OARFIN. Todos los derechos reservados.',
    footerNote: 'Este es un sistema oficial de gestión de emergencias. El uso no autorizado está prohibido.',
    platform: 'Plataforma', support: 'Soporte',
    platformLinks: ['Panel', 'Alertas en Vivo', 'Mapa de Incidentes', 'Recursos'],
    supportLinks: ['Centro de Ayuda', 'Contáctenos', 'Accesibilidad', 'Política de Privacidad'],
    learnMore: 'Saber más',
    updatedAgo: 'Actualizado hace 2 min',
    secureSystem: 'Este es un sistema gubernamental seguro. El uso no autorizado está prohibido.',
    signInBtn: 'Iniciar sesión', createAccount: 'Crear cuenta',
    emailLabel: 'Correo electrónico', passwordLabel: 'Contraseña',
    keepSignedIn: 'Mantenerme conectado', forgotPassword: '¿Olvidó su contraseña?',
    firstName: 'Nombre', lastName: 'Apellido',
    mobileLabel: 'Número de móvil (requerido para alertas)',
    confirmPassword: 'Confirmar contraseña', userTypeLabel: 'Tipo de usuario',
    selectUserType: 'Seleccionar tipo de usuario',
    civilian: 'Civil', responder: 'Primer respondedor',
    agency: 'Agencia gubernamental', ngo: 'ONG / Organización de ayuda',
    termsText: 'Acepto los Términos de Servicio y la Política de Privacidad',
    pleaseWait: 'Por favor espere...',
    systemOperational: 'SISTEMA OPERATIVO — 98.5% DISPONIBILIDAD',
    liveMap: 'Mapa de Incidentes Activos', live: 'En vivo',
    aboutTitle: 'Acerca de OARFIN',
    aboutDesc: 'OARFIN es una plataforma de gestión de desastres en tiempo real construida para proteger comunidades en toda la India.',
    aboutMission: 'Nuestra Misión',
    aboutMissionDesc: 'Reducir las víctimas relacionadas con desastres proporcionando información oportuna y precisa y permitiendo una coordinación más rápida.',
    aboutFeatures: ['Alertas de desastres en tiempo real de IMD, NDMA y fuentes globales', 'Mapa interactivo de incidentes con navegación a lugares seguros', 'Localizador de refugios de emergencia con datos de capacidad en vivo', 'Coordinación de recursos para agencias de ayuda', 'Soporte multilingüe para mayor alcance', 'Diseño móvil para respondedores de campo'],
    aboutTeam: 'Construido como Proyecto de Tesis de Licenciatura — enfocado en implementación real.',
    aboutAchievement: 'Subcampeón — Hackathon HackCrux',
    aboutLiveDeployments: 'Implementaciones en Vivo',
    aboutWebsiteLink: 'Sitio web (Vercel)',
    aboutServerLink: 'Servidor API (Render)',
    alertsTitle: 'Feed de Alertas en Vivo',
    alertsDesc: 'Todas las declaraciones de emergencia activas se monitorean en tiempo real.',
    resourcesTitle: 'Recursos de Emergencia',
    resourcesDesc: 'Acceda a recursos críticos para la preparación y respuesta ante desastres.',
    preparednessTitle: 'Preparación para Desastres',
    preparednessDesc: 'Esté listo antes de que ocurra un desastre. Siga estas pautas para protegerse.',
  },
};


const ALERTS_DATA = [
  { color: '#EF4444', badge: 'CRITICAL', badgeBg: '#EF4444', icon: 'fa-hurricane', title: 'Hurricane Maya', meta: 'Category 4 — ETA 18 hours', detail: 'Evacuation ordered for all coastal zones within 50km. Shelters open at designated centers.', status: 'Evacuation Ordered', source: 'National Hurricane Center', updated: '8 minutes ago' },
  { color: '#F59E0B', badge: 'HIGH', badgeBg: '#D97706', icon: 'fa-fire', title: 'Wildfire CA-47', meta: '15,240 acres — 35% contained', detail: 'Air quality index critical. Residents advised to stay indoors. Firefighting crews deployed.', status: 'Active Response', source: 'CAL FIRE', updated: '4 minutes ago' },
  { color: '#3B82F6', badge: 'MODERATE', badgeBg: '#2563EB', icon: 'fa-water', title: 'Flash Flood Warning', meta: 'Mumbai Region — 12 districts', detail: 'Heavy rainfall expected for next 6 hours. Avoid low-lying areas and river banks.', status: 'Watch Active', source: 'India Meteorological Dept', updated: '12 minutes ago' },
];

const RESOURCES_DATA = [
  { icon: 'fa-house-chimney-medical', title: 'Emergency Shelters', desc: '420+ shelters mapped across India with live capacity data. Find the nearest open shelter.', color: '#1E3A5F', link: '#' },
  { icon: 'fa-truck-medical', title: 'Relief Camps', desc: 'Active relief camps with food, water, and medical aid. Updated every 30 minutes by field teams.', color: '#1E3A5F', link: '#' },
  { icon: 'fa-phone-volume', title: 'Helpline Numbers', desc: 'NDMA: 1078 | Police: 100 | Ambulance: 108 | Fire: 101 | Flood Control: 1070', color: '#B91C1C', link: '#' },
  { icon: 'fa-map-location-dot', title: 'Evacuation Routes', desc: 'Real-time road closure data and safe evacuation corridors updated by traffic authorities.', color: '#1E3A5F', link: '#' },
  { icon: 'fa-droplet', title: 'Water & Supplies', desc: 'Locate nearest clean water distribution points and essential supply depots in your area.', color: '#1E3A5F', link: '#' },
  { icon: 'fa-hospital', title: 'Medical Facilities', desc: 'Hospitals and medical camps accepting disaster victims. Includes blood bank availability.', color: '#1E3A5F', link: '#' },
];

const PREPAREDNESS_DATA = [
  { icon: 'fa-list-check', title: 'Make a Family Plan', steps: ['Identify two meeting points — one near home, one outside your neighborhood', 'Save emergency contacts on every family member\'s phone', 'Assign roles: who carries the kit, who checks on elderly neighbors', 'Practice your evacuation route at least once a year'], color: '#1E3A5F' },
  { icon: 'fa-kit-medical', title: 'Build a 72-Hour Kit', steps: ['3 days of water (1 gallon per person per day)', 'Non-perishable food, manual can opener, utensils', 'First aid kit, prescription medications, copies of documents', 'Flashlight, batteries, whistle, dust masks, local maps'], color: '#1E3A5F' },
  { icon: 'fa-mobile-screen', title: 'Stay Informed', steps: ['Register on OARFIN for SMS alerts in your area', 'Follow IMD and NDMA on official channels', 'Know your district\'s warning siren signals', 'Keep a battery-powered or hand-crank radio'], color: '#1E3A5F' },
  { icon: 'fa-house-flood-water', title: 'Flood Preparedness', steps: ['Know your flood zone — check NDMA flood maps', 'Move valuables and documents to higher floors', 'Never walk or drive through floodwater', 'Turn off electricity at the breaker if flooding is imminent'], color: '#1E3A5F' },
];


// ── TopBar ───────────────────────────────────────────────────────────
function TopBar({ onDarkToggle, darkMode, lang, onLangChange }) {
  const t = T[lang];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % t.ticker.length), 4000);
    return () => clearInterval(timer);
  }, [t.ticker.length]);

  return (
    <div style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)', transition: 'background 0.4s ease' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.45rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, overflow: 'hidden' }}>
          <span style={{ background: '#D32F2F', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 3, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
            ● {t.activeAlerts}
          </span>
          <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--topbar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.4s ease' }}>
            {t.ticker[idx]}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <select
            value={lang}
            onChange={e => onLangChange(e.target.value)}
            style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.78rem', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-active)', cursor: 'pointer' }}>
            <option>English</option>
            <option>Hindi</option>
            <option>Spanish</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-sun" style={{ fontSize: '0.75rem', color: 'var(--topbar-text)', opacity: darkMode ? 0.4 : 1, transition: 'opacity 0.3s' }}></i>
            <button className={`theme-toggle ${darkMode ? 'active' : ''}`} onClick={onDarkToggle} title="Toggle Dark Mode" aria-label="Toggle dark mode" />
            <i className="fa-solid fa-moon" style={{ fontSize: '0.75rem', color: 'var(--topbar-text)', opacity: darkMode ? 1 : 0.4, transition: 'opacity 0.3s' }}></i>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--topbar-text)', marginLeft: '0.2rem' }}>
              {darkMode ? 'Dark' : 'Light'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Navbar ───────────────────────────────────────────────────────────
// Horizontal top nav, active from the second page onward -- fixed to the
// viewport (not sticky) so it can fully collapse offscreen while the Hero's
// VerticalNav is showing, then slide/fade in once the hero scrolls out.
function Navbar({ onLoginClick, onRegisterClick, lang, onNavClick, hidden }) {
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
          <i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-primary)', fontSize: '1.4rem' }}></i>
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
          </div>
        </div>
      )}
    </nav>
  );
}


// ── VerticalNav — first-page-only nav overlay: plain horizontal labels
// stacked in a vertical column along the left edge, matching the reference
// site's menu (upright text, not rotated -- rotated/sideways text was
// overflowing its column and causing a stray horizontal scrollbar).
function VerticalNav({ lang, onNavClick }) {
  const t = T[lang];
  const navKeys = ['dashboard', 'alerts', 'resources', 'preparedness', 'about'];
  return (
    <div className="vertical-nav" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 190, zIndex: 3, display: 'flex', flexDirection: 'column', padding: '2.25rem 0 2.25rem 1.75rem', pointerEvents: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <i className="fa-solid fa-shield-halved" style={{ color: '#fff', fontSize: '1.25rem' }}></i>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '0.06em' }}>OARFIN</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', alignItems: 'flex-start' }}>
          {t.navLinks.map((l, i) => (
            <button key={l} onClick={() => onNavClick(navKeys[i])}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '0.15rem 0', textAlign: 'left', transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── Hero ─────────────────────────────────────────────────────────────
function Hero({ onLoginClick, onRegisterClick, onNavClick, lang, showVerticalNav = true, darkMode, onDarkToggle }) {
  const t = T[lang];
  const pins = [
    { color: '#EF4444', label: 'Hurricane' },
    { color: '#F59E0B', label: 'Wildfire' },
    { color: '#3B82F6', label: 'Flood' },
  ];
  return (
    <section id="dashboard-section" style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 70% 100%, #0a1e4d 0%, #060a16 55%, #030408 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Globe3D scrollContainerId="dashboard-section" markers={pins} />
      {showVerticalNav && <VerticalNav lang={lang} onNavClick={onNavClick} onLoginClick={onLoginClick} />}
      <div style={{ position: 'absolute', top: '1.75rem', right: '1.75rem', zIndex: 4, display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <button onClick={onDarkToggle} title="Toggle Dark Mode" aria-label="Toggle dark mode"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          <i className={`fa-solid ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
        </button>
        <button className="btn-modern" onClick={onLoginClick} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: '0.4rem 0.2rem' }}>
          {t.signIn}
        </button>
        <button className="btn-modern" onClick={onRegisterClick} style={{ background: '#fff', color: '#0a1e4d', border: 'none', borderRadius: 999, padding: '0.55rem 1.2rem', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }}>
          {t.createAccount}
        </button>
      </div>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: showVerticalNav ? '5rem 1.5rem 5rem 13rem' : '5rem 1.5rem', width: '100%', pointerEvents: 'none' }}>
        <div style={{ flex: '0 1 640px', maxWidth: 640, pointerEvents: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: '0.3rem 0.9rem', marginBottom: '1.5rem', backdropFilter: 'blur(6px)' }}>
            <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '0.04em' }}>{t.systemOperational}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 2.9vw, 2.6rem)', fontWeight: 600, textTransform: 'uppercase', color: '#fff', lineHeight: 1.18, marginBottom: '1.3rem', letterSpacing: '0.005em', overflowWrap: 'break-word' }}>
            {t.heroTitle1}<br />
            <span style={{ color: '#5b8fff' }}>{t.heroTitle2}</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', marginBottom: '2rem', maxWidth: 480, lineHeight: 1.7 }}>{t.heroDesc}</p>
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
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                <i className={`fa-solid ${icon}`} style={{ color: '#5b8fff' }}></i>{text}
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
  return (
    <>
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t.resourcesDesc}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {RESOURCES_DATA.map((r, i) => (
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
  return (
    <>
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{t.preparednessDesc}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {PREPAREDNESS_DATA.map((item, i) => (
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
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}></i>
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
      <div onClick={e => e.stopPropagation()} className="animate-slide-up" style={{ background: 'var(--modal-bg)', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', transition: 'background 0.4s ease' }}>
        <div style={{ padding: '1.25rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}></i>
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
      <Navbar onLoginClick={() => openModal('login')} onRegisterClick={() => openModal('register')} lang={lang} onNavClick={handleNav} hidden={heroVisible && !isMobile} />
      <main>
        <Hero onLoginClick={() => openModal('login')} onRegisterClick={() => openModal('register')} onNavClick={handleNav} lang={lang} showVerticalNav={!isMobile} darkMode={darkMode} onDarkToggle={() => setDarkMode(d => !d)} />
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
