// Using Ollama as the backend LLM natively
const ollama = require('ollama').default || require('ollama');
const { z } = require('zod');
const env = require('../config/env');
const logger = require('../utils/logger');

// We are overriding 'model' availability to true so operations proceed
const isModelAvailable = true;

const OLLAMA_MODEL = 'kimi-k2-thinking:cloud';

// ── Zod Schemas for Response Validation ────────────────────────────
const parseConfidence = z.preprocess((val) => {
  if (typeof val === 'number') {
    return val > 1 ? val / 100 : val;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      return val.includes('%') || num > 1 ? num / 100 : num;
    }
  }
  return 0.5;
}, z.number().min(0).max(1));

const advisorySchema = z.object({
  advice: z.string(),
  steps: z.array(z.string()).default([]),
  urgency: z.enum(['low', 'medium', 'high']).or(z.string()).default('low'),
  confidence: parseConfidence.default(0.5),
  sources: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

const soilSchema = z.object({
  explanation: z.string(),
  recommendations: z.array(z.string()).default([]),
  rotationTip: z.string().default(''),
  confidence: parseConfidence.default(0.5),
});

const pestSchema = z.object({
  disease: z.string(),
  confidence: parseConfidence,
  severity: z.enum(['low', 'medium', 'high', 'critical']).or(z.string()),
  treatment: z.array(z.string()).default([]),
  organic: z.array(z.string()).default([]),
  chemical: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

// ── Persona ────────────────────────────────────────────────────────
const PERSONA = `You are KisanSaathi, India's trusted farm advisor.
Your advice is grounded in ICAR recommendations and local mandi intelligence.
NEVER invent chemical names, dosages, or statistical claims.
Respond ONLY in valid JSON. No markdown fences, no prose outside JSON.`;

// ── Growth Stage Estimator ─────────────────────────────────────────
function estimateStage(daysGrown) {
  if (daysGrown < 20) return 'germination';
  if (daysGrown < 45) return 'vegetative';
  if (daysGrown < 75) return 'flowering';
  if (daysGrown < 100) return 'fruiting';
  return 'maturity';
}

// ── Season Detector ────────────────────────────────────────────────
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return 'Kharif';
  if (month >= 11 || month <= 3) return 'Rabi';
  return 'Zaid';
}

// ── Prompt Builders ────────────────────────────────────────────────

function buildAdvisoryPrompt(ctx, query, lang = 'hi') {
  return `${PERSONA}
Language: ${lang}. Use vocabulary a 7th-grade farmer understands.

Farmer context:
- Location: ${ctx.district || 'Unknown'}, ${ctx.state || 'Unknown'}
- Soil: ${ctx.soilType || 'Unknown'}, pH ${ctx.ph || 'Unknown'}
- Current crop: ${ctx.crop || 'Unknown'} (${ctx.daysGrown || 0} days grown → stage: ${estimateStage(ctx.daysGrown || 0)})
- Season: ${getCurrentSeason()}
- Weather: ${ctx.weather?.condition || 'Unknown'}, ${ctx.weather?.temp || 'N/A'}°C, ${ctx.weather?.humidity || 'N/A'}% humidity
- Recent crops: ${ctx.lastTwoSeasons?.join(' → ') || 'No history'}

Farmer's question: "${query}"

Reply in JSON only:
{
  "advice": "<2-3 simple sentences in ${lang}>",
  "steps": ["<step 1>", "<step 2>", ...],
  "urgency": "low|medium|high",
  "confidence": 0.85,
  "sources": ["ICAR 2023", ...],
  "warnings": ["<any safety warnings>"]
}`;
}

function buildSoilExplainPrompt(soilData, lang = 'hi') {
  return `${PERSONA}
Language: ${lang}. Use vocabulary a 7th-grade farmer understands.

Soil test results:
- Soil type: ${soilData.soilType}
- pH: ${soilData.ph}
- Nitrogen: ${soilData.nitrogen}
- Phosphorus: ${soilData.phosphorus}
- Potassium: ${soilData.potassium}
- Moisture: ${soilData.moisture}
- Health Score: ${soilData.healthScore}/100
- Target crop: ${soilData.crop || 'General'}

Explain soil health in simple terms. Include what's good, what needs improvement, and a crop rotation suggestion.

Reply in JSON only:
{
  "explanation": "<2-3 simple sentences>",
  "recommendations": ["<rec 1>", "<rec 2>", ...],
  "rotationTip": "<1 sentence crop rotation suggestion>",
  "confidence": 0.85
}`;
}

function buildPestVerifyPrompt(labels, cropType, lang = 'hi') {
  return `${PERSONA}
Language: ${lang}.

A pest/disease detection model predicted the following top-3 labels for a ${cropType} leaf image:
${labels.map((l, i) => `${i + 1}. ${l.label} (confidence: ${(l.confidence * 100).toFixed(1)}%)`).join('\n')}

Verify which is most likely and provide treatment advice.

Reply in JSON only:
{
  "disease": "<most likely disease name>",
  "confidence": 0.85,
  "severity": "low|medium|high|critical",
  "treatment": ["<step 1>", ...],
  "organic": ["<organic option 1>", ...],
  "chemical": ["<chemical option with ICAR dosage>", ...],
  "warnings": ["<any safety warnings>"]
}`;
}

function buildWeatherAdvisoryPrompt(weather, crop, lang = 'hi') {
  return `${PERSONA}
Language: ${lang}.

Current weather: ${weather.condition}, ${weather.temp}°C, humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h, rainfall ${weather.rainfall || 0}mm.
Farmer's active crop: ${crop || 'Unknown'}.

Give 1-2 actionable weather tips in JSON:
{
  "advice": "<1-2 sentences>",
  "steps": ["<action 1>"],
  "urgency": "low|medium|high",
  "confidence": 0.9,
  "sources": ["IMD"],
  "warnings": []
}`;
}

function buildFertilizerPrompt(soilData, crop, lang = 'hi') {
  return `${PERSONA}
Language: ${lang}.

Soil: ${soilData.soilType}, pH ${soilData.ph}, N:${soilData.nitrogen}, P:${soilData.phosphorus}, K:${soilData.potassium}
Crop: ${crop}
Season: ${getCurrentSeason()}

Recommend ICAR-approved fertilizer schedule in JSON:
{
  "advice": "<summary>",
  "steps": ["<schedule step 1>", ...],
  "urgency": "medium",
  "confidence": 0.8,
  "sources": ["ICAR Fertilizer Guide"],
  "warnings": ["<safety note>"]
}`;
}

// ── Defensive JSON Parser ──────────────────────────────────────────
function parseGeminiJSON(raw, schema) {
  let stripped = raw;
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    stripped = match[1];
  } else {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      stripped = raw.substring(start, end + 1);
    }
  }
  
  try {
    const parsed = JSON.parse(stripped);
    try {
      return schema.parse(parsed);
    } catch (zodError) {
      console.error('Zod Schema Validation Error:', zodError.errors);
      console.log('Parsed Object:', parsed);
      throw zodError;
    }
  } catch (error) {
    logger.error('Failed to parse Gemini response', {
      service: 'gemini',
      meta: { raw: raw.substring(0, 500), stripped: stripped.substring(0, 500), error: error.message },
    });
    throw new Error('AI response parsing failed');
  }
}

// ── Main API Functions ─────────────────────────────────────────────

/**
 * Get crop advisory from Gemini.
 * @param {object} context - Farmer context
 * @param {string} query - Farmer's question
 * @param {string} lang - Target language
 * @returns {Promise<object>} Parsed advisory response
 */
const getCropAdvisory = async (context, query, lang = 'hi') => {
  if (!isModelAvailable) {
    return {
      advice: 'AI service is currently unavailable. Please try again later.',
      steps: [],
      urgency: 'low',
      confidence: 0,
      sources: [],
      warnings: ['AI service offline'],
    };
  }

  const prompt = buildAdvisoryPrompt(context, query, lang);
  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
    });
    return parseGeminiJSON(response.message.content, advisorySchema);
  } catch (error) {
    logger.error('Ollama Chat Error', { error: error.message });
    throw error;
  }
};

