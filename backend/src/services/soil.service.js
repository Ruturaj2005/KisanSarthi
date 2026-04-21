const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════════
//  ICAR Standard Thresholds (Soil Health Card norms)
// ═══════════════════════════════════════════════════════════════════
const ICAR_THRESHOLDS = {
  nitrogen:     { low: 280, high: 560, unit: 'kg/ha', label: 'Nitrogen (N)' },
  phosphorus:   { low: 10,  high: 25,  unit: 'kg/ha', label: 'Phosphorus (P)' },
  potassium:    { low: 110, high: 280, unit: 'kg/ha', label: 'Potassium (K)' },
  organicCarbon:{ low: 0.5, high: 0.75,unit: '%',     label: 'Organic Carbon' },
  ec:           { low: 0,   high: 1.0, unit: 'dS/m',  label: 'EC (Salinity)' },
  zinc:         { low: 0.6, high: 1.2, unit: 'ppm',   label: 'Zinc (Zn)' },
  iron:         { low: 4.5, high: 9.0, unit: 'ppm',   label: 'Iron (Fe)' },
  boron:        { low: 0.5, high: 1.0, unit: 'ppm',   label: 'Boron (B)' },
  manganese:    { low: 2.0, high: 4.0, unit: 'ppm',   label: 'Manganese (Mn)' },
};

/**
 * Categorize a numeric nutrient value into low/medium/high.
 */
function categorizeNutrient(value, nutrientKey) {
  if (value == null) return 'medium';
  const t = ICAR_THRESHOLDS[nutrientKey];
  if (!t) return 'medium';
  // For EC, logic is inverted: high EC = bad (saline)
  if (nutrientKey === 'ec') {
    if (value <= t.high) return 'high';  // low EC is good
    if (value <= 2.0) return 'medium';
    return 'low'; // high EC is bad
  }
  if (value < t.low) return 'low';
  if (value <= t.high) return 'medium';
  return 'high';
}

// ═══════════════════════════════════════════════════════════════════
//  Health Score Computation
// ═══════════════════════════════════════════════════════════════════
const WEIGHTS = {
  ph: 0.15, nitrogen: 0.18, phosphorus: 0.15, potassium: 0.15,
  moisture: 0.07, organicCarbon: 0.12, ec: 0.06,
  zinc: 0.04, iron: 0.04, boron: 0.02, manganese: 0.02,
};

function scorePH(ph) {
  if (ph >= 6.0 && ph <= 7.5) return 100;
  if ((ph >= 5.5 && ph < 6.0) || (ph > 7.5 && ph <= 8.0)) return 70;
  if ((ph >= 5.0 && ph < 5.5) || (ph > 8.0 && ph <= 8.5)) return 40;
  return 15;
}

const scoreNutrient = (v) => ({ high: 100, medium: 60, low: 20 }[v] || 60);

function scoreOC(oc) {
  if (oc == null) return 60;
  if (oc >= 0.75) return 100;
  if (oc >= 0.5) return 60;
  return 25;
}

function scoreEC(ec) {
  if (ec == null) return 80;
  if (ec <= 1.0) return 100;
  if (ec <= 2.0) return 60;
  return 20;
}

function scoreMicro(val, key) {
  if (val == null) return 60;
  const cat = categorizeNutrient(val, key);
  return scoreNutrient(cat);
}

/**
 * Compute overall soil health score (0-100).
 */
function computeHealthScore(data) {
  const nitrogenCat = data.nitrogenValue != null
    ? categorizeNutrient(data.nitrogenValue, 'nitrogen') : data.nitrogen;
  const phosphorusCat = data.phosphorusValue != null
    ? categorizeNutrient(data.phosphorusValue, 'phosphorus') : data.phosphorus;
  const potassiumCat = data.potassiumValue != null
    ? categorizeNutrient(data.potassiumValue, 'potassium') : data.potassium;

  return Math.round(
    scorePH(data.ph) * WEIGHTS.ph +
    scoreNutrient(nitrogenCat) * WEIGHTS.nitrogen +
    scoreNutrient(phosphorusCat) * WEIGHTS.phosphorus +
    scoreNutrient(potassiumCat) * WEIGHTS.potassium +
    scoreNutrient(data.moisture) * WEIGHTS.moisture +
    scoreOC(data.organicCarbon) * WEIGHTS.organicCarbon +
    scoreEC(data.ec) * WEIGHTS.ec +
    scoreMicro(data.zinc, 'zinc') * WEIGHTS.zinc +
    scoreMicro(data.iron, 'iron') * WEIGHTS.iron +
    scoreMicro(data.boron, 'boron') * WEIGHTS.boron +
    scoreMicro(data.manganese, 'manganese') * WEIGHTS.manganese
  );
}

