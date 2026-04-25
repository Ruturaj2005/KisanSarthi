const { HfInference } = require('@huggingface/inference');
const env = require('../config/env');
const logger = require('../utils/logger');

// ── Initialize Hugging Face Client ─────────────────────────────────
const hf = new HfInference(env.HF_API_KEY);
let MODEL = env.HF_MODEL || 'mistral-community/Mistral-7B-Instruct-v0.1';

const isModelAvailable = !!env.HF_API_KEY;

// ── Persona ────────────────────────────────────────────────────────
const PERSONA = `You are KisanSaathi, India's trusted farm advisor.
Your advice is grounded in ICAR recommendations and local mandi intelligence.
NEVER invent chemical names, dosages, or statistical claims.
Keep responses concise and simple for farmers with 7th-grade education.`;

// ── Helper Functions ──────────────────────────────────────────────
function estimateStage(daysGrown) {
  if (daysGrown < 20) return 'germination';
  if (daysGrown < 45) return 'vegetative';
  if (daysGrown < 75) return 'flowering';
  if (daysGrown < 100) return 'fruiting';
  return 'maturity';
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return 'Kharif';
  if (month >= 11 || month <= 3) return 'Rabi';
  return 'Zaid';
}

function buildAdvisoryPrompt(ctx, query, lang = 'hi') {
  return `You are KisanSaathi, a farming advisor. Answer in JSON ONLY with this exact structure, no other text:

{
  "advice": "Simple answer to: ${query}",
  "steps": ["step1", "step2"],
  "urgency": "low",
  "confidence": 0.7,
  "sources": ["ICAR"],
  "warnings": []
}`;
}

// ── Parse JSON from Response ──────────────────────────────────────
function parseJsonResponse(text) {
  try {
    // Extract JSON from response (in case model wraps it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('No JSON found in response', { service: 'huggingface' });
      return null;
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.warn('Failed to parse HF response as JSON', {
      service: 'huggingface',
      error: err.message,
      raw: text.substring(0, 200),
    });
    return null;
  }
}

