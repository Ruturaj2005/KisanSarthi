'use client';
import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../../store/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ── Commodity Icons ──────────────────────────────────────────────
const COMMODITY_ICONS = {
  Wheat: '🌾', Rice: '🍚', Maize: '🌽', Cotton: '🧵', Onion: '🧅',
  Tomato: '🍅', Potato: '🥔', Mustard: '🌼', Soyabean: '🫘', Soybean: '🫘',
  Groundnut: '🥜', Chickpea: '🫘', Apple: '🍎', Mango: '🥭', Banana: '🍌',
  Lemon: '🍋', Cabbage: '🥬', Cauliflower: '🥦', Brinjal: '🍆', Carrot: '🥕',
  Garlic: '🧄', Ginger: '🫚', Grapes: '🍇', Pomegranate: '🍎', Pumpkin: '🎃',
  Coconut: '🥥', Papaya: '🍈', Orange: '🍊', Capsicum: '🫑', Pineapple: '🍍',
  default: '📦',
};

function getCommodityIcon(name) {
  const key = Object.keys(COMMODITY_ICONS).find((k) => name?.toLowerCase().includes(k.toLowerCase()));
  return COMMODITY_ICONS[key] || COMMODITY_ICONS.default;
}

// ── Popular quick-filter chips ─────────────────────────────────────
const QUICK_COMMODITIES = ['Wheat', 'Rice', 'Onion', 'Tomato', 'Potato', 'Mustard', 'Cotton', 'Maize', 'Soyabean', 'Apple'];

