'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, User } from 'lucide-react'

interface Trade {
  id?: number
  ticker?: string
  asset_name?: string
  trade_type?: string
  transaction_type?: string
  trade_date?: string
  trade_date_display?: string
  transaction_date?: string
  size_range?: string
  amount_display?: string
  owner?: string
  published?: string
  disclosure_date?: string
  purchase_price?: number
  price_at_trade?: number | null
  price?: string
  current_price?: number
  price_current?: number | null
  return_pct?: number | null
  days_held?: number | null
  return_1d?: number | null
  return_5d?: number | null
  return_30d?: number | null
}

interface LivePriceData {
  [ticker: string]: { price: number; updated: string }
}

function returnColor(v: number | null | undefined): string {
  if (v == null) return 'text-gray-500'
  return v >= 0 ? 'text-green-400' : 'text-red-400'
}

function formatReturn(v: number | null | undefined): string {
  if (v == null) return 'N/A'
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

function tradeTypeColor(type: string): string {
  const upper = type?.toUpperCase() || ''
  if (upper.includes('BUY') || upper.includes('PURCHASE')) return 'text-green-400'
  if (upper.includes('SELL') || upper.includes('SALE')) return 'text-red-400'
  return 'text-yellow-400'
}

function tradeTypeEmoji(type: string): string {
  const upper = type?.toUpperCase() || ''
  if (upper.includes('BUY') || upper.includes('PURCHASE')) return '🟢'
  if (upper.includes('SELL') || upper.includes('SALE')) return '🔴'
  return '🟡'
}

export default function TradeHistoryWithLivePrices({ trades }: { trades: Trade[] }) {
  const [livePrices, setLivePrices] = useState<LivePriceData>({})
  const [connected, setConnected] = useState(false)
  const prevPrices = useRef<Record<string, number>>({})
  const [flashTickers, setFlashTickers] = useState<Record<string, 'up' | 'down'>>({})

  // Extract unique valid tickers
  const tickers = [...new Set(
    trades.map(t => t.ticker).filter((t): t is string => !!t && /^[A-Z]{1,5}$/.test(t))
  )]

  useEffect(() => {
    if (!tickers.length) return
    let active = true

    const fetchPrices = async () => {
      try {
        const chunks: string[][] = []
        for (let i = 0; i < tickers.length; i += 20) {
          chunks.push(tickers.slice(i, i + 20))
        }
        const allPrices: LivePriceData = {}
        for (const chunk of chunks) {
          const res = await fetch(`/api/v1/live/prices?tickers=${chunk.join(',')}`)
          if (res.ok) {
            const data = await res.json()
            Object.assign(allPrices, data.prices || {})
          }
        }
        if (!active) return

        // Detect price changes for flash
        const flashes: Record<string, 'up' | 'down'> = {}
        for (const [tk, data] of Object.entries(allPrices)) {
          if (prevPrices.current[tk] && prevPrices.current[tk] !== data.price) {
            flashes[tk] = data.price > prevPrices.current[tk] ? 'up' : 'down'
          }
          prevPrices.current[tk] = data.price
        }
        if (Object.keys(flashes).length) {
          setFlashTickers(flashes)
          setTimeout(() => setFlashTickers({}), 1000)
        }

        setLivePrices(allPrices)
        setConnected(true)
      } catch {
        if (active) setConnected(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => { active = false; clearInterval(interval) }
  }, [tickers.join(',')])

  return (
    <div>
      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
        {connected ? `Live prices for ${Object.keys(livePrices).length} tickers` : 'Connecting to live prices...'}
      </div>

      {/* Trade list */}
      <div className="space-y-4">
        {trades.map((trade, i) => {
          const prevTrade = trades[i - 1]
          const curMonth = (trade.trade_date_display || trade.transaction_date || '').slice(0, 7)
          const prevMonth = prevTrade ? (prevTrade.trade_date_display || prevTrade.transaction_date || '').slice(0, 7) : null
          const showDivider = curMonth !== prevMonth

          const tradePrice = trade.purchase_price || trade.price_at_trade || null
          const live = trade.ticker ? livePrices[trade.ticker] : null
          const liveReturn = (tradePrice && live && tradePrice > 0)
            ? ((live.price - tradePrice) / tradePrice) * 100
            : trade.return_pct
          const tradeType = trade.trade_type || trade.transaction_type || ''
          const flash = trade.ticker ? flashTickers[trade.ticker] : null

          return (
            <div key={trade.id || i}>
              {showDivider && (
                <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
                  <div className="h-px flex-1 bg-gray-700" />
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {curMonth}
                  </span>
                  <div className="h-px flex-1 bg-gray-700" />
                </div>
              )}

              <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg p-4 hover:border-gray-600 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Date */}
                  <div className="md:w-36 flex-shrink-0">
                    <p className="text-white font-semibold text-sm">
                      {trade.trade_date_display || trade.transaction_date || 'Unknown'}
                    </p>
                    {trade.days_held != null && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {trade.days_held === 0 ? 'Today' : trade.days_held === 1 ? '1 day ago' : `${trade.days_held} days ago`}
                      </p>
                    )}
                  </div>

                  {/* Type */}
                  <div className="md:w-20 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${tradeTypeColor(tradeType)}`}>
                      {tradeTypeEmoji(tradeType)} {tradeType}
                    </span>
                  </div>

                  {/* Ticker & Asset */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      {trade.ticker && (
                        <span className="text-white font-bold font-mono text-lg">${trade.ticker}</span>
                      )}
                      <span className="text-gray-400 text-sm truncate">{trade.asset_name || ''}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Size: {trade.size_range || trade.amount_display || 'N/A'}</span>
                      {trade.owner && trade.owner !== 'Self' && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {trade.owner}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Return */}
                  <div className="md:text-right flex-shrink-0">
                    <div className="flex items-center gap-4 md:justify-end">
                      <div>
                        <p className="text-xs text-gray-500">Trade Price</p>
                        <p className="text-white font-medium">
                          {tradePrice ? `$${tradePrice.toFixed(2)}` : (trade.price || 'N/A')}
                        </p>
                      </div>
                      {live ? (
                        <div>
                          <p className="text-xs text-gray-500">Live</p>
                          <p className={`text-white font-medium font-mono transition-colors ${
                            flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : ''
                          }`}>
                            ${live.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (trade.current_price || trade.price_current) ? (
                        <div>
                          <p className="text-xs text-gray-500">Current</p>
                          <p className="text-white font-medium">
                            ${(trade.current_price || trade.price_current || 0).toFixed(2)}
                          </p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-xs text-gray-500">Return</p>
                        <p className={`text-lg font-bold ${returnColor(liveReturn)}`}>
                          {formatReturn(liveReturn)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
