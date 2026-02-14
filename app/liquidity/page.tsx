'use client'

import { useState, useEffect } from 'react'
import LiquidityChart from '../components/LiquidityChart'

interface LiquidityData {
  composite_score: number
  btc_correlation: number
  btc_price: number
  liquidity_state: string
  components: {
    us_m2: number
    fed_balance_sheet: number
    net_fed_liquidity: number
    reverse_repo: number
    tga: number
    credit_spread: number
    dxy: number
    ecb_assets: number
    boj_assets: number
  }
  analysis: string
  last_updated: string
  source: string
}

export default function LiquidityTracker() {
  const [liquidityData, setLiquidityData] = useState<LiquidityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchData = async () => {
    try {
      const response = await fetch('/api/v1/live/liquidity', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLiquidityData(data)
      }

      setLastUpdate(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (error) {
      console.error('Error fetching liquidity data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number, unit?: string): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}T`
    }
    return `${num.toFixed(2)}${unit || ''}`
  }

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStateColor = (state: string): string => {
    if (state.includes('EXPANSIONARY')) return 'text-green-400'
    if (state.includes('NEUTRAL')) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStateEmoji = (state: string): string => {
    if (state.includes('EXPANSIONARY')) return '🟢'
    if (state.includes('NEUTRAL')) return '🟡'
    return '🔴'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded mb-6"></div>
            <div className="grid gap-6">
              <div className="h-64 bg-slate-700 rounded"></div>
              <div className="h-96 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!liquidityData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Global Liquidity Tracker</h1>
          <p className="text-slate-400">Unable to load liquidity data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">🌊 Global Liquidity Tracker</h1>
              <p className="text-slate-400">Real-time global monetary conditions and Bitcoin correlation</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Last Update</div>
              <div className="text-lg font-bold text-orange-400">
                {lastUpdate}
              </div>
              <div className="text-xs text-slate-500">
                Auto-refresh: 30s
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Score Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Composite Liquidity Score</span>
              <span className={`text-2xl ${getScoreColor(liquidityData.composite_score)}`}>
                {liquidityData.composite_score.toFixed(1)}/100
              </span>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-400 mb-2">Current State</div>
                <div className={`text-xl font-bold ${getStateColor(liquidityData.liquidity_state)}`}>
                  {getStateEmoji(liquidityData.liquidity_state)} {liquidityData.liquidity_state.replace('_', ' ')}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">BTC Correlation</div>
                <div className="text-xl font-bold text-orange-400">
                  {liquidityData.btc_correlation.toFixed(3)}
                </div>
                <div className="text-sm text-slate-500">
                  BTC Price: ${liquidityData.btc_price?.toLocaleString() || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Chart */}
        <LiquidityChart />

        {/* Components Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">US M2 Money Supply</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-white">
                ${formatNumber(liquidityData.components.us_m2)}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">Fed Balance Sheet</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-orange-400">
                ${formatNumber(liquidityData.components.fed_balance_sheet)}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">Net Fed Liquidity</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-green-400">
                ${liquidityData.components.net_fed_liquidity}B
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">Reverse Repo</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-blue-400">
                ${formatNumber(liquidityData.components.reverse_repo)}B
              </div>
              <div className="text-xs text-slate-500">
                {liquidityData.components.reverse_repo < 1 ? '(Nearly Drained)' : ''}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">Treasury General Account</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-purple-400">
                ${liquidityData.components.tga}B
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">Credit Spread</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-yellow-400">
                {liquidityData.components.credit_spread.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-500">
                {liquidityData.components.credit_spread < 3 ? '(Low Stress)' : '(High Stress)'}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">US Dollar Index (DXY)</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-red-400">
                {liquidityData.components.dxy.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">ECB Assets</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-blue-400">
                €{formatNumber(liquidityData.components.ecb_assets)}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="pb-2 p-4">
              <h3 className="text-sm text-slate-400 mb-2">BoJ Assets</h3>
            </div>
            <div className="px-4 pb-4">
              <div className="text-2xl font-bold text-green-400">
                ¥{formatNumber(liquidityData.components.boj_assets)}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Liquidity Analysis</h2>
          </div>
          <div className="px-6 pb-6">
            <p className="text-slate-300 leading-relaxed">
              {liquidityData.analysis}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-500">
              Data source: {liquidityData.source} • Last updated: {new Date(liquidityData.last_updated).toLocaleString()}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg mt-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">How the Liquidity Score Works</h2>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h4 className="font-bold text-orange-400 mb-2">Score Ranges:</h4>
              <ul className="space-y-1 text-slate-300">
                <li><span className="text-green-400">70-100:</span> Highly Expansionary (Very Bullish for BTC)</li>
                <li><span className="text-yellow-400">40-69:</span> Mildly Expansionary/Neutral</li>
                <li><span className="text-red-400">0-39:</span> Contractionary (Bearish for Risk Assets)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-orange-400 mb-2">Key Factors:</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• <strong>Reverse Repo Drain:</strong> Money flowing back into markets (bullish)</li>
                <li>• <strong>Low Credit Spreads:</strong> No financial stress (risk-on environment)</li>
                <li>• <strong>Weak Dollar (DXY):</strong> Benefits Bitcoin and risk assets</li>
                <li>• <strong>Fed Balance Sheet:</strong> QE expansion increases liquidity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Attribution */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Data from FRED, Federal Reserve, ECB, BoJ • Updated every 30 seconds • BTC correlation calculated on 90-day rolling window</p>
        </div>
      </div>
    </div>
  )
}