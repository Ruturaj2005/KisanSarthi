const { HfInference } = require('@huggingface/inference');
const logger = require('../utils/logger');

const HF_API_KEY = process.env.HF_API_KEY || '';
const hf = new HfInference(HF_API_KEY);
const MODEL_ID = process.env.HF_MODEL_ID || 'mistralai/Mistral-7B-Instruct-v0.3';
const FALLBACK_MODEL_IDS = ['Qwen/Qwen2.5-7B-Instruct'];

const SYSTEM_PROMPT = `CRITICAL LANGUAGE RULE: The user's message language is detected and 
passed to you. You MUST reply in that exact language. If the user's 
message contains mostly English (Latin) characters, reply in English only - 
never in Hindi or Marathi. Do not mix languages under any circumstance.

You are KisanSaathi, an AI assistant exclusively trained 
to help Indian farmers with agriculture-related topics only.

════════════════════════════════════════
STRICT TOPIC BOUNDARY — MOST IMPORTANT RULE
════════════════════════════════════════
You ONLY answer questions related to:
✅ Crops — sowing, harvesting, crop rotation, seed selection
✅ Soil — NPK, pH, soil health, fertilizers, composting
✅ Pest & Disease — identification, prevention, treatment
✅ Irrigation — methods, scheduling, water management
✅ Weather — farming decisions based on weather conditions
✅ Government schemes — PM-KISAN, PMFBY, Soil Health Card, 
   eNAM, Kisan Credit Card, and any agriculture-related scheme
✅ Market & MSP — mandi prices, when and where to sell crops
✅ Post-harvest — storage, reducing crop loss, processing
✅ Farm equipment — basic usage and maintenance
✅ Animal husbandry — dairy, poultry if related to farm income

You MUST REFUSE to answer anything outside the above list including but not 
limited to:
❌ Politics, political parties, elections, politicians
❌ General science, physics, chemistry, history
❌ Entertainment, sports, movies, celebrities
❌ Finance, stock market, cryptocurrency (unless govt agri loan/scheme)
❌ Religion, geography, current news unrelated to farming
❌ Coding, technology, general knowledge

When a user asks an out-of-scope question, respond politely in their language 
using this exact tone:
- Do NOT be rude or abrupt
- Acknowledge their question briefly
- Clearly state you are built only for agriculture help
- Invite them to ask an agriculture-related question

Example refusal in English:
"I appreciate your curiosity! I am KisanSaathi, and I am specifically designed 
to assist farmers with agriculture-related questions only. I am not the right 
assistant for this topic. Feel free to ask me anything about your crops, soil, 
pests, weather, government schemes, or market prices — I am here to help! 🌾"

════════════════════════════════════════
LANGUAGE MATCHING RULE — MANDATORY
════════════════════════════════════════
Detect the language of the user's message and reply STRICTLY in that same language.
Never mix languages in a single response.

- User writes in English → Reply fully in English
- User writes in Hindi → Reply fully in Hindi (Devanagari script)
- User writes in Marathi → Reply fully in Marathi (Devanagari script)
- User writes in Telugu → Reply fully in Telugu script
- User writes in Tamil → Reply fully in Tamil script
- User writes in Kannada → Reply fully in Kannada script
- User writes in Bengali → Reply fully in Bengali script
- User writes in Punjabi → Reply fully in Punjabi (Gurmukhi script)
- If language is unclear or mixed → Default to Hindi

This rule applies to BOTH helpful answers AND refusal messages.
If user asks an out-of-scope question in Marathi, refuse in Marathi.
If user asks an out-of-scope question in Hindi, refuse in Hindi.

════════════════════════════════════════
RESPONSE STYLE
════════════════════════════════════════
- Use simple language a rural farmer with basic literacy can understand
- Be warm and respectful — address as "Kisan bhai" in Hindi/Marathi, 
  or appropriately in other languages
- Keep answers practical and concise — no long essays
- When recommending pesticides or chemicals, always add safety precautions
- If unsure about region-specific advice, suggest contacting the nearest 
  KVK (Krishi Vigyan Kendra)
- Mention applicable government subsidies or schemes wherever relevant`;

