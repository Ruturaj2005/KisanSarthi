'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import { getTranslation, LANGUAGES } from '../../lib/i18n';
import { useState } from 'react';

export default function Navbar() {
  const { farmer, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  if (!isAuthenticated) return null;

  const isAdmin = farmer?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:animate-bounce-gentle">🌾</span>
          <span className="text-xl font-bold bg-gradient-to-r from-forest to-leaf bg-clip-text text-transparent hidden sm:inline">
            {t.app.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/dashboard', label: t.nav.home, icon: '🏠' },
            { href: '/chat', label: t.nav.chat, icon: '💬' },
            { href: '/scan', label: t.nav.scan, icon: '📷' },
            { href: '/market', label: t.nav.market, icon: '📊' },
            { href: '/soil', label: t.nav.soil, icon: '🌱' },
            ...(isAdmin ? [{ href: '/admin', label: t.nav.admin, icon: '⚙️' }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${pathname === item.href
                  ? 'bg-forest/10 text-forest'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-ink'
                }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-lg"
              aria-label="Change language"
            >
              {LANGUAGES.find((l) => l.code === lang)?.flag || '🌐'}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[160px] z-50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLangOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2
                      ${l.code === lang ? 'text-forest font-semibold bg-forest/5' : 'text-gray-700'}`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile */}
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forest to-leaf flex items-center justify-center text-white text-sm font-bold">
              {farmer?.name?.charAt(0)?.toUpperCase() || 'F'}
            </div>
            <span className="hidden lg:inline text-sm font-medium text-gray-700">{farmer?.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
