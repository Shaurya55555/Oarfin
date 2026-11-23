import { useState } from 'react';

// Public safety videos, grouped by hazard. Every entry was checked against
// YouTube (it exists and is public) and comes from an official agency where
// one was available: NDMA, NIDM and MoES/INCOIS in India, plus UNDRR, CDC and
// Indian news channels. Thumbnails come from YouTube's image CDN; clicking a
// card opens the video on YouTube.
const HAZARDS = [
  {
    key: 'earthquake', icon: 'fa-house-crack',
    videos: [
      { id: 'XLrp2czggB8', title: "Do's and don'ts before, during and after an earthquake", channel: 'National Institute of Disaster Management' },
      { id: 'W3DjmIcLB-I', title: "Dos and don'ts during an earthquake", channel: 'Times of India' },
    ],
  },
  {
    key: 'flood', icon: 'fa-water',
    videos: [
      { id: 'MPOEuU5cffw', title: 'Flood warning: how to protect yourself during heavy rains', channel: 'National Disaster Management Authority' },
      { id: 'WtUYQZuZ4tU', title: "Top do's and don'ts during floods", channel: 'Tips For Life' },
    ],
  },
  {
    key: 'landslide', icon: 'fa-mountain',
    videos: [
      { id: '-qQulxTy_bc', title: 'Floods and landslides: awareness, rescue and relief (Hindi)', channel: 'DD News' },
      { id: 'vb6cjukLA8Q', title: 'Stay alert and protect yourself from landslides and mudslides', channel: 'CDC' },
    ],
  },
  {
    key: 'drought', icon: 'fa-sun',
    videos: [
      { id: '28Uy2npyKv4', title: 'Socioeconomic drought management through community engagement', channel: 'National Institute of Disaster Management' },
      { id: 'iwqWiemjWeM', title: 'Flash drought: understanding risk and building resilience', channel: 'National Institute of Disaster Management' },
    ],
  },
  {
    key: 'cyclone', icon: 'fa-hurricane',
    videos: [
      { id: 'B9qR2e3xyJo', title: 'What to do before and during a cyclone', channel: 'National Disaster Management Authority of India' },
      { id: 'RrRQhSIwK8s', title: "How to prepare for a cyclone: dos and don'ts", channel: 'Kaumudy Global' },
    ],
  },
  {
    key: 'heatwave', icon: 'fa-temperature-high',
    videos: [
      { id: 'xI52AR3RTNU', title: "Do's and don'ts for travellers during a heatwave", channel: 'National Disaster Management Authority of India' },
      { id: 'igTDLHtviTk', title: "Heat wave: do's and don'ts", channel: 'Indiatimes' },
    ],
  },
  {
    key: 'tsunami', icon: 'fa-wave-square',
    videos: [
      { id: 'idB5b33EJSg', title: 'Indian Tsunami Early Warning System (INCOIS)', channel: 'MoES, Government of India' },
      { id: 'efNMm-eMLUk', title: 'How to survive a tsunami: recognise the signs and get to safety', channel: 'UNDRR' },
    ],
  },
  {
    key: 'lightning', icon: 'fa-bolt',
    videos: [
      { id: 'LzUQ1V7YjF0', title: 'How to stay safe when lightning strikes', channel: 'India Today' },
      { id: 'E3IMQ0_VeKQ', title: "India's Lightning Detection Network", channel: 'MoES, Government of India' },
    ],
  },
];

