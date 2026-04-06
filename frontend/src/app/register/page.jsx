'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, verifyOtp } = useAuthStore();
  const [step, setStep] = useState(1); // 1: register, 2: verify OTP, 3: complete profile
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [otp, setOtp] = useState('');

  // Step 3
  const [landSize, setLandSize] = useState('');
  const [soilType, setSoilType] = useState('');
  const [irrigationSrc, setIrrigationSrc] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedCrops, setSelectedCrops] = useState([]);

  const crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Tomato', 'Onion', 'Potato', 'Mustard', 'Chickpea', 'Groundnut', 'Sugarcane', 'Bajra', 'Jowar'];
  const soilTypes = ['loamy', 'sandy', 'clay', 'silt', 'alluvial'];
  const irrigationTypes = ['rain', 'canal', 'borewell', 'drip', 'none'];
  const states = ['Maharashtra', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Andhra Pradesh', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Telangana'];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password });
      toast.success('OTP sent to your email! 📧');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp({ email, otp });
      toast.success('Email verified! ✅');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/complete-profile', {
        landSize: landSize ? parseFloat(landSize) : undefined,
        soilType: soilType || undefined,
        irrigationSrc: irrigationSrc || undefined,
        primaryCrops: selectedCrops,
        location: { state, district },
      });
      toast.success('Profile complete! Welcome to KisanSaathi 🌾');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleCrop = (crop) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop].slice(0, 10)
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-forest-dark via-forest to-leaf">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-2xl font-bold text-white">KisanSaathi</h1>
          <p className="text-leaf-light text-sm mt-1">किसान का साथी</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step >= s ? 'bg-amber text-white' : 'bg-white/20 text-white/60'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-amber' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Step 1: Register */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-ink mb-4 text-center">Create Account</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <Input label="Full Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required icon={<span>👤</span>} />
                <Input label="Email" type="email" placeholder="yourname@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required icon={<span>📧</span>} />
                <Input label="Password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} icon={<span>🔒</span>} />
                <Button type="submit" className="w-full" size="lg" loading={loading}>Register</Button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-500">
                Already have an account? <Link href="/login" className="text-forest font-semibold hover:underline">Login</Link>
              </p>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-ink mb-2 text-center">Verify Email</h2>
              <p className="text-sm text-gray-500 text-center mb-4">Enter the 6-digit OTP sent to <strong>{email}</strong></p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  label="OTP Code"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-bold"
                  icon={<span>🔑</span>}
                />
                <Button type="submit" className="w-full" size="lg" loading={loading}>Verify OTP</Button>
              </form>
            </>
          )}

          {/* Step 3: Complete Profile */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-ink mb-4 text-center">Complete Your Profile</h2>
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none text-sm">
                      <option value="">Select State</option>
                      {states.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <Input label="District" placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>

                <Input label="Land Size (acres)" type="number" placeholder="e.g. 5" value={landSize} onChange={(e) => setLandSize(e.target.value)} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                  <div className="flex flex-wrap gap-2">
                    {soilTypes.map((s) => (
                      <button key={s} type="button" onClick={() => setSoilType(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                          ${soilType === s ? 'bg-forest text-white border-forest' : 'bg-white text-gray-600 border-gray-200 hover:border-forest'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Irrigation</label>
                  <div className="flex flex-wrap gap-2">
                    {irrigationTypes.map((i) => (
                      <button key={i} type="button" onClick={() => setIrrigationSrc(i)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                          ${irrigationSrc === i ? 'bg-forest text-white border-forest' : 'bg-white text-gray-600 border-gray-200 hover:border-forest'}`}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Crops (select up to 10)</label>
                  <div className="flex flex-wrap gap-2">
                    {crops.map((c) => (
                      <button key={c} type="button" onClick={() => toggleCrop(c)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                          ${selectedCrops.includes(c) ? 'bg-leaf text-white border-leaf' : 'bg-white text-gray-600 border-gray-200 hover:border-leaf'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>Complete Profile 🌾</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
