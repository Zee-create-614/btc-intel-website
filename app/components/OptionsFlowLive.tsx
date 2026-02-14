'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'

interface OptionsChainItem {
  type: 'CALL' | 'PUT'
  strike: number
  volume: number
  delta: number
  gamma: number
  theta: number
  vega: number
  impliedVolatility: number
  openInterest: number
}

interface OptionsFlowData {
  symbol: string
  current_price: number
  options_chain: OptionsChainItem[]
  greeks_summary: {
    avg_call_delta: number
    avg_put_delta: number
    total_call_volume: number
    total_put_volume: number
    call_put_ratio: number
    dominant_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  }
  market_data: {
    implied_volatility: number
    risk_free_rate: number
    time_to_expiration: number
    expiration_date: string
  }
  last_updated: string
  source: string
  timestamp: number
}

export default function OptionsFlowLive() {
  const [optionsData, setOptionsData] = useState<OptionsFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOptionsFlow = async () => {
    try {
      setUpdating(true)
      console.log('🔴 FETCHING LIVE OPTIONS FLOW...')
      
      const response = await fetch('/api/v1/live/options-flow', { 
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      const data = await response.json()
      console.log('✅ Options flow data:', data)
      
      setOptionsData(data)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching options flow:', error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchOptionsFlow()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOptionsFlow()
    }, 5000) // Update every 5 seconds - Josh's preference!

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-400">Loading options flow...</span>
        </div>
      </div>
    )
  }

  if (!optionsData) {
    return (
      <div className="card">
        <div className="text-center p-8">
          <p className="text-slate-400">Options flow data unavailable</p>
        </div>
      </div>
    )
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'text-green-400'
      case 'BEARISH': return 'text-red-400'
      case 'NEUTRAL': return 'text-yellow-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Live MSTR Options Flow</h3>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${updating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-xs text-slate-400">
            Source: {optionsData.source} • Last: {new Date(optionsData.last_updated).toLocaleTimeString()}
          </span>
          {updating && <RefreshCw className="h-4 w-4 animate-spin text-orange-400" />}
        </div>
      </div>

      {/* Real Options Greeks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Avg Call Delta</span>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            {optionsData.greeks_summary.avg_call_delta.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Avg Put Delta</span>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {optionsData.greeks_summary.avg_put_delta.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Call Volume</span>
            <Activity className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-xl font-bold text-green-400 mt-1">
            {optionsData.greeks_summary.total_call_volume.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Put Volume</span>
            <Activity className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400 mt-1">
            {optionsData.greeks_summary.total_put_volume.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Options Chain Date Header */}
      <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-white">Options Chain</h4>
          <span className="text-sm text-slate-400">{optionsData.market_data.expiration_date}</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm mt-2">
          <div>
            <span className="text-slate-400">Current Price:</span>
            <span className="ml-2 text-white font-mono">${optionsData.current_price}</span>
          </div>
          <div>
            <span className="text-slate-400">IV:</span>
            <span className="ml-2 text-white font-mono">{(optionsData.market_data.implied_volatility * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400">Call/Put Ratio:</span>
            <span className="ml-2 text-white font-mono">{optionsData.greeks_summary.call_put_ratio}</span>
          </div>
        </div>
      </div>

      {/* Live Options Chain Table with Real Greeks */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-3 text-slate-400">Strike</th>
              <th className="text-left p-3 text-slate-400">Type</th>
              <th className="text-left p-3 text-slate-400">Volume</th>
              <th className="text-left p-3 text-slate-400">Delta</th>
              <th className="text-left p-3 text-slate-400">Gamma</th>
              <th className="text-left p-3 text-slate-400">Theta</th>
              <th className="text-left p-3 text-slate-400">Vega</th>
              <th className="text-left p-3 text-slate-400">IV</th>
              <th className="text-left p-3 text-slate-400">OI</th>
            </tr>
          </thead>
          <tbody>
            {optionsData.options_chain.slice(0, 16).map((option, index) => (
              <tr key={index} className={`border-b border-slate-800 hover:bg-slate-800/30 ${
                Math.abs(option.strike - optionsData.current_price) <= 10 ? 'bg-slate-700/20' : ''
              }`}>
                <td className="p-3 font-mono text-white font-bold">
                  ${option.strike}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    option.type === 'CALL' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {option.type}
                  </span>
                </td>
                <td className="p-3 text-slate-300 font-mono">
                  {option.volume.toLocaleString()}
                </td>
                <td className={`p-3 font-mono font-bold ${
                  option.delta >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {option.delta.toFixed(2)}
                </td>
                <td className="p-3 font-mono text-blue-400">
                  {option.gamma.toFixed(4)}
                </td>
                <td className={`p-3 font-mono ${
                  option.theta < 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {option.theta.toFixed(2)}
                </td>
                <td className="p-3 font-mono text-purple-400">
                  {option.vega.toFixed(2)}
                </td>
                <td className="p-3 font-mono text-yellow-400">
                  {(option.impliedVolatility * 100).toFixed(0)}%
                </td>
                <td className="p-3 text-slate-300 font-mono">
                  {option.openInterest.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {optionsData.options_chain.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">Loading options chain data...</p>
        </div>
      )}

      {/* Greeks Explanation */}
      <div className="mt-6 p-4 bg-slate-700/20 rounded-lg text-xs text-slate-500">
        <h5 className="font-bold text-slate-400 mb-2">Greeks Explanation:</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div><strong className="text-green-400">Delta:</strong> Price sensitivity to underlying movement</div>
          <div><strong className="text-blue-400">Gamma:</strong> Rate of change in delta</div>
          <div><strong className="text-red-400">Theta:</strong> Daily time decay</div>
          <div><strong className="text-purple-400">Vega:</strong> Sensitivity to implied volatility</div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-slate-400">Data calculated using Black-Scholes model with live MSTR price: </span>
          <span className="text-white font-mono">${optionsData.current_price}</span>
        </div>
      </div>
    </div>
  )
}