export default function MarketPage() {
  const { farmer } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  // ── Filter state ─────────────────────────────────────────────────
  const [filterOptions, setFilterOptions] = useState({ states: [], districts: [], commodities: [] });
  const [state, setState] = useState(farmer?.location?.state || '');
  const [district, setDistrict] = useState('');
  const [commodity, setCommodity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Data state ───────────────────────────────────────────────────
  const [prices, setPrices] = useState([]);
  const [summary, setSummary] = useState([]);
  const [bestMandis, setBestMandis] = useState([]);
  const [trend, setTrend] = useState([]);
  const [trendMsp, setTrendMsp] = useState(null);
  const [selectedMandi, setSelectedMandi] = useState('');
  const [trendDays, setTrendDays] = useState(30);

  // ── UI state ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'table' | 'alerts'
  const [sortField, setSortField] = useState('modalPrice');
  const [sortDir, setSortDir] = useState('desc');

  // ── Fetch filter options ──────────────────────────────────────────
  const fetchFilters = useCallback(async () => {
    try {
      const params = {};
      if (state) params.state = state;
      if (district) params.district = district;
      const { data } = await api.get('/market/filters', { params });
      setFilterOptions(data.data);
    } catch {
      // silent
    }
  }, [state, district]);

  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  // ── Fetch prices ──────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (state) params.state = state;
      if (district) params.district = district;
      if (commodity) params.commodity = commodity;
      const { data } = await api.get('/market/prices', { params });
      setPrices(data.data.prices || []);
    } catch {
      toast.error('Failed to load market prices');
    } finally {
      setLoading(false);
    }
  }, [state, district, commodity]);

  // ── Fetch commodity summary ───────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const params = { limit: 30 };
      if (state) params.state = state;
      const { data } = await api.get('/market/summary', { params });
      setSummary(data.data.summary || []);
    } catch {
      // silent
    }
  }, [state]);

  // ── Fetch best mandis for selected commodity ──────────────────────
  const fetchBestMandis = useCallback(async () => {
    if (!commodity) { setBestMandis([]); return; }
    try {
      const params = { commodity, limit: 8 };
      if (state) params.state = state;
      const { data } = await api.get('/market/best-mandis', { params });
      setBestMandis(data.data.mandis || []);
    } catch {
      // silent
    }
  }, [commodity, state]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchBestMandis(); }, [fetchBestMandis]);

  // ── Fetch trend ───────────────────────────────────────────────────
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

  // ── Sorting ───────────────────────────────────────────────────────
  const sortedPrices = [...prices].sort((a, b) => {
    const multiplier = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'commodity') return multiplier * a.commodity.localeCompare(b.commodity);
    if (sortField === 'mandi') return multiplier * a.mandi.localeCompare(b.mandi);
    return multiplier * ((a[sortField] || 0) - (b[sortField] || 0));
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const trendData = trend.map((t) => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    price: t.modalPrice,
  }));

  // ── Filter commodities in summary by search ──────────────────────
  const filteredSummary = summary.filter((s) =>
    !searchQuery || s.commodity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Get max price for visual bar scaling in best-mandis ──────────
  const maxBestPrice = bestMandis.length > 0 ? Math.max(...bestMandis.map((m) => m.modalPrice)) : 1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          📊 {t.market.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {prices.length > 0 && `${prices.length} ${t.market.totalRecords}`}
          {prices.length > 0 && prices[0]?.date && ` • ${t.market.lastUpdated}: ${new Date(prices[0].date).toLocaleDateString('en-IN')}`}
        </p>
      </div>

      {/* ── Smart Filter Bar ────────────────────────────────────── */}
      <Card className="mb-5" id="market-filters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{t.market.selectState}</label>
            <select
              id="filter-state"
              value={state}
              onChange={(e) => { setState(e.target.value); setDistrict(''); setCommodity(''); }}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none text-sm bg-white transition-colors"
            >
              <option value="">{t.market.allStates}</option>
              {filterOptions.states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{t.market.selectDistrict}</label>
            <select
              id="filter-district"
              value={district}
              onChange={(e) => { setDistrict(e.target.value); }}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none text-sm bg-white transition-colors"
            >
              <option value="">{t.market.allDistricts}</option>
              {filterOptions.districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{t.market.selectCommodity}</label>
            <select
              id="filter-commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none text-sm bg-white transition-colors"
            >
              <option value="">{t.market.allCommodities}</option>
              {filterOptions.commodities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Quick commodity chips */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {QUICK_COMMODITIES.filter(c => filterOptions.commodities.includes(c) || filterOptions.commodities.length === 0).map((c) => (
            <button
              key={c}
              onClick={() => setCommodity(commodity === c ? '' : c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                ${commodity === c
                  ? 'bg-forest text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-forest/10 hover:text-forest'}`}
            >
              {getCommodityIcon(c)} {c}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Tab Navigation ──────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1" id="market-tabs">
        {[
          { key: 'overview', label: `📦 ${t.market.commodityOverview}` },
          { key: 'table', label: `📋 ${t.market.viewAll}` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
              ${activeTab === tab.key
                ? 'bg-white text-forest shadow-sm'
                : 'text-gray-500 hover:text-forest'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader message="Loading prices..." />
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════
              SECTION: "Where to Sell" — Best Mandis (when commodity selected)
             ═══════════════════════════════════════════════════════════ */}
          {commodity && bestMandis.length > 0 && (
            <div className="mb-6 animate-slide-up" id="best-mandis-section">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{getCommodityIcon(commodity)}</span>
                <div>
                  <h2 className="text-lg font-bold text-ink">{t.market.whereToSell} — {commodity}</h2>
                  <p className="text-xs text-gray-500">{t.market.topMandis} • {bestMandis.length} {t.market.totalRecords}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bestMandis.map((m, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-4 hover:border-forest/30 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    onClick={() => fetchTrend(m.mandi)}
                    id={`best-mandi-${i}`}
                  >
                    {/* Rank badge */}
                    {i < 3 && (
                      <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                        ${i === 0 ? 'bg-gradient-to-br from-amber to-yellow-500' : i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-amber-dark to-orange-600'}`}>
                        {i + 1}
                      </div>
                    )}

                    {/* Mandi info */}
                    <div className="mb-3">
                      <h3 className="font-bold text-ink text-sm group-hover:text-forest transition-colors">{m.mandi}</h3>
                      <p className="text-xs text-gray-400">{m.district}, {m.state}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-2xl font-bold text-forest">₹{m.modalPrice?.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-gray-400 mb-1">{t.market.perQuintal}</span>
                    </div>

                    {/* Price range bar */}
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-forest to-leaf transition-all duration-700"
                        style={{ width: `${(m.modalPrice / maxBestPrice) * 100}%` }}
                      />
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{t.market.min}: ₹{m.minPrice?.toLocaleString('en-IN')} — {t.market.max}: ₹{m.maxPrice?.toLocaleString('en-IN')}</span>
                      {m.msp && (
                        <Badge variant={m.aboveMsp ? 'leaf' : 'danger'}>
                          {m.aboveMsp ? '↑' : '↓'} MSP ₹{m.msp}
                        </Badge>
                      )}
                    </div>

                    {m.variety && (
                      <div className="mt-2 flex gap-1">
                        <Badge variant="default">{m.variety}</Badge>
                        {m.grade && <Badge variant="default">{m.grade}</Badge>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: Commodity Overview Cards
             ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && !commodity && (
            <div className="animate-fade-in" id="commodity-overview-section">
              {/* Search within commodities */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.market.searchCommodity}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-forest focus:outline-none text-sm bg-white transition-colors"
                  id="search-commodity"
                />
              </div>

              {filteredSummary.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-gray-400 text-lg">😕</p>
                  <p className="text-gray-400 mt-2">{t.market.noResults}</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSummary.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { setCommodity(item.commodity); setActiveTab('overview'); }}
                      className="group bg-white rounded-2xl border-2 border-gray-100 p-4 hover:border-forest/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      style={{ animationDelay: `${i * 50}ms` }}
                      id={`commodity-card-${i}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCommodityIcon(item.commodity)}</span>
                          <div>
                            <h3 className="font-bold text-ink text-sm group-hover:text-forest transition-colors">{item.commodity}</h3>
                            <span className="text-xs text-gray-400">{item.mandiCount} {t.market.mandiCount}</span>
                          </div>
                        </div>
                        {item.msp && (
                          <Badge variant={item.aboveMsp ? 'leaf' : 'danger'}>
                            {item.aboveMsp ? '↑ MSP' : '↓ MSP'}
                          </Badge>
                        )}
                      </div>

                      {/* Average Price */}
                      <div className="mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">{t.market.avgPrice}</span>
                        <div className="text-xl font-bold text-forest">₹{item.avgPrice?.toLocaleString('en-IN')}</div>
                      </div>

                      {/* Price range */}
                      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span>{t.market.min}: ₹{item.minPrice?.toLocaleString('en-IN')}</span>
                        <span className="text-gray-300">|</span>
                        <span>{t.market.max}: ₹{item.maxPrice?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB: Detailed Price Table
             ═══════════════════════════════════════════════════════════ */}
          {(activeTab === 'table' || (activeTab === 'overview' && commodity)) && (
            <Card className="mb-4 overflow-hidden animate-fade-in" id="price-table-section">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-ink text-sm">
                  {commodity ? `${getCommodityIcon(commodity)} ${commodity}` : '📋'} — {sortedPrices.length} {t.market.totalRecords}
                </h3>
              </div>

              {sortedPrices.length === 0 ? (
                <p className="text-gray-400 text-center py-8">{t.market.noResults}</p>
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm" id="price-table">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th
                          className="text-left py-3 px-2 font-semibold text-gray-500 cursor-pointer hover:text-forest text-xs uppercase tracking-wide"
                          onClick={() => handleSort('commodity')}
                        >
                          {t.market.mandi} {sortField === 'commodity' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">
                          {t.market.variety}
                        </th>
                        <th
                          className="text-right py-3 px-2 font-semibold text-gray-500 cursor-pointer hover:text-forest text-xs uppercase tracking-wide"
                          onClick={() => handleSort('minPrice')}
                        >
                          {t.market.min} {sortField === 'minPrice' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          className="text-right py-3 px-2 font-semibold text-gray-500 cursor-pointer hover:text-forest text-xs uppercase tracking-wide"
                          onClick={() => handleSort('modalPrice')}
                        >
                          {t.market.modalPrice} {sortField === 'modalPrice' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          className="text-right py-3 px-2 font-semibold text-gray-500 cursor-pointer hover:text-forest text-xs uppercase tracking-wide"
                          onClick={() => handleSort('maxPrice')}
                        >
                          {t.market.max} {sortField === 'maxPrice' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                          {t.market.msp}
                        </th>
                        <th className="text-center py-3 px-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPrices.slice(0, 50).map((p, i) => (
                        <tr
                          key={i}
                          className={`border-b border-gray-50 hover:bg-forest/5 transition-colors duration-150
                            ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{getCommodityIcon(p.commodity)}</span>
                              <div>
                                <div className="font-semibold text-ink text-sm">{p.commodity}</div>
                                <div className="text-xs text-gray-400">{p.mandi}</div>
                                <div className="text-xs text-gray-300">{p.district}, {p.state}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-xs text-gray-500 hidden sm:table-cell">
                            {p.variety && <div>{p.variety}</div>}
                            {p.grade && <div className="text-gray-400">{p.grade}</div>}
                          </td>
                          <td className="text-right py-3 px-2 text-gray-500 text-sm">₹{p.minPrice?.toLocaleString('en-IN')}</td>
                          <td className="text-right py-3 px-2 font-bold text-forest text-sm">₹{p.modalPrice?.toLocaleString('en-IN')}</td>
                          <td className="text-right py-3 px-2 text-gray-500 text-sm">₹{p.maxPrice?.toLocaleString('en-IN')}</td>
                          <td className="text-right py-3 px-2">
                            {p.msp ? (
                              <Badge variant={p.aboveMsp ? 'leaf' : 'danger'}>
                                {p.aboveMsp ? '↑' : '↓'} ₹{p.msp}
                              </Badge>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            <button
                              onClick={() => { setCommodity(p.commodity); fetchTrend(p.mandi); }}
                              className="text-forest text-xs font-semibold hover:underline opacity-70 hover:opacity-100 transition-opacity"
                            >
                              📈
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* ═══════════════════════════════════════════════════════════
              SECTION: Price Trend Chart
             ═══════════════════════════════════════════════════════════ */}
          {trendData.length > 0 && (
            <Card className="mb-4 animate-slide-up" id="trend-chart-section">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {getCommodityIcon(commodity)} {commodity}
                  </h3>
                  <p className="text-xs text-gray-400">{selectedMandi}</p>
                </div>
                <div className="flex gap-1">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => { setTrendDays(d); fetchTrend(selectedMandi); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                        ${trendDays === d ? 'bg-forest text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {d}D
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`₹${v?.toLocaleString('en-IN')}/q`, 'Price']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#2D6A4F"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#2D6A4F' }}
                    activeDot={{ r: 6, fill: '#52B788' }}
                  />
                  {trendMsp && (
                    <ReferenceLine
                      y={trendMsp}
                      stroke="#F4A261"
                      strokeDasharray="5 5"
                      label={{ value: `MSP ₹${trendMsp}`, position: 'top', fill: '#F4A261', fontSize: 11 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
