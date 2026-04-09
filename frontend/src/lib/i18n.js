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
  mr: {
    app: { name: 'किसानसाथी', tagline: 'शेतकऱ्यांचा मित्र' },
    nav: { home: 'मुख्यपृष्ठ', chat: 'गप्पा', scan: 'स्कॅन', market: 'बाजार', profile: 'प्रोफाइल', soil: 'माती', admin: 'प्रशासन' },
    auth: {
      login: 'लॉग इन', register: 'नोंदणी', email: 'ईमेल', password: 'पासवर्ड', name: 'पूर्ण नाव',
      verifyOtp: 'OTP सत्यापित करा', enterOtp: 'तुमच्या ईमेलवर पाठवलेला 6 अंकी OTP प्रविष्ट करा', submit: 'सबमिट करा',
      noAccount: 'खाते नाही?', hasAccount: 'आधीपासून खाते आहे?',
      otpSent: 'तुमच्या ईमेलवर OTP पाठवला!', loginSuccess: 'लॉगिन यशस्वी!',
      completeProfile: 'तुमची प्रोफाइल पूर्ण करा',
    },
    dashboard: {
      welcome: 'स्वागत आहे', weather: 'हवामान', soilScore: 'मातीचे आरोग्य', activeCrop: 'सध्याचे पीक',
      aiTip: 'आजची AI टीप', quickActions: 'जलद क्रिया',
      chatAction: 'किसानसाथीला विचारा', scanAction: 'पीक स्कॅन करा', priceAction: 'किमती तपासा', soilAction: 'माती चाचणी',
    },
    chat: {
      placeholder: 'शेतीबद्दल काहीही विचारा...', send: 'पाठवा',
      quickPrompts: ['या हंगामातील सर्वोत्तम पीक?', 'कीटक नियंत्रण मदत', 'पाणी कधी द्यावे?', 'खतांचा सल्ला', 'हवामान सल्ला'],
      voiceInput: 'आवाज इनपुट', listening: 'ऐकत आहे...',
    },
    scan: {
      title: 'पीक रोग स्कॅनर', uploadImage: 'फोटो अपलोड करा किंवा घ्या', selectCrop: 'पिकाचा प्रकार निवडा',
      scanning: 'तुमच्या पिकाचे विश्लेषण करत आहे...', result: 'स्कॅन निकाल', treatment: 'उपचार', organic: 'सेंद्रिय',
      chemical: 'रासायनिक', askAi: 'अधिक मदतीसाठी किसानसाथीला विचारा', history: 'स्कॅन इतिहास',
    },
    market: {
      title: 'बाजारभाव', selectState: 'राज्य निवडा', selectDistrict: 'जिल्हा निवडा',
      selectCommodity: 'कमोडिटी निवडा', mandi: 'मंडी', modalPrice: 'मोडल किंमत', msp: 'MSP',
      trend: 'किमतीचा कल', alerts: 'किंमत अलर्ट', createAlert: 'अलर्ट तयार करा',
    },
    soil: {
      title: 'माती आरोग्य चाचणी', soilType: 'मातीचा प्रकार', ph: 'pH पातळी',
      nitrogen: 'नायट्रोजन', phosphorus: 'फॉस्फरस', potassium: 'पोटॅशियम', moisture: 'ओलावा',
      low: 'कमी', medium: 'मध्यम', high: 'जास्त', analyze: 'मातीचे विश्लेषण करा',
      healthScore: 'आरोग्य स्कोअर', fertilizer: 'खतांची शिफारस', phCorrection: 'pH सुधारणा',
      rotation: 'पीक चक्राची सूचना', selectCrop: 'या चाचणीसाठी पीक निवडा',
    },
    profile: {
      title: 'माझी प्रोफाइल', landSize: 'जमिनीचा आकार (एकर)', soilType: 'मातीचा प्रकार',
      irrigation: 'सिंचन स्रोत', crops: 'मुख्य पिके', language: 'भाषा',
      save: 'प्रोफाइल जतन करा', logout: 'लॉग आउट',
    },
    common: {
      loading: 'लोड होत आहे...', error: 'काहीतरी चूक झाली', retry: 'पुन्हा प्रयत्न करा', save: 'जतन करा',
      cancel: 'रद्द करा', confirm: 'पुष्टी करा', back: 'मागे', next: 'पुढे', noData: 'कोणताही डेटा उपलब्ध नाही',
    },
  },
  pa: {
    app: { name: 'ਕਿਸਾਨਸਾਥੀ', tagline: 'ਕਿਸਾਨ ਦਾ ਸਾਥੀ' },
    nav: { home: 'ਮੁੱਖ ਪੰਨਾ', chat: 'ਗੱਲਬਾਤ', scan: 'ਸਕੈਨ', market: 'ਮੰਡੀ', profile: 'ਪ੍ਰੋਫਾਈਲ', soil: 'ਮਿੱਟੀ', admin: 'ਐਡਮਿਨ' },
    auth: {
      login: 'ਲਾਗਇਨ', register: 'ਰਜਿਸਟਰ', email: 'ਈਮੇਲ', password: 'ਪਾਸਵਰਡ', name: 'ਪੂਰਾ ਨਾਮ',
      verifyOtp: 'OTP ਵੈਰੀਫਾਈ ਕਰੋ', enterOtp: 'ਆਪਣੀ ਈਮੇਲ ਤੇ ਭੇਜਿਆ 6-ਅੰਕਾਂ ਦਾ OTP ਦਾਖਲ ਕਰੋ', submit: 'ਜਮ੍ਹਾਂ ਕਰੋ',
      noAccount: 'ਖਾਤਾ ਨਹੀਂ ਹੈ?', hasAccount: 'ਕੀ ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ?',
      otpSent: 'OTP ਤੁਹਾਡੀ ਈਮੇਲ ਤੇ ਭੇਜਿਆ ਗਿਆ!', loginSuccess: 'ਲਾਗਇਨ ਸਫਲ!',
      completeProfile: 'ਆਪਣੀ ਪ੍ਰੋਫਾਈਲ ਪੂਰੀ ਕਰੋ',
    },
    dashboard: {
      welcome: 'ਜੀ ਆਇਆਂ ਨੂੰ', weather: 'ਮੌਸਮ', soilScore: 'ਮਿੱਟੀ ਦੀ ਸਿਹਤ', activeCrop: 'ਮੌਜੂਦਾ ਫਸਲ',
      aiTip: 'ਅੱਜ ਦਾ AI ਸੁਝਾਅ', quickActions: 'ਤੁਰੰਤ ਕਾਰਵਾਈਆਂ',
      chatAction: 'ਕਿਸਾਨਸਾਥੀ ਨੂੰ ਪੁੱਛੋ', scanAction: 'ਫਸਲ ਸਕੈਨ ਕਰੋ', priceAction: 'ਕੀਮਤਾਂ ਚੈੱਕ ਕਰੋ', soilAction: 'ਮਿੱਟੀ ਟੈਸਟ',
    },
    chat: {
      placeholder: 'ਖੇਤੀਬਾੜੀ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ...', send: 'ਭੇਜੋ',
      quickPrompts: ['ਇਸ ਮੌਸਮ ਦੀ ਸਭ ਤੋਂ ਵਧੀਆ ਫਸਲ?', 'ਕੀੜੇ ਦੀ ਰੋਕਥਾਮ ਮਦਦ', 'ਸਿੰਚਾਈ ਕਦੋਂ ਕਰਨੀ ਹੈ?', 'ਖਾਦ ਦੀ ਸਲਾਹ', 'ਮੌਸਮ ਬਾਰੇ ਸਲਾਹ'],
      voiceInput: 'ਵੌਇਸ ਇਨਪੁਟ', listening: 'ਸੁਣ ਰਿਹਾ ਹੈ...',
    },
    scan: {
      title: 'ਫਸਲ ਦੀ ਬਿਮਾਰੀ ਸਕੈਨਰ', uploadImage: 'ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ ਜਾਂ ਖਿੱਚੋ', selectCrop: 'ਫਸਲ ਦੀ ਕਿਸਮ ਚੁਣੋ',
      scanning: 'ਤੁਹਾਡੀ ਫਸਲ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਿਹਾ ਹੈ...', result: 'ਸਕੈਨ ਨਤੀਜਾ', treatment: 'ਇਲਾਜ', organic: 'ਜੈਵਿਕ',
      chemical: 'ਰਸਾਇਣਕ', askAi: 'ਹੋਰ ਮਦਦ ਲਈ ਕਿਸਾਨਸਾਥੀ ਨੂੰ ਪੁੱਛੋ', history: 'ਸਕੈਨ ਇਤਿਹਾਸ',
    },
    market: {
      title: 'ਮੰਡੀ ਦੀਆਂ ਕੀਮਤਾਂ', selectState: 'ਰਾਜ ਚੁਣੋ', selectDistrict: 'ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ',
      selectCommodity: 'ਜਿਣਸ ਚੁਣੋ', mandi: 'ਮੰਡੀ', modalPrice: 'ਔਸਤ ਕੀਮਤ', msp: 'MSP',
      trend: 'ਕੀਮਤ ਦਾ ਝੁਕਾਅ', alerts: 'ਕੀਮਤ ਅਲਰਟ', createAlert: 'ਅਲਰਟ ਬਣਾਓ',
    },
    soil: {
      title: 'ਮਿੱਟੀ ਸਿਹਤ ਟੈਸਟ', soilType: 'ਮਿੱਟੀ ਦੀ ਕਿਸਮ', ph: 'pH ਪੱਧਰ',
      nitrogen: 'ਨਾਈਟ੍ਰੋਜਨ', phosphorus: 'ਫਾਸਫੋਰਸ', potassium: 'ਪੋਟਾਸ਼ੀਅਮ', moisture: 'ਨਮੀ',
      low: 'ਘੱਟ', medium: 'ਮੱਧਮ', high: 'ਵੱਧ', analyze: 'ਮਿੱਟੀ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ',
      healthScore: 'ਸਿਹਤ ਸਕੋਰ', fertilizer: 'ਖਾਦ ਦੀ ਸਿਫਾਰਸ਼', phCorrection: 'pH ਸੁਧਾਰ',
      rotation: 'ਫਸਲੀ ਚੱਕਰ ਦਾ ਸੁਝਾਅ', selectCrop: 'ਇਸ ਟੈਸਟ ਲਈ ਫਸਲ ਚੁਣੋ',
    },
    profile: {
      title: 'ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ', landSize: 'ਜ਼ਮੀਨ ਦਾ ਆਕਾਰ (ਏਕੜ)', soilType: 'ਮਿੱਟੀ ਦੀ ਕਿਸਮ',
      irrigation: 'ਸਿੰਚਾਈ ਸਰੋਤ', crops: 'ਮੁੱਖ ਫਸਲਾਂ', language: 'ਭਾਸ਼ਾ',
      save: 'ਪ੍ਰੋਫਾਈਲ ਸੇਵ ਕਰੋ', logout: 'ਲਾਗਆਊਟ',
    },
    common: {
      loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...', error: 'ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ', retry: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ', save: 'ਸੇਵ ਕਰੋ',
      cancel: 'ਰੱਦ ਕਰੋ', confirm: 'ਪੁਸ਼ਟੀ ਕਰੋ', back: 'ਪਿੱਛੇ', next: 'ਅੱਗੇ', noData: 'ਕੋਈ ਡਾਟਾ ਉਪਲਬਧ ਨਹੀਂ',
    },
  },
  te: {
    app: { name: 'కిసాన్\u200cసాతీ', tagline: 'రైతు మిత్రుడు' },
    nav: { home: 'హోమ్', chat: 'చాట్', scan: 'స్కాన్', market: 'మార్కెట్', profile: 'ప్రొఫైల్', soil: 'మట్టి', admin: 'అడ్మిన్' },
    auth: {
      login: 'లాగిన్', register: 'నమోదు', email: 'ఈమెయిల్', password: 'పాస్\u200cవర్డ్', name: 'పూర్తి పేరు',
      verifyOtp: 'OTPని ధృవీకరించండి', enterOtp: 'మీ ఈమెయిల్\u200cకి పంపిన 6-అంకెల OTPని నమోదు చేయండి', submit: 'సమర్పించండి',
      noAccount: 'ఖాతా లేదా?', hasAccount: 'ఖాతా ఉందా?',
      otpSent: 'OTP మీ ఈమెయిల్\u200cకి పంపబడింది!', loginSuccess: 'లాగిన్ విజయవంతమైంది!',
      completeProfile: 'మీ ప్రొఫైల్ పూర్తి చేయండి',
    },
    dashboard: {
      welcome: 'స్వాగతం', weather: 'వాతావరణం', soilScore: 'మట్టి ఆరోగ్యం', activeCrop: 'ప్రస్తుత పంట',
      aiTip: 'నేటి AI చిట్కా', quickActions: 'శీఘ్ర చర్యలు',
      chatAction: 'కిసాన్\u200cసాతీని అడగండి', scanAction: 'పంటను స్కాన్ చేయండి', priceAction: 'ధరలు తనిఖీ చేయండి', soilAction: 'మట్టి పరీక్ష',
    },
    chat: {
      placeholder: 'వ్యవసాయం గురించి ఏదైనా అడగండి...', send: 'పంపండి',
      quickPrompts: ['ఈ సీజన్\u200cకు ఉత్తమమైన పంట?', 'తెగుళ్ళ నివారణ సహాయం', 'నీరు ఎప్పుడు పెట్టాలి?', 'ఎరువుల సలహా', 'వాతావరణ సలహా'],
      voiceInput: 'వాయిస్ ఇన్\u200cపుట్', listening: 'వింటున్నది...',
    },
    scan: {
      title: 'పంట వ్యాధి స్కానర్', uploadImage: 'ఫోటో అప్\u200cలోడ్ చేయండి లేదా తీయండి', selectCrop: 'పంట రకాన్ని ఎంచుకోండి',
      scanning: 'మీ పంటను విశ్లేషిస్తోంది...', result: 'స్కాన్ ఫలితం', treatment: 'చికిత్స', organic: 'సేంద్రీయ',
      chemical: 'రసాయన', askAi: 'మరింత సహాయం కోసం కిసాన్\u200cసాతీని అడగండి', history: 'స్కాన్ చరిత్ర',
    },
    market: {
      title: 'మార్కెట్ ధరలు', selectState: 'రాష్ట్రం ఎంచుకోండి', selectDistrict: 'జిల్లా ఎంచుకోండి',
      selectCommodity: 'రకం ఎంచుకోండి', mandi: 'మండీ', modalPrice: 'సగటు ధర', msp: 'MSP',
      trend: 'ధరల సరళి', alerts: 'ధరల అలర్ట్\u200cలు', createAlert: 'అలర్ట్ సృష్టించండి',
    },
    soil: {
      title: 'మట్టి ఆరోగ్య పరీక్ష', soilType: 'మట్టి రకం', ph: 'pH స్థాయి',
      nitrogen: 'నైట్రోజన్', phosphorus: 'భాస్వరం', potassium: 'పొటాషియం', moisture: 'తేమ',
      low: 'తక్కువ', medium: 'మధ్యస్థం', high: 'ఎక్కువ', analyze: 'మట్టి విశ్లేషణ',
      healthScore: 'ఆరోగ్య స్కోర్', fertilizer: 'ఎరువుల సిఫార్సు', phCorrection: 'pH సవరణ',
      rotation: 'పంట మార్పిడి సూచన', selectCrop: 'ఈ పరీక్ష కోసం పంటను ఎంచుకోండి',
    },
    profile: {
      title: 'నా ప్రొఫైల్', landSize: 'భూమి పరిమాణం (ఎకరాలు)', soilType: 'మట్టి రకం',
      irrigation: 'నీటి పారుదల మూలం', crops: 'ముఖ్య పంటలు', language: 'భాష',
      save: 'ప్రొఫైల్ సేవ్ చేయండి', logout: 'లాగ్అవుట్',
    },
    common: {
      loading: 'లోడ్ అవుతోంది...', error: 'ఏదో తప్పు జరిగింది', retry: 'మళ్లీ ప్రయత్నించండి', save: 'సేవ్ చేయండి',
      cancel: 'రద్దు చేయండి', confirm: 'నిర్ధారించండి', back: 'వెనుకకు', next: 'తదుపరి', noData: 'డేటా అందుబాటులో లేదు',
    },
  },
  ta: {
    app: { name: 'கிசான்சாத்தி', tagline: 'விவசாயியின் நண்பன்' },
    nav: { home: 'முகப்பு', chat: 'அரட்டை', scan: 'ஸ்கேன்', market: 'சந்தை', profile: 'சுயவிவரம்', soil: 'மண்', admin: 'நிர்வாகி' },
    auth: {
      login: 'உள்நுழைய', register: 'பதிவு செய்', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', name: 'முழு பெயர்',
      verifyOtp: 'OTP-ஐச் சரிபார்', enterOtp: 'உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்ட 6 இலக்க OTPஐ உள்ளிடவும்', submit: 'சமர்ப்பி',
      noAccount: 'கணக்கு இல்லையா?', hasAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
      otpSent: 'உங்கள் மின்னஞ்சலுக்கு OTP அனுப்பப்பட்டது!', loginSuccess: 'உள்நுழைவு வெற்றி!',
      completeProfile: 'உங்கள் சுயவிவரத்தை முழுமைப்படுத்தவும்',
    },
    dashboard: {
      welcome: 'வரவேற்கிறோம்', weather: 'வானிலை', soilScore: 'மண் வளம்', activeCrop: 'தற்போதைய பயிர்',
      aiTip: 'இன்றைய AI குறிப்பு', quickActions: 'விரைவான செயல்கள்',
      chatAction: 'கிசான்சாத்தியிடம் கேள்', scanAction: 'பயிரை ஸ்கேன் செய்', priceAction: 'விலைகளைப் பார்', soilAction: 'மண் பரிசோதனை',
    },
    chat: {
      placeholder: 'விவசாயம் பற்றி ஏதேனும் கேட்கவும்...', send: 'அனுப்பு',
      quickPrompts: ['இந்த பருவத்திற்கு சிறந்த பயிர்?', 'பூச்சி தொல்லை உதவி', 'எப்போது நீர் பாய்ச்சுவது?', 'உர ஆலோசனை', 'வானிலை ஆலோசனை'],
      voiceInput: 'குரல் உள்ளீடு', listening: 'கேட்கிறது...',
    },
    scan: {
      title: 'பயிர் நோய் ஸ்கேனர்', uploadImage: 'புகைப்படம் பதிவேற்று அல்லது எடு', selectCrop: 'பயிர் வகையைத் தேர்ந்தெடு',
      scanning: 'பயிர் பகுப்பாய்வு செய்யப்படுகிறது...', result: 'ஸ்கேன் முடிவு', treatment: 'சிகிச்சை', organic: 'இயற்கை',
      chemical: 'இரசாயன', askAi: 'மேலும் உதவிக்கு கிசான்சாத்தியிடம் கேட்கவும்', history: 'ஸ்கேன் வரலாறு',
    },
    market: {
      title: 'சந்தை விலைகள்', selectState: 'மாநிலத்தைத் தேர்ந்தெடு', selectDistrict: 'மாவட்டத்தைத் தேர்ந்தெடு',
      selectCommodity: 'பொருளைத் தேர்ந்தெடு', mandi: 'மண்டி', modalPrice: 'சராசரி விலை', msp: 'MSP',
      trend: 'விலை நிலவரம்', alerts: 'விலை எச்சரிக்கைகள்', createAlert: 'எச்சரிக்கையை உருவாக்கு',
    },
    soil: {
      title: 'மண் பரிசோதனை', soilType: 'மண் வகை', ph: 'pH அளவு',
      nitrogen: 'நைட்ரஜன்', phosphorus: 'பாஸ்பரஸ்', potassium: 'பொட்டாசியம்', moisture: 'ஈரப்பதம்',
      low: 'குறைவு', medium: 'நடுத்தரம்', high: 'அதிகம்', analyze: 'மண்ணை பகுப்பாய்வு செய்',
      healthScore: 'சுகாதார மதிப்பெண்', fertilizer: 'உரப் பரிந்துரை', phCorrection: 'pH திருத்தம்',
      rotation: 'பயிர் சுழற்சி ஆலோசனை', selectCrop: 'இந்த சோதனைக்கு பயிரைத் தேர்ந்தெடு',
    },
    profile: {
      title: 'என் சுயவிவரம்', landSize: 'நிலத்தின் அளவு (ஏக்கர்)', soilType: 'மண் வகை',
      irrigation: 'நீர்ப்பாசன ஆதாரம்', crops: 'முதன்மை பயிர்கள்', language: 'மொழி',
      save: 'சுயவிவரத்தை சேமி', logout: 'வெளியேறு',
    },
    common: {
      loading: 'ஏற்றப்படுகிறது...', error: 'ஏதோ தவறு நடந்துவிட்டது', retry: 'மீண்டும் முயற்சி செய்', save: 'சேமி',
      cancel: 'ரத்து செய்', confirm: 'உறுதி செய்', back: 'பின்செல்', next: 'அடுத்து', noData: 'தகவல் ஏதும் கிடைக்கவில்லை',
    },
  },
};

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
