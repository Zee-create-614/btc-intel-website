'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart, Area } from 'recharts'
import { Activity, RefreshCw } from 'lucide-react'

interface VolumeDataPoint {
  timestamp: string
  date: string
  volume: number
  price: number | null
}

interface Props {
  symbol: string
  color?: string
}

const PERIODS = [
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: 'MAX', value: 'max' },
]

const SYMBOL_COLORS: Record<string, string> = {
  STRC: '#3b82f6',
  STRF: '#10b981',
  STRD: '#f59e0b',
  STRK: '#8b5cf6',
}

const formatVolume = (v: number) => {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return v.toString()
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-300 font-medium">{d.date}</p>
      <p className="text-white font-bold">Vol: {formatVolume(d.volume)}</p>
      {d.price != null && <p className="text-blue-400">Price: ${d.price.toFixed(2)}</p>}
    </div>
  )
}

export default function PreferredVolumeChart({ symbol, color }: Props) {
  const [data, setData] = useState<VolumeDataPoint[]>([])
  const [period, setPeriod] = useState('1mo')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const barColor = color || SYMBOL_COLORS[symbol] || '#3b82f6'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/v1/mstr/preferreds/volume-history?symbol=${symbol}&period=${period}`)
        const json = await res.json()
        if (json.success && json.volume_history?.length > 0) {
          setData(json.volume_history)
        } else {
          setError(json.error || 'No data available')
          setData([])
        }
      } catch (err) {
        setError('Failed to load')
        setData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [symbol, period])

  const avgVolume = data.length > 0 ? data.reduce((s, d) => s + d.volume, 0) / data.length : 0

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4" style={{ color: barColor }} />
          <h3 className="text-sm font-bold text-white">{symbol} Volume</h3>
          {avgVolume > 0 && (
            <span className="text-xs text-slate-400">Avg: {formatVolume(avgVolume)}</span>
          )}
        </div>
        <div className="flex space-x-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                period === p.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              interval={Math.max(0, Math.floor(data.length / 6))}
            />
            <YAxis
              tickFormatter={formatVolume}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="volume"
              fill={barColor}
              opacity={0.8}
              radius={[2, 2, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
