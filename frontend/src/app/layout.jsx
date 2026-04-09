'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  const { checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="KisanSaathi - AI-powered farming companion for Indian farmers. Get crop advisory, pest detection, soil analysis, and market prices in your language." />
        <meta name="theme-color" content="#2D6A4F" />
        <title>KisanSaathi — किसान का साथी</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-cream" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          {mounted ? (
            <>
              <Navbar />
              <main className="pb-20 md:pb-0">
                {children}
              </main>
              <BottomNav />
            </>
          ) : null}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#1B1F1E',
                color: '#fff',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#52B788', secondary: '#fff' } },
              error: { iconTheme: { primary: '#E63946', secondary: '#fff' } },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
