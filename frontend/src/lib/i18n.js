const translations = {
  en: {
    app: { name: 'KisanSaathi', tagline: "Farmer's Companion" },
    nav: { home: 'Home', chat: 'Chat', scan: 'Scan', market: 'Market', profile: 'Profile', soil: 'Soil', admin: 'Admin' },
    auth: {
      login: 'Login', register: 'Register', email: 'Email', password: 'Password', name: 'Full Name',
      verifyOtp: 'Verify OTP', enterOtp: 'Enter the 6-digit OTP sent to your email', submit: 'Submit',
      noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
      otpSent: 'OTP sent to your email!', loginSuccess: 'Login successful!',
      completeProfile: 'Complete Your Profile',
    },
    dashboard: {
      welcome: 'Welcome', weather: 'Weather', soilScore: 'Soil Health', activeCrop: 'Active Crop',
      aiTip: 'AI Tip of the Day', quickActions: 'Quick Actions',
      chatAction: 'Ask KisanSaathi', scanAction: 'Scan Crop', priceAction: 'Check Prices', soilAction: 'Soil Test',
    },
    chat: {
      placeholder: 'Ask anything about farming...', send: 'Send',
      quickPrompts: ['Best crop this season?', 'Pest help', 'When to irrigate?', 'Fertilizer advice', 'Weather advisory'],
      voiceInput: 'Voice Input', listening: 'Listening...',
    },
    scan: {
      title: 'Crop Disease Scanner', uploadImage: 'Upload or Take Photo', selectCrop: 'Select Crop Type',
      scanning: 'Analyzing your crop...', result: 'Scan Result', treatment: 'Treatment', organic: 'Organic',
      chemical: 'Chemical', askAi: 'Ask KisanSaathi for more help', history: 'Scan History',
    },
    market: {
      title: 'Market Prices', selectState: 'Select State', selectDistrict: 'Select District',
      selectCommodity: 'Select Commodity', mandi: 'Mandi', modalPrice: 'Modal Price', msp: 'MSP',
      trend: 'Price Trend', alerts: 'Price Alerts', createAlert: 'Create Alert',
    },
    soil: {
      title: 'Soil Health Test', soilType: 'Soil Type', ph: 'pH Level',
      nitrogen: 'Nitrogen', phosphorus: 'Phosphorus', potassium: 'Potassium', moisture: 'Moisture',
      low: 'Low', medium: 'Medium', high: 'High', analyze: 'Analyze Soil',
      healthScore: 'Health Score', fertilizer: 'Fertilizer Recommendation', phCorrection: 'pH Correction',
      rotation: 'Crop Rotation Suggestion', selectCrop: 'Select crop for this test',
    },
    profile: {
      title: 'My Profile', landSize: 'Land Size (acres)', soilType: 'Soil Type',
      irrigation: 'Irrigation Source', crops: 'Primary Crops', language: 'Language',
      save: 'Save Profile', logout: 'Logout',
    },
    common: {
      loading: 'Loading...', error: 'Something went wrong', retry: 'Retry', save: 'Save',
      cancel: 'Cancel', confirm: 'Confirm', back: 'Back', next: 'Next', noData: 'No data available',
    },
  },
  hi: {
    app: { name: 'किसानसाथी', tagline: 'किसान का साथी' },
    nav: { home: 'होम', chat: 'चैट', scan: 'स्कैन', market: 'मंडी', profile: 'प्रोफाइल', soil: 'मिट्टी', admin: 'एडमिन' },
    auth: {
      login: 'लॉग इन', register: 'पंजीकरण', email: 'ईमेल', password: 'पासवर्ड', name: 'पूरा नाम',
      verifyOtp: 'OTP सत्यापित करें', enterOtp: 'अपने ईमेल पर भेजा गया 6 अंकों का OTP दर्ज करें', submit: 'जमा करें',
      noAccount: 'खाता नहीं है?', hasAccount: 'पहले से खाता है?',
      otpSent: 'आपके ईमेल पर OTP भेजा गया!', loginSuccess: 'लॉगिन सफल!',
      completeProfile: 'अपनी प्रोफाइल पूरी करें',
    },
    dashboard: {
      welcome: 'स्वागत है', weather: 'मौसम', soilScore: 'मिट्टी स्वास्थ्य', activeCrop: 'सक्रिय फसल',
      aiTip: 'AI सुझाव', quickActions: 'त्वरित कार्य',
      chatAction: 'किसानसाथी से पूछें', scanAction: 'फसल स्कैन', priceAction: 'भाव देखें', soilAction: 'मिट्टी परीक्षण',
    },
    chat: {
      placeholder: 'खेती के बारे में कुछ भी पूछें...', send: 'भेजें',
      quickPrompts: ['इस मौसम की सबसे अच्छी फसल?', 'कीट सहायता', 'सिंचाई कब करें?', 'उर्वरक सलाह', 'मौसम सलाह'],
      voiceInput: 'आवाज इनपुट', listening: 'सुन रहा है...',
    },
    scan: {
      title: 'फसल रोग स्कैनर', uploadImage: 'फोटो अपलोड करें', selectCrop: 'फसल का प्रकार चुनें',
      scanning: 'आपकी फसल का विश्लेषण हो रहा है...', result: 'स्कैन परिणाम', treatment: 'उपचार', organic: 'जैविक',
      chemical: 'रासायनिक', askAi: 'अधिक मदद के लिए किसानसाथी से पूछें', history: 'स्कैन इतिहास',
    },
    market: {
      title: 'मंडी भाव', selectState: 'राज्य चुनें', selectDistrict: 'जिला चुनें',
      selectCommodity: 'फसल चुनें', mandi: 'मंडी', modalPrice: 'मॉडल भाव', msp: 'न्यूनतम समर्थन मूल्य',
      trend: 'भाव रुझान', alerts: 'भाव अलर्ट', createAlert: 'अलर्ट बनाएं',
    },
    soil: {
      title: 'मिट्टी स्वास्थ्य परीक्षण', soilType: 'मिट्टी का प्रकार', ph: 'pH स्तर',
      nitrogen: 'नाइट्रोजन', phosphorus: 'फास्फोरस', potassium: 'पोटैशियम', moisture: 'नमी',
      low: 'कम', medium: 'मध्यम', high: 'अधिक', analyze: 'मिट्टी का विश्लेषण',
      healthScore: 'स्वास्थ्य स्कोर', fertilizer: 'उर्वरक सिफारिश', phCorrection: 'pH सुधार',
      rotation: 'फसल चक्र सुझाव', selectCrop: 'इस परीक्षण के लिए फसल चुनें',
    },
    profile: {
      title: 'मेरी प्रोफाइल', landSize: 'भूमि का आकार (एकड़)', soilType: 'मिट्टी का प्रकार',
      irrigation: 'सिंचाई स्रोत', crops: 'प्रमुख फसलें', language: 'भाषा',
      save: 'प्रोफाइल सेव करें', logout: 'लॉग आउट',
    },
    common: {
      loading: 'लोड हो रहा है...', error: 'कुछ गड़बड़ हो गई', retry: 'पुनः प्रयास', save: 'सेव',
      cancel: 'रद्द', confirm: 'पुष्टि', back: 'वापस', next: 'अगला', noData: 'कोई डेटा उपलब्ध नहीं',
    },
  },
};

// Add language alias for remaining languages (minimal keys)
['mr', 'pa', 'te', 'ta'].forEach((lang) => {
  translations[lang] = { ...translations.hi };
});

export function getTranslation(lang = 'en') {
  return translations[lang] || translations.en;
}

export function t(lang, path) {
  const trans = getTranslation(lang);
  return path.split('.').reduce((obj, key) => obj?.[key], trans) || path;
}

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
];

export default translations;
