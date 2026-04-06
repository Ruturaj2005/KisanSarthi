'use client';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Tomato', 'Onion', 'Potato', 'Mustard', 'Chickpea', 'Groundnut', 'Sugarcane', 'Bajra', 'Jowar'];

export default function SoilPage() {
  const { farmer } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  const [soilType, setSoilType] = useState(farmer?.soilType || '');
  const [ph, setPh] = useState(6.5);
  const [nitrogen, setNitrogen] = useState('medium');
  const [phosphorus, setPhosphorus] = useState('medium');
  const [potassium, setPotassium] = useState('medium');
  const [moisture, setMoisture] = useState('medium');
  const [crop, setCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const getPhColor = () => {
    if (ph >= 6.0 && ph <= 7.5) return 'bg-leaf';
    if (ph >= 5.5 && ph <= 8.0) return 'bg-caution';
    return 'bg-danger';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/soil/test', { soilType, ph, nitrogen, phosphorus, potassium, moisture, crop });
      setResult(data.data);
      toast.success('Soil analysis complete! 🌱');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const NutrientSelector = ({ label, value, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {['low', 'medium', 'high'].map((level) => (
          <button
            key={level} type="button" onClick={() => onChange(level)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
              ${value === level
                ? level === 'low' ? 'bg-danger/10 border-danger text-danger'
                  : level === 'medium' ? 'bg-caution/10 border-caution text-yellow-800'
                  : 'bg-leaf/10 border-leaf text-forest'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
          >
            {t.soil[level]}
          </button>
        ))}
      </div>
    </div>
  );

  // SVG Gauge Component
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

    return (
      <div className="flex flex-col items-center">
        <svg width="180" height="110" viewBox="0 0 180 110">
          <path d="M 10 100 A 70 70 0 0 1 170 100" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 100 A 70 70 0 0 1 170 100" fill="none" stroke={getColor()} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} className="gauge-arc" />
          <text x="90" y="85" textAnchor="middle" className="text-3xl font-bold" fill={getColor()}>{score}</text>
          <text x="90" y="102" textAnchor="middle" className="text-xs" fill="#9ca3af">/100</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-ink mb-6">🌱 {t.soil.title}</h1>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Soil Type */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.soil.soilType}</label>
            <div className="flex flex-wrap gap-2">
              {['loamy', 'sandy', 'clay', 'silt', 'alluvial'].map((s) => (
                <button key={s} type="button" onClick={() => setSoilType(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all
                    ${soilType === s ? 'bg-soil/10 border-soil text-soil' : 'bg-white border-gray-200 text-gray-500'}`}>
                  {s}
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
              <span>4.0 (Acidic)</span>
              <span>6.5-7.5 (Optimal)</span>
              <span>9.0 (Alkaline)</span>
            </div>
          </Card>

          {/* NPK + Moisture */}
          <Card className="space-y-4">
            <NutrientSelector label={t.soil.nitrogen} value={nitrogen} onChange={setNitrogen} />
            <NutrientSelector label={t.soil.phosphorus} value={phosphorus} onChange={setPhosphorus} />
            <NutrientSelector label={t.soil.potassium} value={potassium} onChange={setPotassium} />
            <NutrientSelector label={t.soil.moisture} value={moisture} onChange={setMoisture} />
          </Card>

          {/* Crop Selector */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.soil.selectCrop}</label>
            <div className="flex flex-wrap gap-2">
              {CROPS.map((c) => (
                <button key={c} type="button" onClick={() => setCrop(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                    ${crop === c ? 'bg-leaf text-white border-leaf' : 'bg-white text-gray-600 border-gray-200 hover:border-leaf'}`}>
                  {c}
                </button>
              ))}
            </div>
          </Card>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            🧪 {t.soil.analyze}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 animate-slide-up">
          {/* Health Score Gauge */}
          <Card className="text-center">
            <h2 className="text-lg font-bold text-ink mb-2">{t.soil.healthScore}</h2>
            <SoilGauge score={result.healthScore} />
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              {[{ label: 'N', val: nitrogen }, { label: 'P', val: phosphorus }, { label: 'K', val: potassium }, { label: 'Moisture', val: moisture }].map((n) => (
                <Badge key={n.label} variant={n.val === 'high' ? 'leaf' : n.val === 'medium' ? 'caution' : 'danger'}>
                  {n.label}: {n.val}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Fertilizer Recommendation */}
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
              {result.fertilizer.note && (
                <p className="text-xs text-gray-500 text-center">{result.fertilizer.note}</p>
              )}
            </Card>
          )}

          {/* pH Correction */}
          {result.phCorrection && (
            <Card>
              <h3 className="text-lg font-bold text-ink mb-2">⚗️ {t.soil.phCorrection}</h3>
              <p className="text-sm text-gray-600">{result.phCorrection.reason}</p>
              <div className="mt-2 p-3 bg-caution/10 rounded-lg">
                <p className="font-medium text-ink">{result.phCorrection.material}: {result.phCorrection.qty}</p>
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
                  <Badge key={s} variant="leaf">{s}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* AI Explanation */}
          {result.aiExplanation && (
            <Card>
              <h3 className="text-lg font-bold text-ink mb-2">🤖 AI Analysis</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{result.aiExplanation}</p>
            </Card>
          )}

          <Button variant="secondary" onClick={() => setResult(null)} className="w-full">
            New Test
          </Button>
        </div>
      )}
    </div>
  );
}
