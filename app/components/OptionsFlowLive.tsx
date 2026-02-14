'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'

interface OptionsFlow {
  time: string
  strike: number
  expiry: string
  type: 'CALL' | 'PUT'
  volume: number
  open_interest: number
  premium: number
  direction: 'BUY' | 'SELL'
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE'
  unusual: boolean
}

interface OptionsFlowData {
  symbol: string
  flow_data: OptionsFlow[]
  summary: {
    total_call_volume: number
    total_put_volume: number
    call_put_ratio: number
    unusual_activity_count: number
    dominant_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
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
    }, 10000) // Update every 10 seconds

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

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'XLARGE': return 'text-red-400 font-bold'
      case 'LARGE': return 'text-orange-400 font-semibold'
      case 'MEDIUM': return 'text-yellow-400'
      case 'SMALL': return 'text-slate-400'
      default: return 'text-slate-400'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'text-green-400'
      case 'BEARISH': return 'text-red-400'
      case 'NEUTRAL': return 'text-slate-400'
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Call Volume</span>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-xl font-bold text-green-400 mt-1">
            {optionsData.summary.total_call_volume.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Put Volume</span>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400 mt-1">
            {optionsData.summary.total_put_volume.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Call/Put Ratio</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {optionsData.summary.call_put_ratio.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Sentiment</span>
            <div className={`w-3 h-3 rounded-full ${optionsData.summary.dominant_sentiment === 'BULLISH' ? 'bg-green-500' : 
              optionsData.summary.dominant_sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
          </div>
          <div className={`text-xl font-bold mt-1 ${getSentimentColor(optionsData.summary.dominant_sentiment)}`}>
            {optionsData.summary.dominant_sentiment}
          </div>
        </div>
      </div>

      {/* Options Flow Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-3 text-slate-400">Time</th>
              <th className="text-left p-3 text-slate-400">Strike</th>
              <th className="text-left p-3 text-slate-400">Type</th>
              <th className="text-left p-3 text-slate-400">Volume</th>
              <th className="text-left p-3 text-slate-400">Premium</th>
              <th className="text-left p-3 text-slate-400">Direction</th>
              <th className="text-left p-3 text-slate-400">Size</th>
              <th className="text-left p-3 text-slate-400">Unusual</th>
            </tr>
          </thead>
          <tbody>
            {optionsData.flow_data.slice(0, 10).map((flow, index) => (
              <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="p-3 text-slate-300">
                  {new Date(flow.time).toLocaleTimeString()}
                </td>
                <td className="p-3 font-mono text-white">
                  ${flow.strike}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    flow.type === 'CALL' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {flow.type}
                  </span>
                </td>
                <td className="p-3 text-slate-300">
                  {flow.volume.toLocaleString()}
                </td>
                <td className="p-3 font-mono text-slate-300">
                  ${flow.premium.toFixed(2)}
                </td>
                <td className="p-3">
                  <span className={`font-bold ${flow.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {flow.direction}
                  </span>
                </td>
                <td className={`p-3 font-bold ${getSizeColor(flow.size)}`}>
                  {flow.size}
                </td>
                <td className="p-3">
                  {flow.unusual && (
                    <span className="bg-orange-900/30 text-orange-400 px-2 py-1 rounded text-xs font-bold">
                      UNUSUAL
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {optionsData.flow_data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No options flow data available</p>
        </div>
      )}
    </div>
  )
}