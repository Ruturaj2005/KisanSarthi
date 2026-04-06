'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '../../store/authStore';
import { getTranslation } from '../../lib/i18n';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', key: 'home' },
  { href: '/chat', icon: '💬', key: 'chat' },
  { href: '/scan', icon: '📷', key: 'scan' },
  { href: '/market', icon: '📊', key: 'market' },
  { href: '/profile', icon: '👤', key: 'profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { farmer, isAuthenticated } = useAuthStore();
  const lang = farmer?.preferredLang || 'en';
  const t = getTranslation(lang);

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-100 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[48px] rounded-xl transition-all duration-200
                ${isActive
                  ? 'text-forest bg-forest/10 scale-105'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <span className={`text-xl ${isActive ? 'animate-bounce-gentle' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium mt-0.5">{t.nav[item.key]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
