'use client';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const STATES = ['Maharashtra', 'Punjab', 'UP', 'MP', 'Rajasthan', 'AP', 'Karnataka', 'Gujarat'];
const COMMODITIES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Onion', 'Tomato', 'Potato', 'Mustard', 'Chickpea', 'Groundnut'];

export default function MarketPage() {
  const { farmer } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  const [state, setState] = useState(farmer?.location?.state || '');
  const [commodity, setCommodity] = useState('');
  const [prices, setPrices] = useState([]);
  const [trend, setTrend] = useState([]);
  const [trendMsp, setTrendMsp] = useState(null);
  const [selectedMandi, setSelectedMandi] = useState('');
  const [trendDays, setTrendDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (state) params.state = state;
      if (commodity) params.commodity = commodity;
      const { data } = await api.get('/market/prices', { params });
      setPrices(data.data.prices || []);
    } catch {
      toast.error('Failed to load market prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, [state, commodity]);

  const fetchTrend = async (mandi) => {
    if (!commodity || !mandi) return;
    setSelectedMandi(mandi);
    try {
      const { data } = await api.get('/market/trend', { params: { commodity, mandi, days: trendDays } });
      setTrend(data.data.trend || []);
      setTrendMsp(data.data.msp);
    } catch {
      toast.error('Failed to load price trend');
    }
  };

  const trendData = trend.map((t) => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    price: t.modalPrice,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-ink mb-6">📊 {t.market.title}</h1>

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.market.selectState}</label>
            <select value={state} onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none text-sm">
              <option value="">All States</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.market.selectCommodity}</label>
            <select value={commodity} onChange={(e) => setCommodity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none text-sm">
              <option value="">All Commodities</option>
              {COMMODITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Price Table */}
      <Card className="mb-4 overflow-hidden">
        {loading ? (
          <PageLoader message="Loading prices..." />
        ) : prices.length === 0 ? (
          <p className="text-gray-400 text-center py-8">{t.common.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">{t.market.mandi}</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Min</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">{t.market.modalPrice}</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Max</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">{t.market.msp}</th>
                  <th className="text-center py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {prices.slice(0, 20).map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-ink">{p.commodity}</div>
                      <div className="text-xs text-gray-400">{p.mandi}</div>
                    </td>
                    <td className="text-right py-2.5 px-2 text-gray-500">₹{p.minPrice}</td>
                    <td className="text-right py-2.5 px-2 font-bold text-ink">₹{p.modalPrice}</td>
                    <td className="text-right py-2.5 px-2 text-gray-500">₹{p.maxPrice}</td>
                    <td className="text-right py-2.5 px-2">
                      {p.msp ? (
                        <Badge variant={p.aboveMsp ? 'leaf' : 'danger'}>
                          {p.aboveMsp ? '↑' : '↓'} ₹{p.msp}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <button onClick={() => fetchTrend(p.mandi)} className="text-forest text-xs hover:underline">
                        📈 Trend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Price Trend Chart */}
      {trendData.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-lg font-bold text-ink mb-2">{commodity} — {selectedMandi}</h3>
          <div className="flex gap-2 mb-4">
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => { setTrendDays(d); fetchTrend(selectedMandi); }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all
                  ${trendDays === d ? 'bg-forest text-white' : 'bg-gray-100 text-gray-600'}`}>
                {d}D
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`₹${v}/q`, 'Price']} />
              <Line type="monotone" dataKey="price" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 3 }} />
              {trendMsp && (
                <ReferenceLine y={trendMsp} stroke="#F4A261" strokeDasharray="5 5" label={{ value: `MSP ₹${trendMsp}`, position: 'top', fill: '#F4A261', fontSize: 11 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
