import type { Metadata } from 'next'
import './globals.css'
import Navigation from './components/Navigation'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'BTCIntelVault - Bitcoin Treasury & MSTR Options Intelligence',
  description: 'Professional Bitcoin treasury analytics, MSTR options intelligence, and political trading insights. Real-time data for institutional investors.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}