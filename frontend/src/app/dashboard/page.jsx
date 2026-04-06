'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import Card, { CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { getTranslation } from '../../lib/i18n';
import api from '../../lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { farmer, isAuthenticated, isLoading } = useAuthStore();
  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (farmer?.location?.lat && farmer?.location?.lng) {
      api.get(`/weather/current?lat=${farmer.location.lat}&lng=${farmer.location.lng}`)
        .then(({ data }) => {
          setWeather(data.data.weather);
          setAlerts(data.data.alerts || []);
        })
        .catch(() => {});
    }
  }, [farmer]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return null;

  const quickActions = [
    { href: '/chat', icon: '💬', label: t.dashboard.chatAction, color: 'from-forest to-leaf' },
    { href: '/scan', icon: '📷', label: t.dashboard.scanAction, color: 'from-amber to-amber-dark' },
    { href: '/market', icon: '📊', label: t.dashboard.priceAction, color: 'from-soil to-soil-light' },
    { href: '/soil', icon: '🌱', label: t.dashboard.soilAction, color: 'from-leaf to-forest-light' },
  ];

  const weatherIcons = {
    Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️',
    Snow: '❄️', Mist: '🌫️', Haze: '🌫️', Fog: '🌫️',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {t.dashboard.welcome}, <span className="text-forest">{farmer?.name || 'Farmer'}</span> 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Weather Widget */}
      <Card className="mb-4 bg-gradient-to-r from-forest-dark to-forest text-white overflow-hidden relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-leaf-light text-sm font-medium">{t.dashboard.weather}</p>
            {weather ? (
              <>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-5xl">{weatherIcons[weather.condition] || '🌤️'}</span>
                  <div>
                    <p className="text-4xl font-bold">{weather.temp}°C</p>
                    <p className="text-leaf-light text-sm capitalize">{weather.description}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-sm text-leaf-light">
                  <span>💧 {weather.humidity}%</span>
                  <span>🌬️ {weather.windSpeed} km/h</span>
                  {weather.rainfall > 0 && <span>🌧️ {weather.rainfall}mm</span>}
                </div>
              </>
            ) : (
              <p className="text-leaf-light mt-2 text-sm">Add your location to see weather</p>
            )}
          </div>
          <div className="text-8xl opacity-10 absolute right-4 top-2">
            {weatherIcons[weather?.condition] || '🌤️'}
          </div>
        </div>

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="text-caution">⚠️</span>
                <span className="text-sm">{alert.action}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="text-center">
          <p className="text-xs text-gray-500">{t.dashboard.soilScore}</p>
          <p className="text-2xl font-bold text-forest mt-1">--</p>
          <p className="text-xs text-gray-400">/100</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500">{t.dashboard.activeCrop}</p>
          <p className="text-lg font-bold text-ink mt-1">{farmer?.primaryCrops?.[0] || '—'}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-gray-500">{t.dashboard.aiTip}</p>
          <p className="text-2xl mt-1">💡</p>
          <p className="text-xs text-leaf">Ask AI</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-ink mb-3">{t.dashboard.quickActions}</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card hover className={`bg-gradient-to-br ${action.color} text-white min-h-[100px] flex flex-col items-center justify-center gap-2`}>
                <span className="text-3xl">{action.icon}</span>
                <span className="text-sm font-semibold text-center">{action.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