function hasUsableHfKey() {
  if (!HF_API_KEY) return false;
  const lowered = HF_API_KEY.toLowerCase();
  return !lowered.includes('your_huggingface_api_key_here');
}

function buildFallbackAdvice(userMessage) {
  const text = String(userMessage || '').trim();
  const isHindiLike = /[\u0900-\u097F]/.test(text);

  if (isHindiLike) {
    return `Kisan bhai, abhi AI server busy hai, par turant upay batata hoon: खेत की नमी जांचें, सुबह/शाम सिंचाई करें, और कीट लक्षण दिखें तो प्रभावित हिस्से अलग करें। दवा उपयोग करते समय दस्ताने और मास्क जरूर पहनें।`; 
  }

  return 'Kisan bhai, the AI server is temporarily unavailable. For now: check field moisture before irrigation, irrigate in early morning/evening, isolate infected plants if pest symptoms appear, and always use gloves and a mask when applying pesticides.';
}

function buildTextGenerationPrompt(messages) {
  const lines = messages.map((msg) => {
    if (msg.role === 'system') return `[SYSTEM]\n${msg.content}`;
    if (msg.role === 'assistant') return `[ASSISTANT]\n${msg.content}`;
    return `[USER]\n${msg.content}`;
  });

  return `${lines.join('\n\n')}\n\n[ASSISTANT]\n`;
}

function extractTextGenerationOutput(response) {
  if (!response) return '';
  if (typeof response === 'string') return response.trim();
  if (Array.isArray(response) && response[0]?.generated_text) return String(response[0].generated_text).trim();
  if (response.generated_text) return String(response.generated_text).trim();
  return '';
}

const OFF_TOPIC_KEYWORDS = [
  // Politics
  'bjp', 'congress', 'aap', 'shiv sena', 'ncp', 'bsp', 'sp ', 'rjd',
  'modi', 'rahul gandhi', 'kejriwal', 'mamata', 'yogi', 'cm ', 'mp ',
  'mla', 'election', 'vote', 'party', 'politics', 'politician', 'minister',
  'government party', 'lok sabha', 'rajya sabha', 'vidhansabha',
  'chunav', 'sarkar', 'neta', 'mantri', 'rajniti',

  // Science / General Knowledge
  'photosynthesis', 'newton', 'einstein', 'atom', 'molecule', 'physics',
  'chemistry', 'history', 'geography', 'capital of', 'who invented',
  'what is the meaning', 'mathematics', 'algebra', 'theorem',

  // Entertainment
  'movie', 'film', 'actor', 'actress', 'cricket', 'ipl', 'football',
  'bollywood', 'hollywood', 'song', 'singer', 'celebrity', 'web series',

  // Finance (non-agri)
  'stock market', 'share market', 'bitcoin', 'crypto', 'nifty', 'sensex',
  'mutual fund', 'emi', 'loan', // Note: agri loan is allowed so handle below
];

const AGRI_SAFE_OVERRIDES = [
  'kisan credit card', 'agri loan', 'crop loan', 'pm-kisan', 'pmfby',
  'soil health card', 'enam', 'kcc', 'krishi', 'fasal bima',
];

function isOffTopic(message) {
  const lowerMsg = message.toLowerCase();

  // If message contains agri-safe terms, allow it through
  const isSafe = AGRI_SAFE_OVERRIDES.some((term) => lowerMsg.includes(term));
  if (isSafe) return false;

  // Check if message matches any off-topic keyword
  return OFF_TOPIC_KEYWORDS.some((keyword) => lowerMsg.includes(keyword));
}

