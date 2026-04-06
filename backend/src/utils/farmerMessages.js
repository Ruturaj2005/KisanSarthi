/**
 * Farmer-friendly error messages in all 6 supported languages.
 * Maps internal error codes to translated, simple messages.
 * Target audience: farmers with < 8th grade literacy.
 */

const ERROR_CODES = {
  INVALID_OTP: {
    hi: 'गलत OTP। कृपया दोबारा जाँचें।',
    en: 'Incorrect OTP. Please check again.',
    mr: 'चुकीचा OTP. कृपया पुन्हा तपासा.',
    pa: 'ਗਲਤ OTP। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਜਾਂਚ ਕਰੋ।',
    te: 'తప్పు OTP. దయచేసి మళ్ళీ తనిఖీ చేయండి.',
    ta: 'தவறான OTP. மீண்டும் சரிபார்க்கவும்.',
  },
  OTP_EXPIRED: {
    hi: 'OTP की समय सीमा समाप्त हो गई। नया OTP भेजें।',
    en: 'OTP has expired. Please request a new one.',
    mr: 'OTP ची वेळ संपली. नवीन OTP पाठवा.',
    pa: 'OTP ਦੀ ਸਮਾਂ ਸੀਮਾ ਖਤਮ ਹੋ ਗਈ। ਨਵਾਂ OTP ਭੇਜੋ।',
    te: 'OTP గడువు ముగిసింది. కొత్త OTP పంపండి.',
    ta: 'OTP காலாவதியானது. புதிய OTP அனுப்பவும்.',
  },
  EMAIL_EXISTS: {
    hi: 'यह ईमेल पहले से पंजीकृत है।',
    en: 'This email is already registered.',
    mr: 'हा ईमेल आधीच नोंदणीकृत आहे.',
    pa: 'ਇਹ ਈਮੇਲ ਪਹਿਲਾਂ ਹੀ ਰਜਿਸਟਰ ਹੈ।',
    te: 'ఈ ఇమెయిల్ ఇప్పటికే నమోదు చేయబడింది.',
    ta: 'இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது.',
  },
  INVALID_CREDENTIALS: {
    hi: 'ईमेल या पासवर्ड गलत है।',
    en: 'Email or password is incorrect.',
    mr: 'ईमेल किंवा पासवर्ड चुकीचा आहे.',
    pa: 'ਈਮੇਲ ਜਾਂ ਪਾਸਵਰਡ ਗਲਤ ਹੈ।',
    te: 'ఇమెయిల్ లేదా పాస్‌వర్డ్ తప్పు.',
    ta: 'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது.',
  },
  NOT_VERIFIED: {
    hi: 'कृपया पहले अपना ईमेल सत्यापित करें।',
    en: 'Please verify your email first.',
    mr: 'कृपया आधी तुमचा ईमेल सत्यापित करा.',
    pa: 'ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਆਪਣੀ ਈਮੇਲ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।',
    te: 'దయచేసి మొదట మీ ఇమెయిల్‌ని ధృవీకరించండి.',
    ta: 'முதலில் உங்கள் மின்னஞ்சலை சரிபார்க்கவும்.',
  },
  SESSION_EXPIRED: {
    hi: 'आपका सत्र समाप्त हो गया। कृपया पुनः लॉग इन करें।',
    en: 'Your session has expired. Please log in again.',
    mr: 'तुमचे सत्र संपले आहे. कृपया पुन्हा लॉग इन करा.',
    pa: 'ਤੁਹਾਡਾ ਸੈਸ਼ਨ ਖਤਮ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਲੌਗ ਇਨ ਕਰੋ।',
    te: 'మీ సెషన్ గడువు ముగిసింది. దయచేసి మళ్ళీ లాగిన్ చేయండి.',
    ta: 'உங்கள் அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.',
  },
  UNAUTHORIZED: {
    hi: 'आपको इसकी अनुमति नहीं है।',
    en: 'You are not authorized.',
    mr: 'तुम्हाला याची परवानगी नाही.',
    pa: 'ਤੁਹਾਨੂੰ ਇਸ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਹੈ।',
    te: 'మీకు అనుమతి లేదు.',
    ta: 'உங்களுக்கு அனுமதி இல்லை.',
  },
  RATE_LIMITED: {
    hi: 'बहुत अधिक प्रयास। कुछ समय बाद पुनः प्रयास करें।',
    en: 'Too many attempts. Please try again later.',
    mr: 'खूप प्रयत्न. कृपया नंतर पुन्हा प्रयत्न करा.',
    pa: 'ਬਹੁਤ ਜ਼ਿਆਦਾ ਕੋਸ਼ਿਸ਼ਾਂ। ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    te: 'చాలా ఎక్కువ ప్రయత్నాలు. దయచేసి కొంచెం సేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.',
    ta: 'அதிக முயற்சிகள். சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
  },
  SERVER_ERROR: {
    hi: 'कुछ गड़बड़ हो गई। कृपया बाद में प्रयास करें।',
    en: 'Something went wrong. Please try again later.',
    mr: 'काहीतरी चूक झाली. कृपया नंतर प्रयत्न करा.',
    pa: 'ਕੁਝ ਗੜਬੜ ਹੋ ਗਈ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    te: 'ఏదో తప్పు జరిగింది. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.',
    ta: 'ஏதோ தவறு நடந்தது. பின்னர் மீண்டும் முயற்சிக்கவும்.',
  },
  NOT_FOUND: {
    hi: 'अनुरोधित जानकारी नहीं मिली।',
    en: 'Requested information not found.',
    mr: 'विनंती केलेली माहिती सापडली नाही.',
    pa: 'ਬੇਨਤੀ ਕੀਤੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲੀ।',
    te: 'అభ్యర్థించిన సమాచారం కనుగొనబడలేదు.',
    ta: 'கோரிய தகவல் கிடைக்கவில்லை.',
  },
};

/**
 * Get a farmer-friendly error message for a given error code and language.
 * @param {string} code - Internal error code (e.g., 'INVALID_OTP')
 * @param {string} lang - Language code (e.g., 'hi', 'en')
 * @returns {string} Translated farmer-friendly message
 *
 * @example
 * getFarmerMessage('INVALID_OTP', 'hi');
 * // → 'गलत OTP। कृपया दोबारा जाँचें।'
 */
const getFarmerMessage = (code, lang = 'en') => {
  const messages = ERROR_CODES[code];
  if (!messages) {
    return ERROR_CODES.SERVER_ERROR[lang] || ERROR_CODES.SERVER_ERROR.en;
  }
  return messages[lang] || messages.en;
};

module.exports = { ERROR_CODES, getFarmerMessage };
