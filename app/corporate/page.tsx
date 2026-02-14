'use client'

import { useState, useEffect } from 'react'
import { Globe, Shield, AlertTriangle, TrendingUp, Flag, Landmark } from 'lucide-react'

interface Holding {
  country: string
  flag: string
  btc: number
  value_usd: number
  pct_supply: number
  type: string
  acquisition: string
  notes: string
  strategic: boolean
}

interface GovData {
  btc_price: number
  total_btc: number
  total_value_usd: number
  strategic_reserve_btc: number
  pct_total_supply: number
  holdings: Holding[]
  last_updated: string
  source: string
}

export default function GovernmentHoldingsPage() {
  const [data, setData] = useState<GovData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'strategic' | 'seized'>('all')

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/live/government-holdings', { cache: 'no-store' })
      const d = await res.json()
      setData(d)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // refresh every 30s for live BTC price
    return () => clearInterval(interval)
  }, [])

  const formatUSD = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
    return `$${n.toLocaleString()}`
  }

  const formatBTC = (n: number) => n.toLocaleString()

  const getTypeColor = (type: string) => {
    if (type.includes('Strategic') || type.includes('National')) return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (type.includes('Seized') || type.includes('Illicit')) return 'text-red-400 bg-red-500/10 border-red-500/30'
    if (type.includes('Mining')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    if (type.includes('Liquidated')) return 'text-slate-500 bg-slate-500/10 border-slate-500/30'
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  }

  const filtered = data?.holdings.filter(h => {
    if (filter === 'strategic') return h.strategic
    if (filter === 'seized') return !h.strategic && h.btc > 0
    return true
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold mb-4">Government Bitcoin Holdings</h1>
          <p className="text-slate-400">Unable to load data. Try refreshing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Landmark className="h-9 w-9 text-orange-400" />
          Government Bitcoin Holdings
        </h1>
        <p className="text-slate-400">
          Live tracking of sovereign Bitcoin reserves, seized assets, and state-held BTC worldwide
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Total Government BTC</p>
          <p className="text-2xl font-bold text-orange-400">₿ {formatBTC(data.total_btc)}</p>
          <p className="text-xs text-slate-500 mt-1">{data.pct_total_supply.toFixed(2)}% of 21M supply</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Total Value (Live)</p>
          <p className="text-2xl font-bold text-green-400">{formatUSD(data.total_value_usd)}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-400">BTC @ ${data.btc_price.toLocaleString()}</span>
          </div>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Strategic Reserves</p>
          <p className="text-2xl font-bold text-blue-400">₿ {formatBTC(data.strategic_reserve_btc)}</p>
          <p className="text-xs text-slate-500 mt-1">{data.holdings.filter(h => h.strategic).length} countries</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 mb-1">Countries Holding</p>
          <p className="text-2xl font-bold text-white">{data.holdings.filter(h => h.btc > 0).length}</p>
          <p className="text-xs text-slate-500 mt-1">of {data.holdings.length} tracked</p>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-white">Holdings Distribution</h2>
        <div className="space-y-3">
          {data.holdings.filter(h => h.btc > 0).map(h => {
            const pct = (h.btc / data.total_btc) * 100
            return (
              <div key={h.country} className="group">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-300 font-medium">{h.flag} {h.country}</span>
                  <span className="text-slate-400">₿ {formatBTC(h.btc)} <span className="text-slate-500">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${h.strategic ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                    style={{ width: `${Math.max(0.5, pct)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All Countries', count: data.holdings.length },
          { key: 'strategic', label: 'Strategic Reserves', count: data.holdings.filter(h => h.strategic).length },
          { key: 'seized', label: 'Seized / Other', count: data.holdings.filter(h => !h.strategic && h.btc > 0).length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.key ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Holdings Table */}
      <div className="space-y-3">
        {filtered.map((h, i) => (
          <div key={h.country}
            className={`card cursor-pointer transition-all hover:border-slate-600 ${expanded === h.country ? 'border-orange-500/50' : ''} ${h.btc === 0 ? 'opacity-50' : ''}`}
            onClick={() => setExpanded(expanded === h.country ? null : h.country)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{h.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{h.country}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(h.type)}`}>
                      {h.type}
                    </span>
                    {h.strategic && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Strategic
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{h.acquisition}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-orange-400">₿ {formatBTC(h.btc)}</p>
                <p className="text-sm text-green-400">{formatUSD(h.value_usd)}</p>
                <p className="text-xs text-slate-500">{h.pct_supply.toFixed(3)}% of supply</p>
              </div>
            </div>

            {/* Expanded details */}
            {expanded === h.country && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Acquisition Method</p>
                    <p className="text-sm text-slate-300">{h.acquisition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-slate-300">{h.notes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Holding Value Breakdown</p>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>Current value: <span className="text-green-400 font-medium">{formatUSD(h.value_usd)}</span></p>
                      <p>At $100K BTC: <span className="text-slate-400">{formatUSD(h.btc * 100000)}</span></p>
                      <p>At $250K BTC: <span className="text-slate-400">{formatUSD(h.btc * 250000)}</span></p>
                      <p>At $1M BTC: <span className="text-yellow-400 font-medium">{formatUSD(h.btc * 1000000)}</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Supply Impact</p>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>% of 21M supply: <span className="text-orange-400 font-medium">{h.pct_supply.toFixed(4)}%</span></p>
                      <p>% of circulating (~19.8M): <span className="text-orange-400">{((h.btc / 19800000) * 100).toFixed(4)}%</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-400" />
          Key Insights
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
              <h4 className="font-semibold text-green-400 mb-1">🏛️ Strategic Bitcoin Reserve Era</h4>
              <p className="text-sm text-slate-300">The U.S. established a formal Strategic Bitcoin Reserve in March 2025 — the first major economy to designate Bitcoin as a sovereign reserve asset. Policy shift from liquidation to long-term custody.</p>
            </div>
            <div className="p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg">
              <h4 className="font-semibold text-orange-400 mb-1">⚡ Game Theory Accelerating</h4>
              <p className="text-sm text-slate-300">With the U.S. holding 328K+ BTC as strategic reserve, other nations face pressure to accumulate before scarcity intensifies. Pakistan announced its own reserve in 2025.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <h4 className="font-semibold text-blue-400 mb-1">🔒 Supply Squeeze</h4>
              <p className="text-sm text-slate-300">Governments hold {data.pct_total_supply.toFixed(1)}% of all Bitcoin that will ever exist. Combined with corporate treasuries and ETFs, available supply continues shrinking.</p>
            </div>
            <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
              <h4 className="font-semibold text-red-400 mb-1">⚠️ Germany's Mistake</h4>
              <p className="text-sm text-slate-300">Germany sold ~50K BTC in July 2024, worth ~$3.5B at the time. At current prices, that stash would be worth {formatUSD(50000 * data.btc_price)}. Widely seen as one of the worst sovereign financial decisions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 py-2">
        Data from bitcointreasuries.net + public government reports • BTC price updates every 30s • Holdings updated periodically
      </div>
    </div>
  )
}
