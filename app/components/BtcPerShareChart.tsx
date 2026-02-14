'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Bitcoin, TrendingUp, RefreshCw } from 'lucide-react'

interface DataPoint {
  date: string
  label: string
  btc_per_share: number
  btc_holdings: number
  shares_outstanding: number
}

interface Stats {
  current_btc_per_share: number
  period_start_btc_per_share: number
  growth_percent: number
  total_btc: number
  total_shares: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-sm shadow-xl">
      <p className="text-slate-300 font-medium mb-1">{new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p className="text-orange-400 font-bold text-lg">₿ {d.btc_per_share.toFixed(6)}</p>
      <div className="text-xs text-slate-400 mt-1 space-y-0.5">
        <p>Holdings: {d.btc_holdings.toLocaleString()} BTC</p>
        <p>Shares: {(d.shares_outstanding / 1000000).toFixed(0)}M</p>
      </div>
    </div>
  )
}

export default function BtcPerShareChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/v1/live/btc-per-share-history?period=max')
        const json = await res.json()
        if (json.success && json.data?.length > 0) {
          setData(json.data)
          setStats(json.stats)
        }
      } catch (err) {
        console.error('BTC per share fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const isPositive = (stats?.growth_percent ?? 0) >= 0

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Bitcoin className="h-6 w-6 text-orange-400" />
            <h3 className="text-xl font-bold text-white">Bitcoin per Share</h3>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">LIVE</span>
          </div>
          {stats && (
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-orange-400">
                ₿ {stats.current_btc_per_share.toFixed(6)}
              </span>
              <span className={`text-sm font-bold px-2 py-1 rounded ${
                isPositive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {isPositive ? '+' : ''}{stats.growth_percent.toFixed(1)}% since Aug 2020
              </span>
            </div>
          )}
        </div>
        {stats && (
          <div className="text-right text-sm text-slate-400 mt-3 md:mt-0">
            <p>{stats.total_btc.toLocaleString()} BTC</p>
            <p>{(stats.total_shares / 1000000).toFixed(0)}M shares</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval={Math.max(0, Math.floor(data.length / 10))}
            />
            <YAxis
              tickFormatter={(v: number) => `₿${v.toFixed(4)}`}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax']}
              width={85}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="btc_per_share"
              fill="#f97316"
              opacity={0.85}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 text-center text-xs text-slate-500">
        Each bar = a Bitcoin purchase event • Data from SEC filings & Strategy.com
      </div>
    </div>
  )
}
