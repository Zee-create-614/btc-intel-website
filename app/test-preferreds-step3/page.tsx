'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'

export default function TestPreferredsStep3() {
  const [data, setData] = useState<any>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('STRC')
  const [loading, setLoading] = useState(true)

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
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Step 3: Testing Detailed Table</h1>
        <div className="animate-pulse bg-slate-700 h-8 rounded"></div>
      </div>
    )
  }

  const preferreds = data?.preferreds || {}
  const preferredsList = Object.entries(preferreds).filter(([symbol, data]) => symbol && data)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Step 3: Testing Detailed Table</h1>
      
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <p className="text-green-400">🧪 Testing the exact detailed table logic from main component</p>
      </div>

      {/* EXACT DETAILED TABLE FROM MAIN COMPONENT */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
        </div>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Symbol</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Price</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Change</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Volume</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Dividend</th>
                  <th className="text-center py-3 text-slate-400 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {preferredsList.length > 0 ? preferredsList.map(([symbol, stockData]) => (
                  <tr 
                    key={symbol}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/50 cursor-pointer ${
                      selectedSymbol === symbol ? 'bg-blue-600/20' : ''
                    }`}
                    onClick={() => setSelectedSymbol(symbol)}
                  >
                    <td className="py-4 font-medium text-white">
                      <div className="flex items-center space-x-2">
                        <span>{symbol}</span>
                        {selectedSymbol === symbol && <Target className="h-4 w-4 text-blue-400" />}
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-blue-400">
                      ${stockData?.price ? stockData.price.toFixed(2) : 'N/A'}
                    </td>
                    <td className={`py-4 text-right font-medium ${getChangeColor(stockData?.change_percent)}`}>
                      <div className="flex items-center justify-end space-x-1">
                        {(stockData?.change_percent || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{formatPercent(stockData?.change_percent)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-white">
                      {formatVolume(stockData?.volume)}
                    </td>
                    <td className="py-4 text-right font-medium text-orange-400">
                      {stockData?.dividend_yield ? stockData.dividend_yield.toFixed(2) : 'N/A'}%
                    </td>
                    <td className="py-4 text-center">
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                        {stockData?.source || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No preferred securities data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-400">🧪 Step 3 Complete - Detailed table tested</p>
        <p className="text-slate-300 text-sm">Selected: {selectedSymbol}</p>
      </div>
    </div>
  )
}