/**
 * Compute radar chart data — normalized 0-100 scores per parameter.
 */
function computeNutrientRadar(data) {
  const nitrogenCat = data.nitrogenValue != null
    ? categorizeNutrient(data.nitrogenValue, 'nitrogen') : data.nitrogen;
  const phosphorusCat = data.phosphorusValue != null
    ? categorizeNutrient(data.phosphorusValue, 'phosphorus') : data.phosphorus;
  const potassiumCat = data.potassiumValue != null
    ? categorizeNutrient(data.potassiumValue, 'potassium') : data.potassium;

  return [
    { param: 'pH', score: scorePH(data.ph), fullMark: 100 },
    { param: 'Nitrogen', score: scoreNutrient(nitrogenCat), fullMark: 100 },
    { param: 'Phosphorus', score: scoreNutrient(phosphorusCat), fullMark: 100 },
    { param: 'Potassium', score: scoreNutrient(potassiumCat), fullMark: 100 },
    { param: 'Org. Carbon', score: scoreOC(data.organicCarbon), fullMark: 100 },
    { param: 'Moisture', score: scoreNutrient(data.moisture), fullMark: 100 },
    ...(data.zinc != null ? [{ param: 'Zinc', score: scoreMicro(data.zinc, 'zinc'), fullMark: 100 }] : []),
    ...(data.iron != null ? [{ param: 'Iron', score: scoreMicro(data.iron, 'iron'), fullMark: 100 }] : []),
  ];
}

// ═══════════════════════════════════════════════════════════════════
//  Deficiency Information
// ═══════════════════════════════════════════════════════════════════
const DEFICIENCY_INFO = {
  nitrogen: {
    symptoms: 'Yellowing of older/lower leaves, stunted growth, pale green foliage',
    yieldImpact: 'Can reduce yield by 20-40%',
    cropSpecific: {
      Rice: 'Tillering reduces, pale yellow leaves from tip',
      Wheat: 'Reduced ear size, fewer grains per ear',
      Maize: 'V-shaped yellowing from leaf tip along midrib',
      Tomato: 'Lower leaves turn yellow, small fruits',
      Cotton: 'Small bolls, premature shedding',
    },
    chemicalFix: 'Urea (46-0-0): 45 kg/acre as split dose',
    organicFix: 'FYM 4-5 tonnes/acre + Azotobacter biofertilizer',
  },
  phosphorus: {
    symptoms: 'Purple/dark green leaves, delayed maturity, poor root development',
    yieldImpact: 'Can reduce yield by 15-30%',
    cropSpecific: {
      Rice: 'Dark green leaves with purple tinge, delayed tillering',
      Wheat: 'Poor root growth, delayed heading',
      Maize: 'Purple coloration on stems and leaf margins',
      Tomato: 'Purple undersides of leaves, small fruits',
      Potato: 'Reduced tuber size and number',
    },
    chemicalFix: 'DAP (18-46-0): 55 kg/acre or SSP: 150 kg/acre',
    organicFix: 'Bone meal 10 kg/acre + PSB biofertilizer',
  },
  potassium: {
    symptoms: 'Brown leaf edges (scorch), weak stems, poor disease resistance',
    yieldImpact: 'Can reduce yield by 15-25%, increases lodging',
    cropSpecific: {
      Rice: 'Brown leaf tips, poor grain filling',
      Wheat: 'Weak straw, susceptible to lodging',
      Cotton: 'Premature defoliation, boll drop',
      Potato: 'Small tubers, reduced starch content',
      Tomato: 'Uneven ripening, hollow fruit',
    },
    chemicalFix: 'MOP (0-0-60): 35 kg/acre',
    organicFix: 'Wood ash 100 kg/acre + banana stem compost',
  },
  organicCarbon: {
    symptoms: 'Hard, compacted soil; poor water retention; low biological activity',
    yieldImpact: 'Reduces overall fertility and microbial activity by 30-50%',
    chemicalFix: 'Not fixable with chemicals alone',
    organicFix: 'FYM 5 tonnes/acre + green manuring (dhaincha/sunhemp)',
  },
  zinc: {
    symptoms: 'White/light bands between leaf veins (interveinal chlorosis), stunted growth',
    yieldImpact: 'Can reduce yield by 10-20%',
    cropSpecific: {
      Rice: 'Khaira disease — dusty brown spots on leaves, growth stops',
      Wheat: 'White strips between veins, short internodes',
      Maize: 'White striping, stunted growth',
    },
    chemicalFix: 'Zinc Sulphate (ZnSO4): 25 kg/acre in soil OR 0.5% foliar spray',
    organicFix: 'Zinc-enriched FYM compost',
  },
  iron: {
    symptoms: 'Interveinal chlorosis on young/new leaves (veins stay green, leaf turns yellow)',
    yieldImpact: 'Can reduce yield by 10-15%',
    cropSpecific: {
      Rice: 'New leaves turn yellow-white between veins',
      Groundnut: 'Severe chlorosis, poor pod filling',
    },
    chemicalFix: 'Ferrous Sulphate (FeSO4): 25 kg/acre in soil OR 1% foliar spray',
    organicFix: 'Well-decomposed FYM + Trichoderma',
  },
  boron: {
    symptoms: 'Thick, brittle leaves; hollow stems; poor flowering and fruit set',
    yieldImpact: 'Can reduce yield by 10-20%, severe in oilseeds',
    cropSpecific: {
      Mustard: 'Hollow stem, poor oil content',
      Cotton: 'Ball shedding, poor fibre quality',
      Tomato: 'Internal browning, cracked fruits',
    },
    chemicalFix: 'Borax: 5 kg/acre in soil OR 0.2% boric acid foliar spray',
    organicFix: 'Vermicompost (boron-rich)',
  },
  manganese: {
    symptoms: 'Interveinal chlorosis on young leaves (similar to iron but with brown spots)',
    yieldImpact: 'Can reduce yield by 5-15%',
    chemicalFix: 'Manganese Sulphate (MnSO4): 10 kg/acre',
    organicFix: 'Acidified FYM application',
  },
};

