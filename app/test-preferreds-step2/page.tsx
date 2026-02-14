'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, Percent } from 'lucide-react'

export default function TestPreferredsStep2() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Safe formatting functions - exact copies from main component
  const formatVolume = (volume: number | null | undefined) => {
    if (!volume && volume !== 0) return '$0'
    const vol = Number(volume)
    if (isNaN(vol)) return '$0'
    
    if (vol >= 1e9) {
      return `$${(vol / 1e9).toFixed(2)}B`
    } else if (vol >= 1e6) {
      return `$${(vol / 1e6).toFixed(1)}M`
    } else if (vol >= 1e3) {
      return `$${(vol / 1e3).toFixed(0)}K`
    } else {
      return `$${vol.toFixed(0)}`
    }
  }

  const formatPercent = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined) return 'N/A'
    const pct = Number(percent)
    if (isNaN(pct)) return 'N/A'
    
    const sign = pct >= 0 ? '+' : ''
    return `${sign}${pct.toFixed(2)}%`
  }

  const getChangeColor = (change: number | null | undefined) => {
    if (change === null || change === undefined) return 'text-slate-400'
    const chg = Number(change)
    if (isNaN(chg)) return 'text-slate-400'
    return chg >= 0 ? 'text-green-400' : 'text-red-400'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/live/preferreds')
        if (response.ok) {
          const apiData = await response.json()
          setData(apiData)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
        setError(null)
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Step 2: Testing Component Logic</h1>
        <div className="animate-pulse bg-slate-700 h-8 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Step 2: Error</h1>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </div>
    )
  }

  // Test the exact data processing logic from main component
  const preferreds = data?.preferreds || {}
  const preferredsList = Object.entries(preferreds).filter(([symbol, data]) => symbol && data)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Step 2: Testing Component Logic</h1>
      
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <p className="text-green-400">✅ API Data Retrieved Successfully</p>
        <p className="text-slate-300">Found {preferredsList.length} preferred securities</p>
      </div>

      {/* Test Summary Cards - exact logic from main component */}
      {data?.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Testing Summary Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="pt-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Volume</p>
                    <p className="text-2xl font-bold text-white">
                      {formatVolume(data.summary?.total_volume || 0)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="pt-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Securities</p>
                    <p className="text-2xl font-bold text-white">
                      {data.summary?.total_symbols || 0}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="pt-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Avg Dividend</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {data.summary?.average_dividend_yield ? 
                        data.summary.average_dividend_yield.toFixed(2) : 'N/A'}%
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="pt-4 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Test Status</p>
                    <p className="text-2xl font-bold text-green-400">✅ OK</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Test Overview Cards - exact logic from main component */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Testing Overview Cards</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {preferredsList.length > 0 ? preferredsList.map(([symbol, stockData]) => (
            <div key={symbol} className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="pt-4 p-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-1">{symbol}</h3>
                  <p className="text-2xl font-bold text-blue-400 mb-2">
                    ${stockData?.price ? stockData.price.toFixed(2) : 'N/A'}
                  </p>
                  <div className={`text-sm ${getChangeColor(stockData?.change_percent)} mb-2`}>
                    {(stockData?.change_percent || 0) >= 0 ? (
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 inline mr-1" />
                    )}
                    {formatPercent(stockData?.change_percent)}
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Volume:</span>
                      <span className="text-white font-medium">{formatVolume(stockData?.volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yield:</span>
                      <span className="text-orange-400 font-medium">
                        {stockData?.dividend_yield ? stockData.dividend_yield.toFixed(2) : 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-4 text-center py-8">
              <p className="text-slate-400">No preferred securities data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-400">🧪 Step 2 Complete - Component logic tested</p>
        <p className="text-slate-300 text-sm">If you see this, the complex rendering logic is working!</p>
      </div>
    </div>
  )
}