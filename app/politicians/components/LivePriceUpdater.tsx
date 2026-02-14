'use client'

import { useState, useEffect, useRef } from 'react'

interface PriceData {
  [ticker: string]: { price: number; updated: string }
}

interface Props {
  tickers: string[]
  onPricesUpdate: (prices: PriceData) => void
}

export default function LivePriceUpdater({ tickers, onPricesUpdate }: Props) {
  const [connected, setConnected] = useState(false)
  const prevPrices = useRef<PriceData>({})

  useEffect(() => {
    if (!tickers.length) return

    const validTickers = [...new Set(tickers.filter(t => /^[A-Z]{1,5}$/.test(t)))]
    if (!validTickers.length) return

    let active = true
    const fetchPrices = async () => {
      try {
        // Batch into chunks of 20
        const chunks: string[][] = []
        for (let i = 0; i < validTickers.length; i += 20) {
          chunks.push(validTickers.slice(i, i + 20))
        }

        const allPrices: PriceData = {}
        for (const chunk of chunks) {
          const res = await fetch(`/api/v1/live/prices?tickers=${chunk.join(',')}`)
          if (res.ok) {
            const data = await res.json()
            Object.assign(allPrices, data.prices || {})
          }
        }

        if (active) {
          prevPrices.current = allPrices
          onPricesUpdate(allPrices)
          setConnected(true)
        }
      } catch {
        if (active) setConnected(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => { active = false; clearInterval(interval) }
  }, [tickers.join(',')])

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
      {connected ? 'Live prices' : 'Connecting...'}
    </div>
  )
}

// Helper component for inline price display with flash animation
export function LivePrice({ 
  ticker, 
  tradePrice, 
  livePrice 
}: { 
  ticker: string; 
  tradePrice: number | null; 
  livePrice: { price: number; updated: string } | null 
}) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevPrice = useRef<number | null>(null)

  useEffect(() => {
    if (livePrice && prevPrice.current !== null && prevPrice.current !== livePrice.price) {
      setFlash(livePrice.price > prevPrice.current ? 'up' : 'down')
      const t = setTimeout(() => setFlash(null), 1000)
      return () => clearTimeout(t)
    }
    if (livePrice) prevPrice.current = livePrice.price
  }, [livePrice?.price])

  if (!livePrice) return null

  const returnPct = tradePrice && tradePrice > 0 
    ? ((livePrice.price - tradePrice) / tradePrice) * 100 
    : null

  const flashClass = flash === 'up' 
    ? 'animate-pulse text-green-400' 
    : flash === 'down' 
    ? 'animate-pulse text-red-400' 
    : ''

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="text-xs text-gray-500">Live</p>
        <p className={`text-white font-medium font-mono ${flashClass}`}>
          ${livePrice.price.toFixed(2)}
        </p>
      </div>
      {returnPct !== null && (
        <div>
          <p className="text-xs text-gray-500">Return</p>
          <p className={`text-lg font-bold ${returnPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  )
}