// Card titles per language (the videos themselves are in English or Hindi).
const TITLES = {
  'XLrp2czggB8': { Hindi: 'भूकंप से पहले, दौरान और बाद में क्या करें और क्या न करें', Kannada: 'ಭೂಕಂಪದ ಮೊದಲು, ಸಮಯದಲ್ಲಿ ಮತ್ತು ನಂತರ ಏನು ಮಾಡಬೇಕು, ಏನು ಮಾಡಬಾರದು', Tamil: 'நிலநடுக்கத்துக்கு முன், போது, பின் செய்ய வேண்டியவை, கூடாதவை', Marathi: 'भूकंपापूर्वी, दरम्यान आणि नंतर काय करावे आणि काय करू नये', Gujarati: 'ભૂકંપ પહેલાં, દરમિયાન અને પછી શું કરવું અને શું ન કરવું', Telugu: 'భూకంపానికి ముందు, సమయంలో, తర్వాత చేయవలసినవి, చేయకూడనివి' },
  'W3DjmIcLB-I': { Hindi: 'भूकंप के दौरान क्या करें और क्या न करें', Kannada: 'ಭೂಕಂಪದ ಸಮಯದಲ್ಲಿ ಏನು ಮಾಡಬೇಕು, ಏನು ಮಾಡಬಾರದು', Tamil: 'நிலநடுக்கத்தின்போது செய்ய வேண்டியவை, கூடாதவை', Marathi: 'भूकंपादरम्यान काय करावे आणि काय करू नये', Gujarati: 'ભૂકંપ દરમિયાન શું કરવું અને શું ન કરવું', Telugu: 'భూకంపం సమయంలో చేయవలసినవి, చేయకూడనివి' },
  'MPOEuU5cffw': { Hindi: 'बाढ़ चेतावनी: भारी बारिश में खुद को कैसे सुरक्षित रखें', Kannada: 'ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ: ಭಾರಿ ಮಳೆಯಲ್ಲಿ ನಿಮ್ಮನ್ನು ಹೇಗೆ ರಕ್ಷಿಸಿಕೊಳ್ಳುವುದು', Tamil: 'வெள்ள எச்சரிக்கை: கனமழையில் உங்களைப் பாதுகாத்துக்கொள்வது எப்படி', Marathi: 'पूर इशारा: मुसळधार पावसात स्वतःचे संरक्षण कसे करावे', Gujarati: 'પૂરની ચેતવણી: ભારે વરસાદમાં પોતાની સુરક્ષા કેવી રીતે કરવી', Telugu: 'వరద హెచ్చరిక: భారీ వర్షాల్లో మిమ్మల్ని మీరు ఎలా రక్షించుకోవాలి' },
  'WtUYQZuZ4tU': { Hindi: 'बाढ़ के दौरान प्रमुख क्या करें और क्या न करें', Kannada: 'ಪ್ರವಾಹದ ಸಮಯದಲ್ಲಿ ಪ್ರಮುಖ ಮಾಡಬೇಕಾದ ಮತ್ತು ಮಾಡಬಾರದ ಕೆಲಸಗಳು', Tamil: 'வெள்ளத்தின்போது முக்கியமாகச் செய்ய வேண்டியவை, கூடாதவை', Marathi: 'पुराच्या वेळी महत्त्वाच्या गोष्टी: काय करावे आणि काय करू नये', Gujarati: 'પૂર દરમિયાન મુખ્ય બાબતો: શું કરવું અને શું ન કરવું', Telugu: 'వరదల సమయంలో ముఖ్యమైన చేయవలసినవి, చేయకూడనివి' },
  '-qQulxTy_bc': { Hindi: 'बाढ़ और भूस्खलन: जागरूकता, बचाव और राहत', Kannada: 'ಪ್ರವಾಹ ಮತ್ತು ಭೂಕುಸಿತ: ಜಾಗೃತಿ, ರಕ್ಷಣೆ ಮತ್ತು ಪರಿಹಾರ (ಹಿಂದಿ)', Tamil: 'வெள்ளம் மற்றும் நிலச்சரிவு: விழிப்புணர்வு, மீட்பு, நிவாரணம் (இந்தி)', Marathi: 'पूर आणि भूस्खलन: जागरूकता, बचाव आणि मदत (हिंदी)', Gujarati: 'પૂર અને ભૂસ્ખલન: જાગૃતિ, બચાવ અને રાહત (હિન્દી)', Telugu: 'వరదలు మరియు కొండచరియలు: అవగాహన, రక్షణ, సహాయం (హిందీ)' },
  'vb6cjukLA8Q': { Hindi: 'भूस्खलन और कीचड़ के बहाव से सतर्क रहें और खुद को बचाएं', Kannada: 'ಭೂಕುಸಿತ ಮತ್ತು ಕೆಸರು ಕುಸಿತದಿಂದ ಎಚ್ಚರದಿಂದಿರಿ, ನಿಮ್ಮನ್ನು ರಕ್ಷಿಸಿಕೊಳ್ಳಿ', Tamil: 'நிலச்சரிவு, சேற்றுச்சரிவிலிருந்து விழிப்புடன் இருந்து உங்களைப் பாதுகாத்துக்கொள்ளுங்கள்', Marathi: 'भूस्खलन आणि चिखलप्रवाहापासून सतर्क राहा आणि स्वतःचे रक्षण करा', Gujarati: 'ભૂસ્ખલન અને કાદવના પ્રવાહથી સાવચેત રહો અને પોતાનું રક્ષણ કરો', Telugu: 'కొండచరియలు, బురద ప్రవాహాల నుంచి అప్రమత్తంగా ఉండి మిమ్మల్ని మీరు రక్షించుకోండి' },
  '28Uy2npyKv4': { Hindi: 'सामुदायिक भागीदारी से सामाजिक-आर्थिक सूखा प्रबंधन', Kannada: 'ಸಮುದಾಯ ಭಾಗವಹಿಸುವಿಕೆಯ ಮೂಲಕ ಸಾಮಾಜಿಕ-ಆರ್ಥಿಕ ಬರ ನಿರ್ವಹಣೆ', Tamil: 'சமூகப் பங்கேற்பு மூலம் சமூக-பொருளாதார வறட்சி மேலாண்மை', Marathi: 'समुदायाच्या सहभागातून सामाजिक-आर्थिक दुष्काळ व्यवस्थापन', Gujarati: 'સમુદાયની ભાગીદારી દ્વારા સામાજિક-આર્થિક દુષ્કાળ વ્યવસ્થાપન', Telugu: 'సమాజ భాగస్వామ్యంతో సామాజిక-ఆర్థిక కరువు నిర్వహణ' },
  'iwqWiemjWeM': { Hindi: 'फ्लैश ड्रॉट: जोखिम को समझना और सहनशीलता बनाना', Kannada: 'ಫ್ಲ್ಯಾಶ್ ಬರ: ಅಪಾಯ ಅರ್ಥಮಾಡಿಕೊಂಡು ಸ್ಥಿತಿಸ್ಥಾಪಕತ್ವ ಬೆಳೆಸುವುದು', Tamil: 'திடீர் வறட்சி: ஆபத்தைப் புரிந்து தாங்கும் திறனை வளர்த்தல்', Marathi: 'फ्लॅश ड्राउट: धोका समजून घेणे आणि क्षमता वाढवणे', Gujarati: 'ફ્લેશ ડ્રાઉટ: જોખમ સમજવું અને સ્થિતિસ્થાપકતા વિકસાવવી', Telugu: 'ఫ్లాష్ డ్రాట్: ప్రమాదాన్ని అర్థం చేసుకుని స్థైర్యాన్ని పెంచుకోవడం' },
  'B9qR2e3xyJo': { Hindi: 'चक्रवात से पहले और उसके दौरान क्या करें', Kannada: 'ಚಂಡಮಾರುತದ ಮೊದಲು ಮತ್ತು ಸಮಯದಲ್ಲಿ ಏನು ಮಾಡಬೇಕು', Tamil: 'புயலுக்கு முன்னும் போதும் என்ன செய்ய வேண்டும்', Marathi: 'चक्रीवादळापूर्वी आणि दरम्यान काय करावे', Gujarati: 'ચક્રવાત પહેલાં અને દરમિયાન શું કરવું', Telugu: 'తుఫానుకు ముందు మరియు సమయంలో ఏమి చేయాలి' },
  'RrRQhSIwK8s': { Hindi: 'चक्रवात की तैयारी कैसे करें: क्या करें और क्या न करें', Kannada: 'ಚಂಡಮಾರುತಕ್ಕೆ ಹೇಗೆ ಸಿದ್ಧರಾಗಬೇಕು: ಮಾಡಬೇಕಾದ ಮತ್ತು ಮಾಡಬಾರದ ಕೆಲಸಗಳು', Tamil: 'புயலுக்குத் தயாராவது எப்படி: செய்ய வேண்டியவை, கூடாதவை', Marathi: 'चक्रीवादळाची तयारी कशी करावी: काय करावे आणि काय करू नये', Gujarati: 'ચક્રવાતની તૈયારી કેવી રીતે કરવી: શું કરવું અને શું ન કરવું', Telugu: 'తుఫానుకు ఎలా సిద్ధం కావాలి: చేయవలసినవి, చేయకూడనివి' },
  'xI52AR3RTNU': { Hindi: 'लू के दौरान यात्रियों के लिए क्या करें और क्या न करें', Kannada: 'ಬಿಸಿಗಾಳಿಯ ಸಮಯದಲ್ಲಿ ಪ್ರಯಾಣಿಕರಿಗೆ ಮಾಡಬೇಕಾದ ಮತ್ತು ಮಾಡಬಾರದ ಕೆಲಸಗಳು', Tamil: 'வெப்ப அலையின்போது பயணிகள் செய்ய வேண்டியவை, கூடாதவை', Marathi: 'उष्णतेच्या लाटेत प्रवाशांसाठी काय करावे आणि काय करू नये', Gujarati: 'ગરમીના મોજા દરમિયાન મુસાફરો માટે શું કરવું અને શું ન કરવું', Telugu: 'వడగాలుల సమయంలో ప్రయాణికులు చేయవలసినవి, చేయకూడనివి' },
  'igTDLHtviTk': { Hindi: 'लू: क्या करें और क्या न करें', Kannada: 'ಬಿಸಿಗಾಳಿ: ಮಾಡಬೇಕಾದ ಮತ್ತು ಮಾಡಬಾರದ ಕೆಲಸಗಳು', Tamil: 'வெப்ப அலை: செய்ய வேண்டியவை, கூடாதவை', Marathi: 'उष्णतेची लाट: काय करावे आणि काय करू नये', Gujarati: 'ગરમીનું મોજું: શું કરવું અને શું ન કરવું', Telugu: 'వడగాలులు: చేయవలసినవి, చేయకూడనివి' },
  'idB5b33EJSg': { Hindi: 'भारतीय सुनामी पूर्व चेतावनी प्रणाली (INCOIS)', Kannada: 'ಭಾರತೀಯ ಸುನಾಮಿ ಮುನ್ನೆಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆ (INCOIS)', Tamil: 'இந்திய சுனாமி முன்னெச்சரிக்கை அமைப்பு (INCOIS)', Marathi: 'भारतीय त्सुनामी पूर्वसूचना प्रणाली (INCOIS)', Gujarati: 'ભારતીય સુનામી પૂર્વ ચેતવણી પ્રણાલી (INCOIS)', Telugu: 'భారత సునామీ ముందస్తు హెచ్చరిక వ్యవస్థ (INCOIS)' },
  'efNMm-eMLUk': { Hindi: 'सुनामी में कैसे बचें: संकेत पहचानें और सुरक्षित स्थान पर पहुंचें', Kannada: 'ಸುನಾಮಿಯಿಂದ ಹೇಗೆ ಬದುಕುವುದು: ಸೂಚನೆಗಳನ್ನು ಗುರುತಿಸಿ ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ಹೋಗಿ', Tamil: 'சுனாமியில் தப்பிப்பது எப்படி: அறிகுறிகளை அறிந்து பாதுகாப்பான இடத்துக்குச் செல்லுங்கள்', Marathi: 'त्सुनामीतून कसे वाचावे: चिन्हे ओळखा आणि सुरक्षित ठिकाणी जा', Gujarati: 'સુનામીમાંથી કેવી રીતે બચવું: સંકેતો ઓળખો અને સુરક્ષિત સ્થળે પહોંચો', Telugu: 'సునామీ నుంచి ఎలా బయటపడాలి: సంకేతాలను గుర్తించి సురక్షిత ప్రదేశానికి చేరుకోండి' },
  'LzUQ1V7YjF0': { Hindi: 'बिजली गिरते समय सुरक्षित कैसे रहें', Kannada: 'ಸಿಡಿಲು ಬಡಿಯುವಾಗ ಸುರಕ್ಷಿತವಾಗಿ ಇರುವುದು ಹೇಗೆ', Tamil: 'மின்னல் தாக்கும்போது பாதுகாப்பாக இருப்பது எப்படி', Marathi: 'वीज कोसळताना सुरक्षित कसे राहावे', Gujarati: 'વીજળી પડે ત્યારે સુરક્ષિત કેવી રીતે રહેવું', Telugu: 'పిడుగు పడేటప్పుడు సురక్షితంగా ఉండటం ఎలా' },
  'E3IMQ0_VeKQ': { Hindi: 'भारत का बिजली पहचान नेटवर्क', Kannada: 'ಭಾರತದ ಸಿಡಿಲು ಪತ್ತೆ ಜಾಲ', Tamil: 'இந்தியாவின் மின்னல் கண்டறிதல் வலையமைப்பு', Marathi: 'भारताचे वीज शोध नेटवर्क', Gujarati: 'ભારતનું વીજળી શોધ નેટવર્ક', Telugu: 'భారతదేశ పిడుగు గుర్తింపు నెట్‌వర్క్' },
};

