'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, Brush,
} from 'recharts'

interface HistoryPoint {
  date: string
  composite_score: number
  btc_price: number
  us_m2: number
  fed_balance_sheet: number
  reverse_repo: number
  tga: number
  credit_spread: number
  net_liquidity: number
}

const PERIODS = ['6M', '1Y', '2Y', '5Y', 'MAX'] as const
type Period = (typeof PERIODS)[number]

const OVERLAYS = [
  { key: 'btc_price', label: 'BTC Price', color: '#f7931a' },
  { key: 'net_liquidity', label: 'Net Fed Liquidity', color: '#22d3ee' },
  { key: 'us_m2', label: 'US M2', color: '#a78bfa' },
  { key: 'reverse_repo', label: 'Reverse Repo', color: '#f472b6' },
  { key: 'credit_spread', label: 'Credit Spread', color: '#fbbf24' },
] as const

export default function LiquidityChart() {
  const [period, setPeriod] = useState<Period>('1Y')
  const [data, setData] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [overlay, setOverlay] = useState<string>('btc_price')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/v1/live/liquidity-history?period=${period}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.history?.length > 0) {
          setData(d.history)
        } else {
          setError('No data available for this period')
        }
        setLoading(false)
      })
      .catch(e => {
        setError('Failed to load data')
        setLoading(false)
      })
  }, [period])

  // Format data for dual-axis chart
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      dateLabel: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      dateShort: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
  }, [data])

  const overlayConfig = OVERLAYS.find(o => o.key === overlay)!

  // Determine score zones
  const scoreZones = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100 }
    const scores = chartData.map(d => d.composite_score)
    return { min: Math.floor(Math.min(...scores) / 10) * 10, max: Math.ceil(Math.max(...scores) / 10) * 10 }
  }, [chartData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    if (!d) return null
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-sm">
        <p className="text-slate-300 font-medium mb-2">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Liquidity Score:</span>
            <span className={`font-bold ${d.composite_score >= 70 ? 'text-green-400' : d.composite_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {d.composite_score.toFixed(1)}
            </span>
          </div>
          {overlay === 'btc_price' && d.btc_price > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">BTC Price:</span>
              <span className="font-bold text-orange-400">${d.btc_price.toLocaleString()}</span>
            </div>
          )}
          {overlay === 'net_liquidity' && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Net Liquidity:</span>
              <span className="font-bold text-cyan-400">${d.net_liquidity.toFixed(0)}B</span>
            </div>
          )}
          {overlay === 'us_m2' && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">US M2:</span>
              <span className="font-bold text-violet-400">${(d.us_m2 / 1000).toFixed(2)}T</span>
            </div>
          )}
          {overlay === 'reverse_repo' && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Reverse Repo:</span>
              <span className="font-bold text-pink-400">${d.reverse_repo.toFixed(0)}B</span>
            </div>
          )}
          {overlay === 'credit_spread' && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Credit Spread:</span>
              <span className="font-bold text-yellow-400">{d.credit_spread.toFixed(2)}%</span>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-700">
            <span className="text-slate-500">Fed BS:</span>
            <span className="text-slate-300">${d.fed_balance_sheet.toFixed(2)}T</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">TGA:</span>
            <span className="text-slate-300">${d.tga.toFixed(0)}B</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Liquidity Score vs {overlayConfig.label}</h2>
            <p className="text-sm text-slate-400 mt-1">Interactive dual-axis chart • Click overlay buttons to switch</p>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === p ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Overlay selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          {OVERLAYS.map(o => (
            <button key={o.key} onClick={() => setOverlay(o.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${overlay === o.key
                ? 'border-transparent text-white shadow-lg'
                : 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}
              style={overlay === o.key ? { backgroundColor: o.color + '33', borderColor: o.color, color: o.color } : {}}>
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: o.color }}></span>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {loading ? (
          <div className="h-[420px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="h-[420px] flex items-center justify-center text-slate-400">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="overlayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={overlayConfig.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={overlayConfig.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              {/* Left Y-axis: Composite Score */}
              <YAxis
                yAxisId="score"
                domain={[scoreZones.min, scoreZones.max]}
                tick={{ fill: '#60a5fa', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={45}
                label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#60a5fa', fontSize: 12 }}
              />
              {/* Right Y-axis: Overlay */}
              <YAxis
                yAxisId="overlay"
                orientation="right"
                tick={{ fill: overlayConfig.color, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={(v: number) => {
                  if (overlay === 'btc_price') return `$${(v / 1000).toFixed(0)}K`
                  if (overlay === 'us_m2') return `$${(v / 1000).toFixed(1)}T`
                  if (overlay === 'credit_spread') return `${v.toFixed(1)}%`
                  return `$${v.toFixed(0)}B`
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Score zones */}
              <ReferenceLine yAxisId="score" y={70} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.4} />
              <ReferenceLine yAxisId="score" y={40} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.4} />

              {/* Composite Score area */}
              <Area
                yAxisId="score"
                type="monotone"
                dataKey="composite_score"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#scoreGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                name="Liquidity Score"
              />

              {/* Overlay line */}
              <Line
                yAxisId="overlay"
                type="monotone"
                dataKey={overlay}
                stroke={overlayConfig.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: overlayConfig.color, stroke: '#fff', strokeWidth: 2 }}
                name={overlayConfig.label}
              />

              {chartData.length > 50 && (
                <Brush
                  dataKey="dateLabel"
                  height={28}
                  stroke="#475569"
                  fill="#1e293b"
                  tickFormatter={() => ''}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend / Zone explanation */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-8 h-0.5 bg-green-500 inline-block" style={{ borderTop: '2px dashed #22c55e' }}></span> Bullish (&gt;70)</span>
          <span className="flex items-center gap-1"><span className="w-8 h-0.5 bg-red-500 inline-block" style={{ borderTop: '2px dashed #ef4444' }}></span> Bearish (&lt;40)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500/30 inline-block border border-blue-500"></span> Liquidity Score</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: overlayConfig.color }}></span> {overlayConfig.label}</span>
          <span className="ml-auto">Drag brush to zoom • Data from FRED + CoinGecko</span>
        </div>
      </div>
    </div>
  )
}
