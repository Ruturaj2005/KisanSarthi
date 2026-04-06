'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getTranslation, LANGUAGES } from '../../lib/i18n';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { farmer, logout, setFarmer } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  const [name, setName] = useState(farmer?.name || '');
  const [landSize, setLandSize] = useState(farmer?.landSize || '');
  const [soilType, setSoilType] = useState(farmer?.soilType || '');
  const [irrigationSrc, setIrrigationSrc] = useState(farmer?.irrigationSrc || '');
  const [selectedCrops, setSelectedCrops] = useState(farmer?.primaryCrops || []);
  const [preferredLang, setPreferredLang] = useState(farmer?.preferredLang || 'hi');
  const [loading, setLoading] = useState(false);

  const crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Tomato', 'Onion', 'Potato', 'Mustard', 'Chickpea', 'Groundnut', 'Sugarcane', 'Bajra', 'Jowar'];

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/farmer/profile', {
        name, landSize: landSize ? parseFloat(landSize) : undefined,
        soilType, irrigationSrc, primaryCrops: selectedCrops, preferredLang,
      });
      setFarmer(data.data.farmer, localStorage.getItem('accessToken'));
      toast.success('Profile saved! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleCrop = (crop) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop].slice(0, 10)
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest to-leaf flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {farmer?.name?.charAt(0)?.toUpperCase() || 'F'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.profile.title}</h1>
          <p className="text-sm text-gray-500">{farmer?.email}</p>
          {farmer?.role === 'admin' && <Badge variant="amber" className="mt-1">Admin</Badge>}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <Input label={t.auth.name} value={name} onChange={(e) => setName(e.target.value)} />
        </Card>

        <Card>
          <Input label={t.profile.landSize} type="number" value={landSize} onChange={(e) => setLandSize(e.target.value)} placeholder="e.g. 5" />
        </Card>

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.soilType}</label>
          <div className="flex flex-wrap gap-2">
            {['loamy', 'sandy', 'clay', 'silt', 'alluvial'].map((s) => (
              <button key={s} onClick={() => setSoilType(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all
                  ${soilType === s ? 'bg-soil/10 border-soil text-soil' : 'bg-white border-gray-200 text-gray-500'}`}>
                {s}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.irrigation}</label>
          <div className="flex flex-wrap gap-2">
            {['rain', 'canal', 'borewell', 'drip', 'none'].map((i) => (
              <button key={i} onClick={() => setIrrigationSrc(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all
                  ${irrigationSrc === i ? 'bg-forest/10 border-forest text-forest' : 'bg-white border-gray-200 text-gray-500'}`}>
                {i}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.crops}</label>
          <div className="flex flex-wrap gap-2">
            {crops.map((c) => (
              <button key={c} onClick={() => toggleCrop(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                  ${selectedCrops.includes(c) ? 'bg-leaf text-white border-leaf' : 'bg-white text-gray-600 border-gray-200'}`}>
                {c}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.language}</label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.code} onClick={() => setPreferredLang(l.code)}
                className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all text-center
                  ${preferredLang === l.code ? 'bg-forest/10 border-forest text-forest' : 'bg-white border-gray-200 text-gray-600'}`}>
                <span className="text-lg block">{l.flag}</span>
                <span className="text-xs">{l.name}</span>
              </button>
            ))}
          </div>
        </Card>

        <Button onClick={handleSave} className="w-full" size="lg" loading={loading}>
          {t.profile.save}
        </Button>

        <Button onClick={handleLogout} variant="danger" className="w-full" size="lg">
          {t.profile.logout}
        </Button>
      </div>
    </div>
  );
}