const COPY = {
  English: { title: 'Learn how to protect yourself', desc: 'Short videos from NDMA, NIDM and other trusted sources, grouped by disaster. Select a video to watch it on YouTube.' },
  Hindi: { title: 'खुद को सुरक्षित रखना सीखें', desc: 'NDMA, NIDM और अन्य भरोसेमंद स्रोतों के छोटे वीडियो, आपदा के अनुसार। YouTube पर देखने के लिए वीडियो चुनें।' },
  Kannada: { title: 'ನಿಮ್ಮನ್ನು ಹೇಗೆ ರಕ್ಷಿಸಿಕೊಳ್ಳಬೇಕೆಂದು ತಿಳಿಯಿರಿ', desc: 'NDMA, NIDM ಮತ್ತು ಇತರ ವಿಶ್ವಾಸಾರ್ಹ ಮೂಲಗಳ ಸಣ್ಣ ವೀಡಿಯೊಗಳು, ವಿಪತ್ತಿನ ಪ್ರಕಾರ ಗುಂಪುಮಾಡಲಾಗಿದೆ. YouTube ನಲ್ಲಿ ನೋಡಲು ವೀಡಿಯೊ ಆಯ್ಕೆಮಾಡಿ.' },
  Tamil: { title: 'உங்களை எப்படிப் பாதுகாத்துக்கொள்வது என்று அறிக', desc: 'NDMA, NIDM மற்றும் பிற நம்பகமான ஆதாரங்களின் குறுகிய வீடியோக்கள், பேரிடர் வாரியாக. YouTube இல் பார்க்க ஒரு வீடியோவைத் தேர்ந்தெடுக்கவும்.' },
  Marathi: { title: 'स्वतःचे संरक्षण कसे करावे ते शिका', desc: 'NDMA, NIDM आणि इतर विश्वासार्ह स्रोतांचे छोटे व्हिडिओ, आपत्तीनुसार. YouTube वर पाहण्यासाठी व्हिडिओ निवडा.' },
  Gujarati: { title: 'પોતાની સુરક્ષા કેવી રીતે કરવી તે શીખો', desc: 'NDMA, NIDM અને અન્ય વિશ્વસનીય સ્ત્રોતોના ટૂંકા વિડિઓ, આપત્તિ મુજબ. YouTube પર જોવા માટે વિડિઓ પસંદ કરો.' },
  Telugu: { title: 'మిమ్మల్ని మీరు ఎలా రక్షించుకోవాలో తెలుసుకోండి', desc: 'NDMA, NIDM మరియు ఇతర విశ్వసనీయ వనరుల చిన్న వీడియోలు, విపత్తు వారీగా. YouTube లో చూడటానికి వీడియోను ఎంచుకోండి.' },
};