function detectLanguage(message) {
  // Count characters by script to find the dominant script
  const devanagariCount = (message.match(/[\u0900-\u097F]/g) || []).length;
  const teluguCount = (message.match(/[\u0C00-\u0C7F]/g) || []).length;
  const tamilCount = (message.match(/[\u0B80-\u0BFF]/g) || []).length;
  const kannadaCount = (message.match(/[\u0C80-\u0CFF]/g) || []).length;
  const bengaliCount = (message.match(/[\u0980-\u09FF]/g) || []).length;
  const punjabiCount = (message.match(/[\u0A00-\u0A7F]/g) || []).length;
  const latinCount = (message.match(/[a-zA-Z]/g) || []).length;

  // Find the dominant script by character count
  const scores = {
    english: latinCount,
    devanagari: devanagariCount,
    telugu: teluguCount,
    tamil: tamilCount,
    kannada: kannadaCount,
    bengali: bengaliCount,
    punjabi: punjabiCount,
  };

  const dominant = Object.entries(scores).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  // If dominant is devanagari, distinguish Hindi vs Marathi
  if (dominant === 'devanagari') {
    const marathiWords = ['आहे', 'नाही', 'काय', 'कसे', 'मला',
      'तुम्ही', 'आपण', 'सांगा', 'करा', 'द्या'];
    if (marathiWords.some((w) => message.includes(w))) return 'marathi';
    return 'hindi';
  }

  // If latin count is highest, it's English
  if (dominant === 'english') return 'english';

  return dominant;
}

const REFUSAL_MESSAGES = {
  english: `I appreciate your question! However, I am KisanSaathi — an assistant built exclusively for Indian farmers. I can only help with topics like crops, soil, pests, irrigation, weather, government agriculture schemes, and market prices. I am not able to answer questions on this topic. Please feel free to ask anything related to farming — I am here to help! 🌾`,

  hindi: `आपका सवाल समझ आया! लेकिन मैं KisanSaathi हूँ — मुझे केवल खेती से जुड़े विषयों के लिए बनाया गया है। राजनीति, विज्ञान, मनोरंजन या अन्य विषयों पर मैं जवाब देने में असमर्थ हूँ। कृपया फसल, मिट्टी, कीट, सिंचाई, मौसम, सरकारी योजनाओं या मंडी भाव से जुड़ा कोई सवाल पूछें। 🌾`,

  marathi: `आपला प्रश्न समजला! परंतु मी KisanSaathi आहे — मला फक्त शेतीशी संबंधित विषयांसाठी तयार केले आहे। राजकारण, विज्ञान किंवा इतर विषयांवर मी उत्तर देऊ शकत नाही। कृपया पीक, माती, कीड, सिंचन, हवामान, सरकारी योजना किंवा बाजारभावाशी संबंधित प्रश्न विचारा. 🌾`,

  telugu: `మీ ప్రశ్న అర్థమైంది! కానీ నేను KisanSaathi — నేను వ్యవసాయ సంబంధిత అంశాలకు మాత్రమే సహాయం చేయగలను. రాజకీయాలు లేదా ఇతర అంశాలపై నేను సమాధానం ఇవ్వలేను. దయచేసి పంటలు, నేల, తెగుళ్లు, నీటిపారుదల లేదా ప్రభుత్వ పథకాల గురించి అడగండి. 🌾`,

  tamil: `உங்கள் கேள்வி புரிந்தது! ஆனால் நான் KisanSaathi — நான் விவசாயம் தொடர்பான விஷயங்களுக்கு மட்டுமே உதவ முடியும். அரசியல் அல்லது பிற தலைப்புகளில் பதில் சொல்ல என்னால் இயலாது. பயிர், மண், பூச்சிகள், நீர்ப்பாசனம் அல்லது அரசு திட்டங்கள் பற்றி கேளுங்கள். 🌾`,

  kannada: `ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಅರ್ಥವಾಯಿತು! ಆದರೆ ನಾನು KisanSaathi — ನಾನು ಕೇವಲ ಕೃಷಿ ಸಂಬಂಧಿತ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ರಾಜಕೀಯ ಅಥವಾ ಇತರ ವಿಷಯಗಳಿಗೆ ಉತ್ತರಿಸಲು ನನ್ನಿಂದ ಸಾಧ್ಯವಿಲ್ಲ. ಬೆಳೆ, ಮಣ್ಣು, ಕೀಟ, ನೀರಾವರಿ ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ. 🌾`,

  bengali: `আপনার প্রশ্ন বুঝতে পেরেছি! তবে আমি KisanSaathi — আমাকে শুধুমাত্র কৃষি সংক্রান্ত বিষয়ে সাহায্য করার জন্য তৈরি করা হয়েছে। রাজনীতি বা অন্যান্য বিষয়ে আমি উত্তর দিতে সক্ষম নই। ফসল, মাটি, কীটপতঙ্গ, সেচ বা সরকারি প্রকল্প সম্পর্কে জিজ্ঞাসা করুন। 🌾`,

  punjabi: `ਤੁਹਾਡਾ ਸਵਾਲ ਸਮਝ ਆਇਆ! ਪਰ ਮੈਂ KisanSaathi ਹਾਂ — ਮੈਨੂੰ ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਨਾਲ ਜੁੜੇ ਵਿਸ਼ਿਆਂ ਲਈ ਬਣਾਇਆ ਗਿਆ ਹੈ। ਰਾਜਨੀਤੀ ਜਾਂ ਹੋਰ ਵਿਸ਼ਿਆਂ 'ਤੇ ਮੈਂ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਦਾ। ਕਿਰਪਾ ਕਰਕੇ ਫ਼ਸਲ, ਮਿੱਟੀ, ਕੀੜੇ ਜਾਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਬਾਰੇ ਪੁੱਛੋ। 🌾`,
};

