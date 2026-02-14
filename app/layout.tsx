import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navigation from './components/Navigation'
import AnalyticsWrapper from './components/AnalyticsWrapper'
import PWARegister from './components/PWARegister'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  title: 'BTCIntelVault - Bitcoin Treasury & MSTR Options Intelligence',
  description: 'Professional Bitcoin treasury analytics, MSTR options intelligence, and political trading insights. Real-time data for institutional investors.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BTCIntelVault',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen">
        <PWARegister />
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <AnalyticsWrapper />
        <SpeedInsights />
      </body>
    </html>
  )
}