// Disaster names per language. Video titles stay as published (the videos are in English or Hindi).
const NAMES = {
  earthquake: { English: 'Earthquake', Hindi: 'भूकंप', Kannada: 'ಭೂಕಂಪ', Tamil: 'நிலநடுக்கம்', Marathi: 'भूकंप', Gujarati: 'ભૂકંપ', Telugu: 'భూకంపం' },
  flood: { English: 'Flood', Hindi: 'बाढ़', Kannada: 'ಪ್ರವಾಹ', Tamil: 'வெள்ளம்', Marathi: 'पूर', Gujarati: 'પૂર', Telugu: 'వరద' },
  landslide: { English: 'Landslide', Hindi: 'भूस्खलन', Kannada: 'ಭೂಕುಸಿತ', Tamil: 'நிலச்சரிவு', Marathi: 'भूस्खलन', Gujarati: 'ભૂસ્ખલન', Telugu: 'కొండచరియలు' },
  drought: { English: 'Drought', Hindi: 'सूखा', Kannada: 'ಬರ', Tamil: 'வறட்சி', Marathi: 'दुष्काळ', Gujarati: 'દુષ્કાળ', Telugu: 'కరువు' },
  cyclone: { English: 'Cyclone', Hindi: 'चक्रवात', Kannada: 'ಚಂಡಮಾರುತ', Tamil: 'புயல்', Marathi: 'चक्रीवादळ', Gujarati: 'ચક્રવાત', Telugu: 'తుఫాను' },
  heatwave: { English: 'Heatwave', Hindi: 'लू', Kannada: 'ಬಿಸಿಗಾಳಿ', Tamil: 'வெப்ப அலை', Marathi: 'उष्णतेची लाट', Gujarati: 'ગરમીનું મોજું', Telugu: 'వడగాలులు' },
  tsunami: { English: 'Tsunami', Hindi: 'सुनामी', Kannada: 'ಸುನಾಮಿ', Tamil: 'சுனாமி', Marathi: 'त्सुनामी', Gujarati: 'સુનામી', Telugu: 'సునామీ' },
  lightning: { English: 'Lightning', Hindi: 'बिजली गिरना', Kannada: 'ಸಿಡಿಲು', Tamil: 'மின்னல்', Marathi: 'वीज पडणे', Gujarati: 'વીજળી પડવી', Telugu: 'పిడుగు' },
};