/**
 * Get deficiency details for nutrients that are low.
 */
function getDeficiencies(soilData, crop) {
  const deficiencies = [];
  const checkMap = {
    nitrogen: soilData.nitrogenValue != null ? categorizeNutrient(soilData.nitrogenValue, 'nitrogen') : soilData.nitrogen,
    phosphorus: soilData.phosphorusValue != null ? categorizeNutrient(soilData.phosphorusValue, 'phosphorus') : soilData.phosphorus,
    potassium: soilData.potassiumValue != null ? categorizeNutrient(soilData.potassiumValue, 'potassium') : soilData.potassium,
  };

  // Check NPK
  for (const [key, level] of Object.entries(checkMap)) {
    if (level === 'low') {
      const info = DEFICIENCY_INFO[key];
      deficiencies.push({
        nutrient: ICAR_THRESHOLDS[key].label,
        level: 'low',
        severity: 'high',
        symptoms: info.cropSpecific?.[crop] || info.symptoms,
        yieldImpact: info.yieldImpact,
        chemicalFix: info.chemicalFix,
        organicFix: info.organicFix,
      });
    }
  }

  // Check OC
  if (soilData.organicCarbon != null && soilData.organicCarbon < 0.5) {
    const info = DEFICIENCY_INFO.organicCarbon;
    deficiencies.push({
      nutrient: 'Organic Carbon',
      level: 'low',
      severity: soilData.organicCarbon < 0.3 ? 'critical' : 'high',
      symptoms: info.symptoms,
      yieldImpact: info.yieldImpact,
      chemicalFix: info.chemicalFix,
      organicFix: info.organicFix,
    });
  }

  // Check micronutrients
  const micros = { zinc: soilData.zinc, iron: soilData.iron, boron: soilData.boron, manganese: soilData.manganese };
  for (const [key, val] of Object.entries(micros)) {
    if (val != null && categorizeNutrient(val, key) === 'low') {
      const info = DEFICIENCY_INFO[key];
      deficiencies.push({
        nutrient: ICAR_THRESHOLDS[key].label,
        level: 'low',
        severity: 'medium',
        symptoms: info.cropSpecific?.[crop] || info.symptoms,
        yieldImpact: info.yieldImpact,
        chemicalFix: info.chemicalFix,
        organicFix: info.organicFix,
      });
    }
  }

  return deficiencies;
}