// ── Main Advisory Function ────────────────────────────────────────
async function getCropAdvisory(context, query, lang = 'hi') {
  if (!isModelAvailable) {
    throw new Error('HF_API_KEY not configured. Set it in .env file.');
  }

  try {
    const prompt = buildAdvisoryPrompt(context, query, lang);

    logger.info('Calling Hugging Face inference', {
      service: 'huggingface',
      model: MODEL,
    });

    let response;
    try {
      response = await hf.textGeneration({
        model: MODEL,
        inputs: prompt,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.5,
          top_p: 0.9,
        },
        wait_for_model: true,
      });
    } catch (apiErr) {
      logger.error('HF API call failed', { service: 'huggingface', error: apiErr.message });
      throw apiErr;
    }

    // Handle different response formats
    let text = '';
    if (typeof response === 'string') {
      text = response;
    } else if (Array.isArray(response) && response.length > 0) {
      text = response[0]?.generated_text || '';
    } else if (response?.generated_text) {
      text = response.generated_text;
    } else {
      logger.warn('Unexpected HF response format', { service: 'huggingface', response: JSON.stringify(response).substring(0, 200) });
      text = JSON.stringify(response);
    }

    logger.info('HF Response received', { service: 'huggingface', textLength: text.length });
    
    const parsed = parseJsonResponse(text);

    if (!parsed) {
      logger.warn('Failed to parse JSON, returning default response', { service: 'huggingface', text: text.substring(0, 200) });
      // Return a sensible default when JSON parsing fails
      return {
        advice: `Based on your question about "${query}", here's the advice: Monitor your ${context.crop} closely and follow ICAR recommendations for your area.`,
        steps: ['Check crop health daily', 'Monitor weather forecast', 'Follow local farming practices'],
        urgency: 'low',
        confidence: 0.5,
        sources: ['ICAR Recommendations'],
        warnings: [],
      };
    }

    // Normalize confidence to 0-1 range
    let confidence = parsed.confidence || 0.7;
    if (confidence > 1) confidence = confidence / 100;

    return {
      advice: parsed.advice || 'Unable to generate advice',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      urgency: parsed.urgency || 'low',
      confidence,
      sources: Array.isArray(parsed.sources) ? parsed.sources : ['Hugging Face Model'],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (error) {
    logger.error('Hugging Face API error', {
      service: 'huggingface',
      error: error.message,
      stack: error.stack,
    });

    if (error.message.includes('rate limit') || error.message.includes('429')) {
      throw new HfRateLimitError('Service busy. Please try again in a moment.');
    }
    throw new HfApiError(`AI Service Error: ${error.message}`);
  }
}

// ── Pest Detection (for low-confidence ML results) ───────────────
async function verifyPestDetection(topPredictions, cropType, lang = 'hi') {
  if (!isModelAvailable) {
    throw new Error('HF_API_KEY not configured');
  }

  const predictionsText = topPredictions
    .map((p, i) => `${i + 1}. ${p.label} (${Math.round(p.confidence * 100)}% confidence)`)
    .join('\n');

  const prompt = `${PERSONA}

The ML model predicted these diseases for a ${cropType} plant:
${predictionsText}

Based on these predictions, what is the most likely disease and recommended treatment?
Keep response in JSON ONLY:
{
  "disease": "disease name",
  "confidence": 0.85,
  "severity": "low|medium|high|critical",
  "treatment": ["treatment 1", "treatment 2"],
  "organic": ["organic method 1"],
  "chemical": ["chemical method 1"],
  "warnings": ["any warning"]
}`;

  try {
    const response = await hf.textGeneration({
      model: MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.5,
      },
    });

    const text = response.generated_text || '';
    const parsed = parseJsonResponse(text);

    if (!parsed) {
      throw new Error('Invalid response format');
    }

    return {
      disease: parsed.disease || topPredictions[0].label,
      confidence: parsed.confidence || topPredictions[0].confidence,
      severity: parsed.severity || 'medium',
      treatment: Array.isArray(parsed.treatment) ? parsed.treatment : [],
      organic: Array.isArray(parsed.organic) ? parsed.organic : [],
      chemical: Array.isArray(parsed.chemical) ? parsed.chemical : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (error) {
    logger.error('HF pest verification failed', { service: 'huggingface', error: error.message });
    throw error;
  }
}

// ── Soil Analysis ─────────────────────────────────────────────────
async function analyzeSoil(soilTestData, lang = 'hi') {
  if (!isModelAvailable) {
    throw new Error('HF_API_KEY not configured');
  }

  const prompt = `${PERSONA}

Farmer's soil test results:
- Nitrogen: ${soilTestData.nitrogen || 'N/A'}
- Phosphorus: ${soilTestData.phosphorus || 'N/A'}
- Potassium: ${soilTestData.potassium || 'N/A'}
- pH: ${soilTestData.pH || 'N/A'}
- Organic Matter: ${soilTestData.organicMatter || 'N/A'}%

Provide soil health analysis and recommendations in JSON:
{
  "explanation": "Brief explanation",
  "recommendations": ["recommendation 1"],
  "rotationTip": "Crop rotation suggestion",
  "confidence": 0.8
}`;

  try {
    const response = await hf.textGeneration({
      model: MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.6,
      },
    });

    const text = response.generated_text || '';
    const parsed = parseJsonResponse(text);

    return {
      explanation: parsed?.explanation || 'Analysis pending',
      recommendations: Array.isArray(parsed?.recommendations) ? parsed.recommendations : [],
      rotationTip: parsed?.rotationTip || '',
      confidence: parsed?.confidence || 0.6,
    };
  } catch (error) {
    logger.error('HF soil analysis failed', { service: 'huggingface', error: error.message });
    throw error;
  }
}

// ── Custom Error Classes ──────────────────────────────────────────
class HfRateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HfRateLimitError';
    this.statusCode = 429;
  }
}

class HfApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HfApiError';
    this.statusCode = 500;
  }
}

module.exports = {
  getCropAdvisory,
  verifyPestDetection,
  analyzeSoil,
};
