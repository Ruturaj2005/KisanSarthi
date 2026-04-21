'use client';
import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
} from 'recharts';

const CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Tomato', 'Onion', 'Potato', 'Mustard', 'Chickpea', 'Groundnut', 'Sugarcane', 'Bajra', 'Jowar'];

const SOIL_TYPES = [
  { key: 'loamy', icon: '🟤', label: 'Loamy' },
  { key: 'sandy', icon: '🏖️', label: 'Sandy' },
  { key: 'clay', icon: '🧱', label: 'Clay' },
  { key: 'silt', icon: '🪨', label: 'Silt' },
  { key: 'alluvial', icon: '🌊', label: 'Alluvial' },
];

const CROP_ICONS = {
  Rice: '🍚', Wheat: '🌾', Maize: '🌽', Cotton: '🧵', Soybean: '🫘', Tomato: '🍅',
  Onion: '🧅', Potato: '🥔', Mustard: '🌼', Chickpea: '🫘', Groundnut: '🥜',
  Sugarcane: '🎋', Bajra: '🌿', Jowar: '🌿',
};

export default function SoilPage() {
  const { farmer } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  // ── Input State ────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState('quick'); // 'quick' | 'advanced'
  const [step, setStep] = useState(1); // 1-3
  const [soilType, setSoilType] = useState(farmer?.soilType || '');
  const [ph, setPh] = useState(6.5);
  const [organicCarbon, setOrganicCarbon] = useState(0.5);
  const [ec, setEc] = useState(0.5);
  const [nitrogen, setNitrogen] = useState('medium');
  const [phosphorus, setPhosphorus] = useState('medium');
  const [potassium, setPotassium] = useState('medium');
  const [moisture, setMoisture] = useState('medium');
  const [nitrogenValue, setNitrogenValue] = useState(280);
  const [phosphorusValue, setPhosphorusValue] = useState(18);
  const [potassiumValue, setPotassiumValue] = useState(150);
  const [zinc, setZinc] = useState(null);
  const [iron, setIron] = useState(null);
  const [boron, setBoron] = useState(null);
  const [manganese, setManganese] = useState(null);
  const [showMicro, setShowMicro] = useState(false);
  const [crop, setCrop] = useState('');

  // ── Results State ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultTab, setResultTab] = useState('scorecard'); // 'scorecard' | 'schedule' | 'organic' | 'plan'
  const [history, setHistory] = useState([]);

  // ── Fetch test history on mount ────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/soil/history');
      setHistory(data.data.trend || []);
    } catch { /* silent */ }
  }, []);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── pH color helper ────────────────────────────────────────────
  const getPhColor = () => {
    if (ph >= 6.0 && ph <= 7.5) return 'bg-leaf';
    if (ph >= 5.5 && ph <= 8.0) return 'bg-caution';
    return 'bg-danger';
  };

  // ── Nutrient category from numeric value ───────────────────────
  const getNutrientCategory = (val, key) => {
    const thresholds = {
      nitrogen: { low: 280, high: 560 },
      phosphorus: { low: 10, high: 25 },
      potassium: { low: 110, high: 280 },
    };
    const t2 = thresholds[key];
    if (!t2) return 'medium';
    if (val < t2.low) return 'low';
    if (val <= t2.high) return 'medium';
    return 'high';
  };

  const getCategoryColor = (cat) => {
    return cat === 'high' ? 'text-forest bg-leaf/10 border-leaf' :
           cat === 'medium' ? 'text-yellow-800 bg-caution/10 border-caution' :
           'text-danger bg-danger/10 border-danger';
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!crop) { toast.error('Please select a crop'); return; }
    setLoading(true);
    try {
      const body = { soilType, ph, moisture, crop, inputMode };
      if (inputMode === 'advanced') {
        body.nitrogenValue = nitrogenValue;
        body.phosphorusValue = phosphorusValue;
        body.potassiumValue = potassiumValue;
        body.organicCarbon = organicCarbon;
        body.ec = ec;
        if (showMicro) {
          body.zinc = zinc;
          body.iron = iron;
          body.boron = boron;
          body.manganese = manganese;
        }
      } else {
        body.nitrogen = nitrogen;
        body.phosphorus = phosphorus;
        body.potassium = potassium;
      }
      const { data } = await api.post('/soil/test', body);
      setResult(data.data);
      fetchHistory();
      toast.success('Soil analysis complete! 🌱');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // ── SVG Gauge ──────────────────────────────────────────────────
  const SoilGauge = ({ score }) => {
    const radius = 70;
    const circumference = Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const getColor = () => {
      if (score <= 30) return '#E63946';
      if (score <= 60) return '#FFB703';
      if (score <= 80) return '#52B788';
      return '#1B4332';
    };
    const getLabel = () => {
      if (score <= 30) return 'Poor';
      if (score <= 60) return 'Fair';
      if (score <= 80) return 'Good';
      return 'Excellent';
    };
    return (
      <div className="flex flex-col items-center">
        <svg width="200" height="120" viewBox="0 0 200 120">
          <path d="M 15 110 A 80 80 0 0 1 185 110" fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />
          <path d="M 15 110 A 80 80 0 0 1 185 110" fill="none" stroke={getColor()} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} className="gauge-arc" />
          <text x="100" y="90" textAnchor="middle" className="text-3xl font-bold" fill={getColor()}>{score}</text>
          <text x="100" y="112" textAnchor="middle" className="text-xs font-semibold" fill="#9ca3af">{getLabel()}</text>
        </svg>
      </div>
    );
  };

  // ── Step Progress Bar ──────────────────────────────────────────
  const StepProgress = () => (
    <div className="flex items-center gap-1 mb-5">
      {[
        { num: 1, label: t.soil.soilBasics },
        { num: 2, label: t.soil.nutrients },
        { num: 3, label: t.soil.microCrop },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${step >= s.num ? 'bg-forest text-white' : 'bg-gray-200 text-gray-400'}`}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? 'text-forest' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < 2 && <div className={`h-0.5 flex-1 mx-2 rounded ${step > s.num ? 'bg-forest' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  // ── Nutrient Selector (Quick Mode) ─────────────────────────────
  const NutrientSelector = ({ label, value, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {['low', 'medium', 'high'].map((level) => (
          <button key={level} type="button" onClick={() => onChange(level)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
              ${value === level
                ? level === 'low' ? 'bg-danger/10 border-danger text-danger'
                  : level === 'medium' ? 'bg-caution/10 border-caution text-yellow-800'
                  : 'bg-leaf/10 border-leaf text-forest'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {t.soil[level]}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Numeric Slider with Category Indicator ─────────────────────
  const NumericSlider = ({ label, value, onChange, min, max, step: s, unit, nutrientKey }) => {
    const cat = getNutrientCategory(value, nutrientKey);
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-ink">{value}</span>
            <span className="text-xs text-gray-400">{unit}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getCategoryColor(cat)}`}>
              {t.soil[cat]}
            </span>
          </div>
        </div>
        <input type="range" min={min} max={max} step={s} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-danger via-caution to-leaf rounded-lg appearance-none cursor-pointer" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{min} ({t.soil.low})</span>
          <span>{max} ({t.soil.high})</span>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-ink mb-2">🌱 {t.soil.title}</h1>

      {!result ? (
        <>
          {/* ── Mode Toggle ───────────────────────────────────────── */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
            {[
              { key: 'quick', label: `⚡ ${t.soil.quickMode}` },
              { key: 'advanced', label: `📋 ${t.soil.advancedMode}` },
            ].map((m) => (
              <button key={m.key} onClick={() => { setInputMode(m.key); setStep(1); }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                  ${inputMode === m.key ? 'bg-white text-forest shadow-sm' : 'text-gray-500 hover:text-forest'}`}>
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {inputMode === 'advanced' && <StepProgress />}

            {/* ── STEP 1: Soil Basics ─────────────────────────────── */}
            {(inputMode === 'quick' || step === 1) && (
              <div className="space-y-4 animate-fade-in">
                {/* Soil Type */}
                <Card>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t.soil.soilType}</label>
                  <div className="flex flex-wrap gap-2">
                    {SOIL_TYPES.map((s) => (
                      <button key={s.key} type="button" onClick={() => setSoilType(s.key)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-1.5
                          ${soilType === s.key ? 'bg-soil/10 border-soil text-soil shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <span>{s.icon}</span> {s.label}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* pH Slider */}
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{t.soil.ph}</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getPhColor()}`}>{ph.toFixed(1)}</span>
                  </div>
                  <input type="range" min="4" max="9" step="0.1" value={ph} onChange={(e) => setPh(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-danger via-caution to-leaf rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>4.0 (Acidic)</span><span>6.5-7.5 (Optimal)</span><span>9.0 (Alkaline)</span>
                  </div>
                </Card>

                {/* OC & EC (Advanced only) */}
                {inputMode === 'advanced' && (
                  <Card className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">{t.soil.organicCarbon}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-ink">{organicCarbon.toFixed(2)}</span>
                          <span className="text-xs text-gray-400">%</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border
                            ${organicCarbon >= 0.75 ? 'text-forest bg-leaf/10 border-leaf' :
                              organicCarbon >= 0.5 ? 'text-yellow-800 bg-caution/10 border-caution' :
                              'text-danger bg-danger/10 border-danger'}`}>
                            {organicCarbon >= 0.75 ? t.soil.high : organicCarbon >= 0.5 ? t.soil.medium : t.soil.low}
                          </span>
                        </div>
                      </div>
                      <input type="range" min="0.1" max="2.5" step="0.05" value={organicCarbon}
                        onChange={(e) => setOrganicCarbon(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gradient-to-r from-danger via-caution to-leaf rounded-lg appearance-none cursor-pointer" />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0.1% (Low)</span><span>0.75%+ (High)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">{t.soil.ec}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-ink">{ec.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">dS/m</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border
                            ${ec <= 1.0 ? 'text-forest bg-leaf/10 border-leaf' :
                              ec <= 2.0 ? 'text-yellow-800 bg-caution/10 border-caution' :
                              'text-danger bg-danger/10 border-danger'}`}>
                            {ec <= 1.0 ? 'Normal' : ec <= 2.0 ? 'Moderate' : 'Saline'}
                          </span>
                        </div>
                      </div>
                      <input type="range" min="0" max="4" step="0.1" value={ec}
                        onChange={(e) => setEc(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gradient-to-r from-leaf via-caution to-danger rounded-lg appearance-none cursor-pointer" />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0 (Normal)</span><span>4.0 (Saline)</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ── STEP 2: NPK ─────────────────────────────────────── */}
            {(inputMode === 'quick' || step === 2) && (
              <div className="space-y-4 animate-fade-in">
                {inputMode === 'quick' ? (
                  <Card className="space-y-4">
                    <NutrientSelector label={t.soil.nitrogen} value={nitrogen} onChange={setNitrogen} />
                    <NutrientSelector label={t.soil.phosphorus} value={phosphorus} onChange={setPhosphorus} />
                    <NutrientSelector label={t.soil.potassium} value={potassium} onChange={setPotassium} />
                    <NutrientSelector label={t.soil.moisture} value={moisture} onChange={setMoisture} />
                  </Card>
                ) : (
                  <Card className="space-y-6">
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                      💡 Enter values from your Soil Health Card
                    </p>
                    <NumericSlider label={t.soil.nitrogen} value={nitrogenValue} onChange={setNitrogenValue}
                      min={50} max={600} step={5} unit="kg/ha" nutrientKey="nitrogen" />
                    <NumericSlider label={t.soil.phosphorus} value={phosphorusValue} onChange={setPhosphorusValue}
                      min={2} max={80} step={1} unit="kg/ha" nutrientKey="phosphorus" />
                    <NumericSlider label={t.soil.potassium} value={potassiumValue} onChange={setPotassiumValue}
                      min={50} max={600} step={5} unit="kg/ha" nutrientKey="potassium" />
                    <NutrientSelector label={t.soil.moisture} value={moisture} onChange={setMoisture} />
                  </Card>
                )}
              </div>
            )}

            {/* ── STEP 3: Micronutrients & Crop ───────────────────── */}
            {(inputMode === 'quick' || step === 3) && (
              <div className="space-y-4 animate-fade-in">
                {/* Micronutrients (Advanced only) */}
                {inputMode === 'advanced' && (
                  <Card>
                    {!showMicro ? (
                      <div className="text-center py-3">
                        <button type="button" onClick={() => setShowMicro(true)}
                          className="text-forest font-medium text-sm hover:underline">
                          ➕ Add Micronutrient Values (Zn, Fe, B, Mn)
                        </button>
                        <p className="text-xs text-gray-400 mt-1">{t.soil.skipMicro}</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-ink">Micronutrients</h4>
                          <button type="button" onClick={() => { setShowMicro(false); setZinc(null); setIron(null); setBoron(null); setManganese(null); }}
                            className="text-xs text-gray-400 hover:text-danger">✕ Remove</button>
                        </div>
                        {[
                          { label: t.soil.zinc, val: zinc ?? 0.8, set: (v) => setZinc(v), min: 0, max: 5, step: 0.1 },
                          { label: t.soil.iron, val: iron ?? 5, set: (v) => setIron(v), min: 0, max: 20, step: 0.5 },
                          { label: t.soil.boron, val: boron ?? 0.6, set: (v) => setBoron(v), min: 0, max: 3, step: 0.1 },
                          { label: t.soil.manganese, val: manganese ?? 3, set: (v) => setManganese(v), min: 0, max: 10, step: 0.5 },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-700">{m.label}</span>
                              <span className="text-sm font-bold text-ink">{m.val} ppm</span>
                            </div>
                            <input type="range" min={m.min} max={m.max} step={m.step} value={m.val}
                              onChange={(e) => m.set(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* Crop Selector */}
                <Card>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t.soil.selectCrop}</label>
                  <div className="flex flex-wrap gap-2">
                    {CROPS.map((c) => (
                      <button key={c} type="button" onClick={() => setCrop(c)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-1.5
                          ${crop === c ? 'bg-leaf/10 text-forest border-leaf shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-leaf'}`}>
                        <span>{CROP_ICONS[c] || '🌿'}</span> {c}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── Navigation Buttons ──────────────────────────────── */}
            {inputMode === 'advanced' ? (
              <div className="flex gap-3 mt-5">
                {step > 1 && (
                  <Button type="button" variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
                    ← {t.soil.prevStep}
                  </Button>
                )}
                {step < 3 ? (
                  <Button type="button" onClick={() => setStep(step + 1)} className="flex-1">
                    {t.soil.nextStep} →
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1" loading={loading}>
                    🧪 {t.soil.analyze}
                  </Button>
                )}
              </div>
            ) : (
              <Button type="submit" className="w-full mt-5" size="lg" loading={loading}>
                🧪 {t.soil.analyze}
              </Button>
            )}
          </form>

          {/* ── Past Test History ──────────────────────────────────── */}
          {history.length > 1 && (
            <Card className="mt-6">
              <h3 className="text-sm font-bold text-ink mb-3">📊 {t.soil.testHistory}</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={history}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}/100`, 'Score']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="score" stroke="#2D6A4F" strokeWidth={2.5} dot={{ r: 4, fill: '#2D6A4F' }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {history.map((h, i) => (
                  <div key={i} className="flex-shrink-0 text-center px-2">
                    <div className={`text-lg font-bold ${h.score >= 70 ? 'text-forest' : h.score >= 40 ? 'text-yellow-600' : 'text-danger'}`}>
                      {h.score}
                    </div>
                    <div className="text-xs text-gray-400">{h.crop}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════════
           RESULTS DASHBOARD
           ═══════════════════════════════════════════════════════════ */
        <div className="space-y-4 animate-slide-up">
          {/* ── Result Tab Navigation ─────────────────────────────── */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {[
              { key: 'scorecard', label: '📊 Score' },
              { key: 'deficiencies', label: '🚨 Alerts' },
              { key: 'schedule', label: '📅 Schedule' },
              { key: 'organic', label: '🌿 Organic' },
              { key: 'plan', label: '📋 Plan' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setResultTab(tab.key)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                  ${resultTab === tab.key ? 'bg-white text-forest shadow-sm' : 'text-gray-500'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── SCORECARD TAB ──────────────────────────────────────── */}
          {resultTab === 'scorecard' && (
            <>
              {/* Health Score Gauge */}
              <Card className="text-center">
                <h2 className="text-lg font-bold text-ink mb-1">{t.soil.healthScore}</h2>
                <SoilGauge score={result.healthScore} />
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {[
                    { label: 'N', val: result.soilTest?.nitrogen },
                    { label: 'P', val: result.soilTest?.phosphorus },
                    { label: 'K', val: result.soilTest?.potassium },
                    { label: 'Moisture', val: result.soilTest?.moisture },
                  ].map((n) => (
                    <Badge key={n.label} variant={n.val === 'high' ? 'leaf' : n.val === 'medium' ? 'caution' : 'danger'}>
                      {n.label}: {n.val}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Radar Chart */}
              {result.radarData && result.radarData.length > 0 && (
                <Card>
                  <h3 className="text-sm font-bold text-ink mb-2">🕸️ Nutrient Profile</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={result.radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="param" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="score" stroke="#2D6A4F" fill="#52B788" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Fertilizer Totals */}
              {result.fertilizer && (
                <Card>
                  <h3 className="text-lg font-bold text-ink mb-3">🧪 {t.soil.fertilizer}</h3>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    {['N', 'P', 'K'].map((key) => (
                      <div key={key} className="text-center p-3 bg-forest/5 rounded-xl">
                        <p className="text-2xl font-bold text-forest">{result.fertilizer[key]}</p>
                        <p className="text-xs text-gray-500">kg/acre {key}</p>
                      </div>
                    ))}
                  </div>
                  {result.fertilizer.note && <p className="text-xs text-gray-500 text-center">{result.fertilizer.note}</p>}
                </Card>
              )}

              {/* pH Correction */}
              {result.phCorrection && (
                <Card>
                  <h3 className="text-lg font-bold text-ink mb-2">⚗️ {t.soil.phCorrection}</h3>
                  <p className="text-sm text-gray-600">{result.phCorrection.reason}</p>
                  <div className="mt-2 p-3 bg-caution/10 rounded-xl">
                    <p className="font-semibold text-ink">{result.phCorrection.material}: {result.phCorrection.qty}</p>
                    {result.phCorrection.alt && <p className="text-sm text-gray-500 mt-1">Alt: {result.phCorrection.alt}</p>}
                  </div>
                </Card>
              )}

              {/* Rotation */}
              {result.rotation && (
                <Card>
                  <h3 className="text-lg font-bold text-ink mb-2">🔄 {t.soil.rotation}</h3>
                  <p className="text-sm text-gray-600 mb-2">{result.rotation.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.rotation.suggestions.map((s) => (
                      <Badge key={s} variant="leaf">{CROP_ICONS[s] || '🌿'} {s}</Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* AI Analysis */}
              {result.aiExplanation && (
                <Card>
                  <h3 className="text-lg font-bold text-ink mb-2">🤖 AI Analysis</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.aiExplanation}</p>
                </Card>
              )}
            </>
          )}

          {/* ── DEFICIENCIES TAB ───────────────────────────────────── */}
          {resultTab === 'deficiencies' && (
            <>
              {result.deficiencies && result.deficiencies.length > 0 ? (
                <div className="space-y-3">
                  {result.deficiencies.map((d, i) => (
                    <Card key={i} className="border-l-4 border-danger">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-ink text-sm flex items-center gap-1">
                          ⚠️ {d.nutrient}
                        </h4>
                        <Badge variant={d.severity === 'critical' ? 'danger' : d.severity === 'high' ? 'danger' : 'caution'}>
                          {d.severity}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-danger mb-1">{t.soil.symptoms}</p>
                          <p className="text-sm text-gray-700">{d.symptoms}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">{t.soil.yieldImpact}</p>
                          <p className="text-sm text-gray-700">{d.yieldImpact}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-1">💊 {t.soil.chemicalFix}</p>
                            <p className="text-sm text-gray-700">{d.chemicalFix}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-forest mb-1">🌿 {t.soil.organicFix}</p>
                            <p className="text-sm text-gray-700">{d.organicFix}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-8">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-lg font-semibold text-forest">No Deficiencies Detected!</p>
                  <p className="text-sm text-gray-400 mt-1">All nutrients are at adequate levels</p>
                </Card>
              )}
            </>
          )}

          {/* ── SCHEDULE TAB ───────────────────────────────────────── */}
          {resultTab === 'schedule' && result.fertilizerSchedule && (
            <div className="space-y-3">
              <Card className="bg-forest/5 border-2 border-forest/20">
                <h3 className="font-bold text-ink text-base mb-1">📅 {t.soil.schedule}</h3>
                <p className="text-xs text-gray-500">{result.fertilizer?.note}</p>
              </Card>

              {result.fertilizerSchedule.map((phase, i) => (
                <Card key={i} className="relative">
                  {/* Timeline dot */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold
                        ${i === 0 ? 'bg-gradient-to-br from-forest to-leaf' :
                          i === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                          'bg-gradient-to-br from-amber to-orange-500'}`}>
                        {i + 1}
                      </div>
                      {i < result.fertilizerSchedule.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-ink text-sm">{phase.phase}</h4>
                      <p className="text-xs text-gray-400 mb-2">{phase.timing}</p>

                      {/* NPK doses */}
                      <div className="flex gap-2 mb-2">
                        {phase.doses.N > 0 && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                            N: {phase.doses.N} kg
                          </span>
                        )}
                        {phase.doses.P > 0 && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold">
                            P: {phase.doses.P} kg
                          </span>
                        )}
                        {phase.doses.K > 0 && (
                          <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold">
                            K: {phase.doses.K} kg
                          </span>
                        )}
                      </div>

                      {/* Products */}
                      <div className="text-xs text-gray-600">
                        {phase.products.map((p, j) => (
                          <p key={j} className="mb-0.5">• {p}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ── ORGANIC TAB ────────────────────────────────────────── */}
          {resultTab === 'organic' && result.organicOptions && (
            <div className="space-y-3">
              {result.organicOptions.map((opt, i) => (
                <Card key={i} className={`${opt.priority === 'high' ? 'border-l-4 border-forest' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-ink text-sm">{opt.name}</h4>
                        {opt.priority === 'high' && <Badge variant="leaf">Recommended</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opt.benefit}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">📦 {opt.qty}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">🗓️ {opt.when}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ── PLAN TAB ───────────────────────────────────────────── */}
          {resultTab === 'plan' && result.improvementPlan && (
            <div className="space-y-3">
              <Card className="bg-gradient-to-r from-forest/5 to-leaf/5 border-2 border-forest/20">
                <h3 className="font-bold text-ink text-base">📋 {t.soil.improvementPlan}</h3>
                <p className="text-xs text-gray-500 mt-1">Follow these steps this season to improve your soil health</p>
              </Card>

              {result.improvementPlan.map((action, i) => (
                <Card key={i}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-lg flex-shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-ink text-sm">{action.title}</h4>
                        <Badge variant={action.priority === 'high' ? 'danger' : action.priority === 'medium' ? 'caution' : 'default'}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-ink">{action.action}</p>
                        <p className="text-xs text-gray-400 mt-1">🗓️ {action.when}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ── New Test Button ────────────────────────────────────── */}
          <Button variant="secondary" onClick={() => { setResult(null); setStep(1); setResultTab('scorecard'); }} className="w-full mt-2">
            🔄 {t.soil.newTest}
          </Button>
        </div>
      )}
    </div>
  );
}