async function getAgriculturalAdvice(userMessage, conversationHistory = []) {
  // Hard topic guard — intercept before LLM call
  if (isOffTopic(userMessage)) {
    const lang = detectLanguage(userMessage);
    return REFUSAL_MESSAGES[lang] || REFUSAL_MESSAGES['english'];
  }

  // Detect language and tell the LLM explicitly
  const detectedLang = detectLanguage(userMessage);
  const langInstruction = `IMPORTANT: The user is writing in ${detectedLang.toUpperCase()}. 
You MUST reply in ${detectedLang.toUpperCase()} only. Do not use any other language.`;

  if (!hasUsableHfKey()) {
    logger.warn('HF_API_KEY missing or placeholder, using fallback advisory', {
      service: 'advisory-ai',
    });
    return buildFallbackAdvice(userMessage);
  }

  // Build messages array with history
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: langInstruction },
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const modelCandidates = [MODEL_ID, ...FALLBACK_MODEL_IDS].filter(
    (model, index, arr) => model && arr.indexOf(model) === index
  );

  let lastError;

  for (const modelId of modelCandidates) {
    try {
      const response = await hf.chatCompletion({
        model: modelId,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      });

      const content = response?.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }

      throw new Error('Empty response from Hugging Face');
    } catch (error) {
      lastError = error;
      const message = String(error?.message || '').toLowerCase();
      const isNotChatModel = message.includes('not a chat model') || message.includes('model_not_supported');

      if (isNotChatModel) {
        try {
          const textPrompt = buildTextGenerationPrompt(messages);
          const response = await hf.textGeneration({
            model: modelId,
            inputs: textPrompt,
            parameters: {
              max_new_tokens: 512,
              temperature: 0.7,
              return_full_text: false,
            },
          });

          const content = extractTextGenerationOutput(response);
          if (content) {
            return content;
          }
        } catch (textGenError) {
          lastError = textGenError;
          logger.warn('Hugging Face textGeneration fallback failed for model', {
            service: 'advisory-ai',
            meta: { modelId, error: textGenError.message },
          });
        }
      }

      logger.warn('Hugging Face advisory model attempt failed', {
        service: 'advisory-ai',
        meta: { modelId, error: error.message },
      });
    }
  }

  logger.error('Hugging Face advisory call failed for all models, using fallback advisory', {
    service: 'advisory-ai',
    meta: { modelsTried: modelCandidates, error: lastError?.message || 'Unknown error' },
  });

  return buildFallbackAdvice(userMessage);
}

module.exports = { getAgriculturalAdvice };