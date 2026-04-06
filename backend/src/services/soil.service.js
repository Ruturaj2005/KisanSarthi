const logger = require('../utils/logger');

// ── Weights for Health Score Calculation ────────────────────────────
const WEIGHTS = { ph: 0.20, nitrogen: 0.25, phosphorus: 0.20, potassium: 0.20, moisture: 0.15 };

/**
 * Score pH value. Optimal range: 6.0-7.5.
 * @param {number} ph - Soil pH (4.0-9.0)
 * @returns {number} Score 0-100
 */
function scorePH(ph) {
  if (ph >= 6.0 && ph <= 7.5) return 100;
  if ((ph >= 5.5 && ph < 6.0) || (ph > 7.5 && ph <= 8.0)) return 70;
  if ((ph >= 5.0 && ph < 5.5) || (ph > 8.0 && ph <= 8.5)) return 40;
  return 15;
}

/**
 * Score nutrient level.
 * @param {string} value - 'low' | 'medium' | 'high'
 * @returns {number} Score 0-100
 */
const scoreNutrient = (v) => ({ high: 100, medium: 60, low: 20 }[v] || 0);

/**
 * Compute overall soil health score (0-100).
 * Deterministic, testable — no AI needed.
 *
 * @example
 * computeHealthScore({ ph: 6.5, nitrogen: 'high', phosphorus: 'medium', potassium: 'low', moisture: 'medium' });
 * // → 68
 */
function computeHealthScore(data) {
  return Math.round(
    scorePH(data.ph) * WEIGHTS.ph +
    scoreNutrient(data.nitrogen) * WEIGHTS.nitrogen +
    scoreNutrient(data.phosphorus) * WEIGHTS.phosphorus +
    scoreNutrient(data.potassium) * WEIGHTS.potassium +
    scoreNutrient(data.moisture) * WEIGHTS.moisture
  );
}

// ── ICAR Fertilizer Base Recommendations (kg/acre) ─────────────────
const FERTILIZER_BASE = {
  Rice:      { N: 60, P: 30, K: 30 },
  Wheat:     { N: 60, P: 30, K: 15 },
  Maize:     { N: 60, P: 30, K: 20 },
  Cotton:    { N: 80, P: 40, K: 40 },
  Soybean:   { N: 25, P: 60, K: 40 },
  Tomato:    { N: 70, P: 50, K: 50 },
  Onion:     { N: 60, P: 40, K: 40 },
  Potato:    { N: 80, P: 60, K: 100 },
  Mustard:   { N: 60, P: 30, K: 20 },
  Chickpea:  { N: 20, P: 40, K: 20 },
  Groundnut: { N: 25, P: 50, K: 75 },
  Sugarcane: { N: 150, P: 60, K: 60 },
  Bajra:     { N: 40, P: 20, K: 20 },
  Jowar:     { N: 40, P: 20, K: 20 },
};

/**
 * Adjust fertilizer doses based on soil nutrient levels.
 * 'high' → reduce by 30%, 'low' → increase by 30%, 'medium' → no change.
 *
 * @param {object} base - { N, P, K } base doses
 * @param {object} soilNutrients - { nitrogen, phosphorus, potassium }
 * @returns {object} Adjusted { N, P, K } doses
 */
function adjustForSoil(base, soilNutrients) {
  const adjust = (baseVal, level) => {
    if (level === 'high') return Math.round(baseVal * 0.7);
    if (level === 'low') return Math.round(baseVal * 1.3);
    return baseVal;
  };

  return {
    N: adjust(base.N, soilNutrients.nitrogen),
    P: adjust(base.P, soilNutrients.phosphorus),
    K: adjust(base.K, soilNutrients.potassium),
  };
}

/**
 * Get fertilizer recommendation for a crop with soil adjustments.
 */
function getFertilizerRecommendation(crop, soilNutrients) {
  const base = FERTILIZER_BASE[crop];
  if (!base) {
    return { N: 40, P: 20, K: 20, note: 'Generic recommendation — crop not in database' };
  }
  return { ...adjustForSoil(base, soilNutrients), note: `ICAR recommended for ${crop}` };
}

/**
 * pH correction recommendations.
 * @param {number} ph - Soil pH
 * @returns {object|null} Correction recommendation or null if pH is optimal
 */
function phCorrection(ph) {
  if (ph > 7.5) {
    return { material: 'Gypsum', qty: '100 kg/acre', alt: 'Sulfur 20 kg/acre', reason: 'Soil is alkaline' };
  }
  if (ph < 6.0) {
    return { material: 'Agricultural Lime', qty: '150 kg/acre', alt: null, reason: 'Soil is acidic' };
  }
  return null;
}

/**
 * Crop rotation suggestions based on soil nutrient depletion patterns.
 */
function getRotationSuggestion(currentCrop, soilNutrients) {
  const rotations = {
    Rice: ['Wheat', 'Potato', 'Mustard', 'Chickpea'],
    Wheat: ['Rice', 'Soybean', 'Maize', 'Cotton'],
    Maize: ['Wheat', 'Chickpea', 'Soybean'],
    Cotton: ['Wheat', 'Groundnut', 'Soybean'],
    Soybean: ['Wheat', 'Maize', 'Cotton'],
    Tomato: ['Onion', 'Chickpea', 'Maize'],
    Onion: ['Tomato', 'Wheat', 'Chickpea'],
    Potato: ['Wheat', 'Maize', 'Mustard'],
    Mustard: ['Rice', 'Maize', 'Chickpea'],
    Chickpea: ['Rice', 'Wheat', 'Maize'],
    Groundnut: ['Wheat', 'Maize', 'Cotton'],
    Sugarcane: ['Rice', 'Wheat', 'Soybean'],
    Bajra: ['Wheat', 'Chickpea', 'Mustard'],
    Jowar: ['Wheat', 'Chickpea', 'Groundnut'],
  };

  // If nitrogen is low, prioritize legumes
  if (soilNutrients.nitrogen === 'low') {
    return {
      suggestions: ['Chickpea', 'Soybean', 'Groundnut'],
      reason: 'Legumes fix nitrogen naturally — reduces fertilizer need next season',
    };
  }

  return {
    suggestions: rotations[currentCrop] || ['Wheat', 'Chickpea', 'Maize'],
    reason: `Recommended rotation after ${currentCrop} for balanced soil nutrients`,
  };
}

module.exports = {
  computeHealthScore,
  getFertilizerRecommendation,
  phCorrection,
  getRotationSuggestion,
  scorePH,
  scoreNutrient,
  FERTILIZER_BASE,
};
