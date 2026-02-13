'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Activity, AlertTriangle } from 'lucide-react'

interface FlowData {
  timestamp: string
  strike: number
  expiry: string
  type: 'call' | 'put'
  volume: number
  premium: number
  unusual_activity: boolean
  sentiment: 'bullish' | 'bearish' | 'neutral'
  dark_pool_activity?: number
  institutional_flow?: boolean
}

interface OptionsFlowProps {
  symbol: string
  className?: string
}

export default function OptionsFlow({ symbol = 'MSTR', className = '' }: OptionsFlowProps) {
  const [flows, setFlows] = useState<FlowData[]>([])
  const [loading, setLoading] = useState(true)
  const [callPutRatio, setCallPutRatio] = useState<number>(0)
  const [unusualActivity, setUnusualActivity] = useState<FlowData[]>([])

  useEffect(() => {
    // Simulate professional options flow data
    // In production, this would connect to real options flow APIs
    const mockFlows: FlowData[] = [
      {
        timestamp: new Date().toISOString(),
        strike: 135,
        expiry: '2024-03-15',
        type: 'call',
        volume: 2500,
        premium: 1250000, // $1.25M premium
        unusual_activity: true,
        sentiment: 'bullish',
        dark_pool_activity: 800000,
        institutional_flow: true
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        strike: 120,
        expiry: '2024-02-16',
        type: 'put',
        volume: 1800,
        premium: 540000, // $540K premium
        unusual_activity: true,
        sentiment: 'bearish',
        institutional_flow: true
      },
      {
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        strike: 150,
        expiry: '2024-04-19',
        type: 'call',
        volume: 3200,
        premium: 2880000, // $2.88M premium
        unusual_activity: true,
        sentiment: 'bullish',
        dark_pool_activity: 1500000,
        institutional_flow: true
      },
      {
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        strike: 140,
        expiry: '2024-03-15',
        type: 'call',
        volume: 950,
        premium: 380000,
        unusual_activity: false,
        sentiment: 'neutral'
      }
    ]

    setFlows(mockFlows)
    
    // Calculate call/put ratio
    const calls = mockFlows.filter(f => f.type === 'call').reduce((sum, f) => sum + f.volume, 0)
    const puts = mockFlows.filter(f => f.type === 'put').reduce((sum, f) => sum + f.volume, 0)
    setCallPutRatio(puts > 0 ? calls / puts : 0)
    
    // Filter unusual activity
    setUnusualActivity(mockFlows.filter(f => f.unusual_activity))
    
    setLoading(false)
  }, [symbol])

  const formatPremium = (premium: number) => {
    if (premium >= 1000000) return `$${(premium / 1000000).toFixed(1)}M`
    if (premium >= 1000) return `$${(premium / 1000).toFixed(0)}K`
    return `$${premium.toLocaleString()}`
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400'
      case 'bearish': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <ArrowUp className="h-4 w-4 text-green-400" />
      case 'bearish': return <ArrowDown className="h-4 w-4 text-red-400" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mstr-500"></div>
          <span className="ml-3 text-gray-400">Loading options flow...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Call/Put Ratio</p>
          <p className={`text-2xl font-bold ${callPutRatio > 1.5 ? 'text-green-400' : callPutRatio < 0.8 ? 'text-red-400' : 'text-gray-300'}`}>
            {callPutRatio.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {callPutRatio > 1.5 ? 'Bullish' : callPutRatio < 0.8 ? 'Bearish' : 'Neutral'}
          </p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Unusual Activity</p>
          <p className="text-2xl font-bold text-bitcoin-500">{unusualActivity.length}</p>
          <p className="text-xs text-gray-500">Large blocks</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Total Premium</p>
          <p className="text-2xl font-bold text-white">
            {formatPremium(flows.reduce((sum, f) => sum + f.premium, 0))}
          </p>
          <p className="text-xs text-gray-500">Last hour</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Institutional %</p>
          <p className="text-2xl font-bold text-mstr-500">
            {Math.round((flows.filter(f => f.institutional_flow).length / flows.length) * 100)}%
          </p>
          <p className="text-xs text-gray-500">Pro money</p>
        </div>
      </div>

      {/* Unusual Activity Alert */}
      {unusualActivity.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/20 to-yellow-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <span className="font-bold text-yellow-400">Unusual Options Activity Detected</span>
          </div>
          <p className="text-gray-300 text-sm">
            {unusualActivity.length} large block trade(s) with institutional characteristics. 
            Total premium: {formatPremium(unusualActivity.reduce((sum, f) => sum + f.premium, 0))}
          </p>
        </div>
      )}

      {/* Live Flow Feed */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Live Options Flow</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Live Feed</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-8 gap-4 text-xs text-gray-400 font-medium pb-2 border-b border-gray-700">
            <span>Time</span>
            <span>Type</span>
            <span>Strike</span>
            <span>Expiry</span>
            <span>Volume</span>
            <span>Premium</span>
            <span>Sentiment</span>
            <span>Flags</span>
          </div>
          
          {flows.map((flow, index) => (
            <div key={index} className={`grid grid-cols-8 gap-4 text-sm p-3 rounded-lg ${
              flow.unusual_activity 
                ? 'bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-yellow-500/30' 
                : 'bg-gray-800/50'
            }`}>
              <span className="text-xs text-gray-400">
                {new Date(flow.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`font-bold uppercase ${flow.type === 'call' ? 'text-green-400' : 'text-red-400'}`}>
                {flow.type}
              </span>
              <span className="font-bold">${flow.strike}</span>
              <span className="text-gray-300">
                {new Date(flow.expiry).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
              <span className="font-bold">{flow.volume.toLocaleString()}</span>
              <span className="font-bold">{formatPremium(flow.premium)}</span>
              <div className="flex items-center space-x-1">
                {getSentimentIcon(flow.sentiment)}
                <span className={`text-xs ${getSentimentColor(flow.sentiment)}`}>
                  {flow.sentiment.toUpperCase()}
                </span>
              </div>
              <div className="flex space-x-1">
                {flow.unusual_activity && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">UOA</span>
                )}
                {flow.institutional_flow && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">INST</span>
                )}
                {flow.dark_pool_activity && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">DP</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-gray-800/30 rounded text-xs text-gray-500">
          <strong>Legend:</strong> UOA = Unusual Options Activity, INST = Institutional Flow, DP = Dark Pool Activity
        </div>
      </div>
    </div>
  )
}