// ═══════════════════════════════════════════════════════════════════
//  Fertilizer Recommendations
// ═══════════════════════════════════════════════════════════════════
const FERTILIZER_BASE = {
  Rice:      { N: 120, P: 60, K: 60 },
  Wheat:     { N: 120, P: 60, K: 40 },
  Maize:     { N: 120, P: 60, K: 40 },
  Cotton:    { N: 160, P: 80, K: 80 },
  Soybean:   { N: 30,  P: 60, K: 40 },
  Tomato:    { N: 150, P: 100, K: 100 },
  Onion:     { N: 120, P: 80, K: 80 },
  Potato:    { N: 180, P: 120, K: 150 },
  Mustard:   { N: 80,  P: 40, K: 40 },
  Chickpea:  { N: 20,  P: 60, K: 40 },
  Groundnut: { N: 25,  P: 50, K: 75 },
  Sugarcane: { N: 300, P: 85, K: 85 },
  Bajra:     { N: 80,  P: 40, K: 40 },
  Jowar:     { N: 80,  P: 40, K: 40 },
};

// ── Split Ratios (for per-hectare doses) ───────────────────────
const SPLIT_RATIOS = {
  Rice:      { basal: { N: 0.50, P: 1.0, K: 0.50 }, topDress1: { N: 0.25, K: 0.25 }, topDress2: { N: 0.25, K: 0.25 }, td1Days: 25, td2Days: 50 },
  Wheat:     { basal: { N: 0.50, P: 1.0, K: 1.0  }, topDress1: { N: 0.25 }, topDress2: { N: 0.25 }, td1Days: 21, td2Days: 45 },
  Maize:     { basal: { N: 0.33, P: 1.0, K: 0.50 }, topDress1: { N: 0.33, K: 0.50 }, topDress2: { N: 0.34 }, td1Days: 25, td2Days: 45 },
  Cotton:    { basal: { N: 0.25, P: 1.0, K: 0.50 }, topDress1: { N: 0.25, K: 0.25 }, topDress2: { N: 0.50, K: 0.25 }, td1Days: 30, td2Days: 60 },
  Tomato:    { basal: { N: 0.33, P: 1.0, K: 0.33 }, topDress1: { N: 0.33, K: 0.33 }, topDress2: { N: 0.34, K: 0.34 }, td1Days: 30, td2Days: 55 },
  Potato:    { basal: { N: 0.50, P: 1.0, K: 0.50 }, topDress1: { N: 0.25, K: 0.50 }, topDress2: { N: 0.25 }, td1Days: 30, td2Days: 50 },
  default:   { basal: { N: 0.50, P: 1.0, K: 1.0  }, topDress1: { N: 0.25 }, topDress2: { N: 0.25 }, td1Days: 25, td2Days: 50 },
};

function adjustForSoil(baseVal, level) {
  if (level === 'high') return Math.round(baseVal * 0.7);
  if (level === 'low') return Math.round(baseVal * 1.3);
  return baseVal;
}

/**
 * Get fertilizer recommendation with split-dose schedule.
 */
function getFertilizerSchedule(crop, soilData) {
  const base = FERTILIZER_BASE[crop] || { N: 80, P: 40, K: 40 };
  const nLevel = soilData.nitrogenValue != null ? categorizeNutrient(soilData.nitrogenValue, 'nitrogen') : soilData.nitrogen;
  const pLevel = soilData.phosphorusValue != null ? categorizeNutrient(soilData.phosphorusValue, 'phosphorus') : soilData.phosphorus;
  const kLevel = soilData.potassiumValue != null ? categorizeNutrient(soilData.potassiumValue, 'potassium') : soilData.potassium;

  const totalN = adjustForSoil(base.N, nLevel);
  const totalP = adjustForSoil(base.P, pLevel);
  const totalK = adjustForSoil(base.K, kLevel);

  // Convert to per-acre (÷2.5)
  const perAcre = { N: Math.round(totalN / 2.5), P: Math.round(totalP / 2.5), K: Math.round(totalK / 2.5) };

  const splits = SPLIT_RATIOS[crop] || SPLIT_RATIOS.default;

  return {
    totalPerAcre: perAcre,
    note: `ICAR recommended for ${crop} (adjusted for your soil)`,
    schedule: [
      {
        phase: 'Basal (at sowing)',
        timing: 'Day 0',
        doses: {
          N: Math.round(perAcre.N * (splits.basal.N || 0)),
          P: Math.round(perAcre.P * (splits.basal.P || 0)),
          K: Math.round(perAcre.K * (splits.basal.K || 0)),
        },
        products: [
          `DAP: ${Math.round((perAcre.P * (splits.basal.P || 0)) / 0.46)} kg/acre`,
          `MOP: ${Math.round((perAcre.K * (splits.basal.K || 0)) / 0.60)} kg/acre`,
        ],
      },
      {
        phase: '1st Top Dress',
        timing: `Day ${splits.td1Days}`,
        doses: {
          N: Math.round(perAcre.N * (splits.topDress1.N || 0)),
          P: 0,
          K: Math.round(perAcre.K * (splits.topDress1.K || 0)),
        },
        products: [
          `Urea: ${Math.round((perAcre.N * (splits.topDress1.N || 0)) / 0.46)} kg/acre`,
        ],
      },
      {
        phase: '2nd Top Dress',
        timing: `Day ${splits.td2Days}`,
        doses: {
          N: Math.round(perAcre.N * (splits.topDress2.N || 0)),
          P: 0,
          K: Math.round(perAcre.K * (splits.topDress2.K || 0)),
        },
        products: [
          `Urea: ${Math.round((perAcre.N * (splits.topDress2.N || 0)) / 0.46)} kg/acre`,
        ],
      },
    ],
  };
}

