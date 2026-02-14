'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface Trade {
  transaction_date: string
  transaction_type: string
  ticker: string
  amount_display: string
  return_pct: number | null
  [key: string]: any
}

interface Props {
  trades: Trade[]
}

const PERIODS = [
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: 'ALL', months: 0 },
] as const

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{d.dateDisplay}</p>
      <p className="text-white font-mono font-bold">${d.ticker}</p>
      <p className={d.type?.includes('purchase') ? 'text-green-400' : d.type?.includes('sale') ? 'text-red-400' : 'text-yellow-400'}>
        {d.type || 'unknown'} · {d.amount}
      </p>
      <p className={`font-bold ${d.returnPct != null ? (d.returnPct >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
        Return: {d.returnPct != null ? `${d.returnPct >= 0 ? '+' : ''}${d.returnPct.toFixed(1)}%` : 'N/A'}
      </p>
      <p className={`text-xs mt-1 ${d.cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        Cumulative: {d.cumulative >= 0 ? '+' : ''}{d.cumulative.toFixed(1)}%
      </p>
    </div>
  )
}

export default function PoliticianPerformanceChart({ trades }: Props) {
  const [period, setPeriod] = useState<string>('ALL')

  const chartData = useMemo(() => {
    // Sort by date ascending
    const sorted = [...trades]
      .filter(t => t.transaction_date)
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))

    let cumulative = 0
    return sorted.map(t => {
      const ret = t.return_pct ?? 0
      cumulative += ret
      return {
        date: t.transaction_date,
        dateDisplay: new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ticker: t.ticker || '?',
        type: t.transaction_type,
        amount: t.amount_display || 'N/A',
        returnPct: t.return_pct,
        cumulative: Math.round(cumulative * 10) / 10,
      }
    })
  }, [trades])

  const filteredData = useMemo(() => {
    if (period === 'ALL' || chartData.length === 0) return chartData
    const p = PERIODS.find(x => x.label === period)
    if (!p || p.months === 0) return chartData
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - p.months)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return chartData.filter(d => d.date >= cutoffStr)
  }, [chartData, period])

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold mb-2">Performance Timeline</h2>
        <p className="text-gray-500 text-sm">No trade data available for chart.</p>
      </div>
    )
  }

  const lastVal = filteredData.length > 0 ? filteredData[filteredData.length - 1].cumulative : 0
  const isPositive = lastVal >= 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold">Performance Timeline</h2>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => setPeriod(p.label)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                period === p.label
                  ? 'bg-bitcoin-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="dateDisplay"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth={2}
              fill={isPositive ? 'url(#gradGreen)' : 'url(#gradRed)'}
              dot={{ r: 2, fill: isPositive ? '#22c55e' : '#ef4444' }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Cumulative return across {filteredData.length} trades. Each point represents a trade.
      </p>
    </div>
  )
}
