'use client';
import { useState, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CROPS = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Tomato', 'Onion', 'Potato', 'Mustard', 'Chickpea', 'Groundnut', 'Sugarcane', 'Bajra', 'Jowar',
  'Apple', 'Grape', 'Orange', 'Mango', 'Banana', 'Pepper', 'Strawberry', 'Cherry', 'Peach', 'Corn', 'Blueberry', 'Raspberry', 'Squash', 'Cucumber', 'Eggplant', 'Cabbage'];

export default function ScanPage() {
  const { farmer } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cropType, setCropType] = useState('');
  const [cropSearch, setCropSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('treatment');
  const [history, setHistory] = useState([]);

  const filteredCrops = CROPS.filter((c) => c.toLowerCase().includes(cropSearch.toLowerCase()));

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!image) { toast.error('Please select an image'); return; }
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('cropType', cropType || 'Unknown');
      const { data } = await api.post('/pest/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data.detection);
      toast.success('Scan complete! 🔍');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const severityColors = { low: 'leaf', medium: 'caution', high: 'amber', critical: 'danger' };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-ink mb-6">📷 {t.scan.title}</h1>

      {!result ? (
        <>
          {/* Image Upload */}
          <Card className="mb-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-forest transition-colors"
            >
              {preview ? (
                <img src={preview} alt="Selected crop" className="max-h-64 mx-auto rounded-lg object-cover" />
              ) : (
                <>
                  <span className="text-5xl block mb-3">📸</span>
                  <p className="text-gray-600 font-medium">{t.scan.uploadImage}</p>
                  <p className="text-gray-400 text-sm mt-1">JPEG, PNG or WebP · Max 5MB</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
          </Card>

          {/* Crop Type Selector */}
          <Card className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.scan.selectCrop}</label>
            <input
              type="text"
              placeholder="Search crops..."
              value={cropSearch}
              onChange={(e) => setCropSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-forest focus:outline-none text-sm mb-2"
            />
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {filteredCrops.map((c) => (
                <button
                  key={c} onClick={() => { setCropType(c); setCropSearch(''); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                    ${cropType === c ? 'bg-forest text-white border-forest' : 'bg-white text-gray-600 border-gray-200 hover:border-forest'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>

          {/* Scan Button */}
          <Button onClick={handleScan} className="w-full" size="lg" loading={scanning} disabled={!image}>
            {scanning ? t.scan.scanning : '🔍 Scan for Diseases'}
          </Button>
        </>
      ) : (
        /* Results */
        <Card className="animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-ink">{result.disease}</h2>
              <p className="text-sm text-gray-500 mt-1">{cropType || 'Unknown crop'}</p>
            </div>
            <Badge variant={severityColors[result.severity] || 'default'}>{result.severity}</Badge>
          </div>

          {/* Confidence Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Confidence</span>
              <span className="font-semibold text-forest">{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-forest to-leaf rounded-full transition-all duration-1000"
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>

          {result.geminiVerified && (
            <Badge variant="forest" className="mb-4">✓ AI Verified</Badge>
          )}

          {/* Treatment Tabs */}
          <div className="flex gap-2 mb-4">
            {['treatment', 'organic', 'chemical'].map((tab) => (
              <button
                key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${activeTab === tab ? 'bg-forest text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t.scan[tab]}
              </button>
            ))}
          </div>

          <div className="space-y-2 min-h-[100px]">
            {(result[activeTab] || []).length > 0 ? (
              result[activeTab].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-forest text-sm font-bold">{i + 1}.</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No recommendations available</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Link href={`/chat`} className="flex-1">
              <Button variant="primary" className="w-full">{t.scan.askAi}</Button>
            </Link>
            <Button variant="secondary" onClick={() => { setResult(null); setPreview(null); setImage(null); }}>
              New Scan
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
