import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VaultSignal — BTC & MSTR Trading Indicator | BTCIntelVault',
  description:
    'The most comprehensive Bitcoin and MSTR trading indicator. 22 data streams across on-chain, macro, technical, sentiment, and MSTR-specific signals fused into one clear BUY/SELL signal.',
  openGraph: {
    title: 'VaultSignal — BTC & MSTR Trading Indicator',
    description:
      '22 data streams. 5 categories. One clear signal. The premium trading indicator for BTC and MSTR.',
    url: 'https://bitcoinintelvault.com/vaultsignal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VaultSignal — BTC & MSTR Trading Indicator',
    description: '22 data streams. 5 categories. One clear signal.',
  },
}

export default function VaultSignalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
