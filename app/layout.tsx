import type { Metadata } from 'next'
import './globals.css'
import Navigation from './components/Navigation'

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
      <body className="bg-bitcoin-950 text-orange-50 min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}