export default function SafetyVideos({ lang }) {
  const c = COPY[lang] || COPY.English;
  const [active, setActive] = useState(HAZARDS[0].key);
  const hazard = HAZARDS.find((h) => h.key === active);

  return (
    <div style={{ marginTop: '2.75rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>{c.title}</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>{c.desc}</p>

      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {HAZARDS.map((h) => {
          const on = h.key === active;
          return (
            <button key={h.key} role="tab" aria-selected={on} onClick={() => setActive(h.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600,
                padding: '0.45rem 0.9rem', borderRadius: 999, transition: 'all 0.2s',
                border: `1px solid ${on ? 'var(--color-primary)' : 'var(--card-border)'}`,
                background: on ? 'var(--color-primary)' : 'var(--bg-card)',
                color: on ? '#fff' : 'var(--text-secondary)',
              }}>
              <i className={`fa-solid ${h.icon}`} style={{ fontSize: '0.8rem' }}></i>{NAMES[h.key][lang] || NAMES[h.key].English}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {hazard.videos.map((v) => (
          <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
            className="card-hover"
            style={{ display: 'block', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden', transition: 'background 0.4s ease' }}>
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b1020' }}>
              <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <span aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent 60%)' }}>
                <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: '2px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-play" style={{ color: '#fff', fontSize: '1rem', marginLeft: 3 }}></i>
                </span>
              </span>
            </div>
            <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{(TITLES[v.id] || {})[lang] || v.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-brands fa-youtube" style={{ color: '#FF0000' }}></i>{v.channel}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
