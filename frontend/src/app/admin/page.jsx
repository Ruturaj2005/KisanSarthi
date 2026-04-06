'use client';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import Card, { CardTitle } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2D6A4F', '#52B788', '#F4A261', '#E76F51', '#8B5E3C', '#74C69D'];

export default function AdminPage() {
  const { farmer } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, farmersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/farmers', { params: { page, limit: 10, search } }),
        ]);
        setStats(statsRes.data.data.stats);
        setCharts(statsRes.data.data.charts);
        setFarmers(farmersRes.data.data.farmers);
      } catch {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, search]);

  if (loading) return <PageLoader />;
  if (farmer?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center p-8">
          <span className="text-5xl block mb-4">🔒</span>
          <p className="text-lg font-bold text-ink">Admin access required</p>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: 'DAU', value: stats?.dau || 0, icon: '👥', color: 'from-forest to-leaf' },
    { label: 'Total Farmers', value: stats?.totalFarmers || 0, icon: '🌾', color: 'from-amber to-amber-dark' },
    { label: 'Advisories Today', value: stats?.advisoriesToday || 0, icon: '💬', color: 'from-leaf to-forest-light' },
    { label: 'Scans Today', value: stats?.scansToday || 0, icon: '📷', color: 'from-soil to-soil-light' },
  ];

  const langData = (charts?.langDist || []).map((d) => ({ name: d._id || 'Unknown', value: d.count }));
  const cropData = (charts?.topCrops || []).map((d) => ({ name: d._id || 'Unknown', count: d.count }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-ink mb-6">⚙️ Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((s, i) => (
          <Card key={i} className={`bg-gradient-to-br ${s.color} text-white text-center`}>
            <span className="text-3xl">{s.icon}</span>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardTitle>Language Distribution</CardTitle>
          {langData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={langData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                  {langData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">No data</p>}
        </Card>

        <Card>
          <CardTitle>Top Queried Crops</CardTitle>
          {cropData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cropData.slice(0, 6)}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-8">No data</p>}
        </Card>
      </div>

      {/* Farmer Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Farmers</CardTitle>
          <input
            type="text" placeholder="Search farmers..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-forest focus:outline-none w-48"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Name</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Email</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Location</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Crops</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Lang</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium">{f.name}</td>
                  <td className="py-2 px-2 text-gray-500">{f.email}</td>
                  <td className="py-2 px-2 text-gray-500">{f.location?.district || '—'}, {f.location?.state || '—'}</td>
                  <td className="py-2 px-2">{f.primaryCrops?.slice(0, 3).join(', ') || '—'}</td>
                  <td className="py-2 px-2">{f.preferredLang}</td>
                  <td className="py-2 px-2 text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