const getSoilExplanation = async (soilData, lang = 'hi') => {
  if (!isModelAvailable) {
    return { explanation: 'AI unavailable', recommendations: [], rotationTip: '', confidence: 0 };
  }
  const prompt = buildSoilExplainPrompt(soilData, lang);
  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  return parseGeminiJSON(response.message.content, soilSchema);
};

const verifyPestDetection = async (labels, cropType, lang = 'hi') => {
  if (!isModelAvailable) {
    return { disease: labels[0]?.label || 'Unknown', confidence: 0, severity: 'low', treatment: [], organic: [], chemical: [], warnings: ['AI verification unavailable'] };
  }
  const prompt = buildPestVerifyPrompt(labels, cropType, lang);
  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  return parseGeminiJSON(response.message.content, pestSchema);
};

const getWeatherAdvisory = async (weather, crop, lang = 'hi') => {
  if (!isModelAvailable) {
    return { advice: 'Weather advisory unavailable', steps: [], urgency: 'low', confidence: 0, sources: [], warnings: [] };
  }
  const prompt = buildWeatherAdvisoryPrompt(weather, crop, lang);
  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  return parseGeminiJSON(response.message.content, advisorySchema);
};

const getFertilizerAdvice = async (soilData, crop, lang = 'hi') => {
  if (!isModelAvailable) {
    return { advice: 'Fertilizer advice unavailable', steps: [], urgency: 'medium', confidence: 0, sources: [], warnings: [] };
  }
  const prompt = buildFertilizerPrompt(soilData, crop, lang);
  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  return parseGeminiJSON(response.message.content, advisorySchema);
};

module.exports = {
  getCropAdvisory,
  getSoilExplanation,
  verifyPestDetection,
  getWeatherAdvisory,
  getFertilizerAdvice,
  estimateStage,
  getCurrentSeason,
};