// Legacy simple recommendation
function getFertilizerRecommendation(crop, soilNutrients) {
  const schedule = getFertilizerSchedule(crop, soilNutrients);
  return { ...schedule.totalPerAcre, note: schedule.note };
}

// ═══════════════════════════════════════════════════════════════════
//  Organic Alternatives
// ═══════════════════════════════════════════════════════════════════
function getOrganicAlternatives(soilData) {
  const recs = [];

  recs.push({
    name: 'FYM (Farmyard Manure)',
    icon: '🐄',
    qty: '4-5 tonnes/acre',
    when: '2-3 weeks before sowing, mix well into soil',
    benefit: 'Improves OC, water retention, NPK, and soil microbes',
    priority: soilData.organicCarbon != null && soilData.organicCarbon < 0.5 ? 'high' : 'medium',
  });

  recs.push({
    name: 'Vermicompost',
    icon: '🪱',
    qty: '1-2 tonnes/acre',
    when: 'At sowing, mix in furrows or broadcast',
    benefit: 'Rich in humus, enzymes and growth hormones. Improves soil structure.',
    priority: 'medium',
  });

  const nLevel = soilData.nitrogenValue != null ? categorizeNutrient(soilData.nitrogenValue, 'nitrogen') : soilData.nitrogen;
  if (nLevel === 'low') {
    recs.push({
      name: 'Green Manure (Dhaincha/Sunhemp)',
      icon: '🌿',
      qty: 'Sow as cover crop → plough at 45 days',
      when: '6-8 weeks before main crop sowing',
      benefit: 'Fixes 60-80 kg N/ha naturally, improves soil structure',
      priority: 'high',
    });
  }

  recs.push({
    name: 'Neem Cake',
    icon: '🌳',
    qty: '100-200 kg/acre',
    when: 'At sowing, mix in soil',
    benefit: 'Slow-release N, natural pest repellent, improves soil health',
    priority: 'low',
  });

  // Biofertilizers
  recs.push({
    name: 'Biofertilizers (Rhizobium/Azotobacter/PSB)',
    icon: '🦠',
    qty: '200g per acre as seed treatment',
    when: 'Coat seeds before sowing',
    benefit: 'Enhances N fixation & P availability at very low cost',
    priority: nLevel === 'low' ? 'high' : 'medium',
  });

  return recs.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return (p[a.priority] || 2) - (p[b.priority] || 2);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  pH Correction
// ═══════════════════════════════════════════════════════════════════
function phCorrection(ph) {
  if (ph > 8.5) {
    return { material: 'Gypsum', qty: '200 kg/acre', alt: 'Pyrite 100 kg/acre', reason: 'Soil is strongly alkaline (pH > 8.5). Gypsum helps reduce pH and improves soil structure.' };
  }
  if (ph > 7.5) {
    return { material: 'Gypsum', qty: '100 kg/acre', alt: 'Sulfur 20 kg/acre', reason: 'Soil is moderately alkaline. Apply gypsum to gradually lower pH.' };
  }
  if (ph < 5.0) {
    return { material: 'Agricultural Lime', qty: '200 kg/acre', alt: 'Dolomite 150 kg/acre', reason: 'Soil is strongly acidic (pH < 5.0). Liming is essential to unlock nutrient availability.' };
  }
  if (ph < 6.0) {
    return { material: 'Agricultural Lime', qty: '100 kg/acre', alt: 'Wood ash 200 kg/acre', reason: 'Soil is moderately acidic. Lime application will improve nutrient availability.' };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
//  Crop Rotation
// ═══════════════════════════════════════════════════════════════════
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

  const nLevel = soilNutrients.nitrogenValue != null
    ? categorizeNutrient(soilNutrients.nitrogenValue, 'nitrogen') : soilNutrients.nitrogen;

  if (nLevel === 'low') {
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

// ═══════════════════════════════════════════════════════════════════
//  Soil Improvement Action Plan
// ═══════════════════════════════════════════════════════════════════
function getSoilImprovementPlan(soilData, crop) {
  const actions = [];

  // pH action
  const phFix = phCorrection(soilData.ph);
  if (phFix) {
    actions.push({
      step: actions.length + 1,
      title: 'Fix Soil pH',
      icon: '⚗️',
      description: phFix.reason,
      action: `Apply ${phFix.material} — ${phFix.qty}`,
      when: '2-3 weeks before sowing',
      priority: 'high',
    });
  }

  // OC action
  if (soilData.organicCarbon != null && soilData.organicCarbon < 0.5) {
    actions.push({
      step: actions.length + 1,
      title: 'Increase Organic Carbon',
      icon: '🌱',
      description: 'Low OC means poor microbial life and water retention',
      action: 'Apply FYM 5 tonnes/acre OR green manure crop (dhaincha) for 45 days before sowing',
      when: '6-8 weeks before main crop',
      priority: 'high',
    });
  }

  // EC/salinity action
  if (soilData.ec != null && soilData.ec > 2.0) {
    actions.push({
      step: actions.length + 1,
      title: 'Manage Soil Salinity',
      icon: '🧂',
      description: 'High EC indicates saline soil which restricts water uptake by roots',
      action: 'Apply Gypsum 200 kg/acre + ensure proper drainage + leaching irrigation',
      when: 'Before sowing season',
      priority: 'high',
    });
  }

  // Micronutrient action
  const microLow = [];
  if (soilData.zinc != null && categorizeNutrient(soilData.zinc, 'zinc') === 'low') microLow.push('ZnSO4 25 kg/acre');
  if (soilData.iron != null && categorizeNutrient(soilData.iron, 'iron') === 'low') microLow.push('FeSO4 25 kg/acre');
  if (soilData.boron != null && categorizeNutrient(soilData.boron, 'boron') === 'low') microLow.push('Borax 5 kg/acre');
  if (microLow.length > 0) {
    actions.push({
      step: actions.length + 1,
      title: 'Fix Micronutrient Deficiency',
      icon: '💊',
      description: `Your soil is deficient in ${microLow.length} micronutrient(s)`,
      action: microLow.join(' + '),
      when: 'At sowing, mix in soil',
      priority: 'medium',
    });
  }

  // General improvement
  actions.push({
    step: actions.length + 1,
    title: 'Follow Fertilizer Schedule',
    icon: '📅',
    description: `Apply the recommended basal + top-dress doses for ${crop}`,
    action: 'See the fertilizer schedule above for exact quantities and timing',
    when: 'Throughout the crop cycle',
    priority: 'medium',
  });

  // Biological
  actions.push({
    step: actions.length + 1,
    title: 'Use Biofertilizers',
    icon: '🦠',
    description: 'Reduce chemical dependency and improve soil biology',
    action: 'Apply Azotobacter + PSB as seed coating (200g/acre) before sowing',
    when: 'At sowing',
    priority: 'low',
  });

  return actions;
}

// ═══════════════════════════════════════════════════════════════════
//  Exports
// ═══════════════════════════════════════════════════════════════════
module.exports = {
  computeHealthScore,
  computeNutrientRadar,
  getFertilizerRecommendation,
  getFertilizerSchedule,
  phCorrection,
  getRotationSuggestion,
  getDeficiencies,
  getOrganicAlternatives,
  getSoilImprovementPlan,
  categorizeNutrient,
  scorePH,
  scoreNutrient,
  FERTILIZER_BASE,
  ICAR_THRESHOLDS,
};
