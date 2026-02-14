'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'

interface TechnicalIndicators {
  rsi: {
    value: number
    period: number
    signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL'
  }
  macd: {
    value: number
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    description: string
  }
  institutional_bias: {
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    description: string
  }
}

interface TechnicalData {
  symbol: string
  current_price: number
  price_change_percent: number
  technical_indicators: TechnicalIndicators
  market_sentiment: string
  last_updated: string
  source: string
  timestamp: number
}

export default function MarketIntelligenceLive() {
  const [techData, setTechData] = useState<TechnicalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchTechnicalIndicators = async () => {
    try {
      setUpdating(true)
      console.log('🔴 FETCHING LIVE TECHNICAL INDICATORS...')
      
      const response = await fetch('/api/v1/live/technical-indicators', { 
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      const data = await response.json()
      console.log('✅ Technical indicators data:', data)
      
      setTechData(data)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching technical indicators:', error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchTechnicalIndicators()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTechnicalIndicators()
    }, 5000) // Update every 5 seconds - Josh's preference!

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-400">Loading market intelligence...</span>
        </div>
      </div>
    )
  }

  if (!techData) {
    return (
      <div className="card">
        <div className="text-center p-8">
          <p className="text-slate-400">Market intelligence data unavailable</p>
        </div>
      </div>
    )
  }

  const getRSIColor = (value: number) => {
    if (value >= 70) return 'text-red-400' // Overbought
    if (value <= 30) return 'text-green-400' // Oversold
    return 'text-yellow-400' // Neutral
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BULLISH':
      case 'STRONG_BULLISH':
        return 'text-green-400'
      case 'BEARISH':
      case 'STRONG_BEARISH':
        return 'text-red-400'
      case 'NEUTRAL':
      default:
        return 'text-yellow-400'
    }
  }

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BULLISH':
      case 'STRONG_BULLISH':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'BEARISH':
      case 'STRONG_BEARISH':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      case 'NEUTRAL':
      default:
        return <Activity className="h-4 w-4 text-yellow-400" />
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-orange-400">Market Intelligence</h3>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${updating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-xs text-slate-400">
            100% Live Data • Last: {new Date(techData.last_updated).toLocaleTimeString()}
          </span>
          {updating && <RefreshCw className="h-4 w-4 animate-spin text-orange-400" />}
        </div>
      </div>

      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* RSI Indicator */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="text-slate-400">RSI ({techData.technical_indicators.rsi.period})</div>
            {getSignalIcon(techData.technical_indicators.rsi.signal)}
          </div>
          <div className={`text-2xl font-bold ${getRSIColor(techData.technical_indicators.rsi.value)}`}>
            {techData.technical_indicators.rsi.value}
          </div>
        </div>

        {/* MACD Signal */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="text-slate-400">MACD Signal</div>
            {getSignalIcon(techData.technical_indicators.macd.signal)}
          </div>
          <div className={`text-2xl font-bold ${getSignalColor(techData.technical_indicators.macd.signal)}`}>
            {techData.technical_indicators.macd.signal}
          </div>
        </div>

        {/* Institutional Bias */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="text-slate-400">Institutional Bias</div>
            {getSignalIcon(techData.technical_indicators.institutional_bias.signal)}
          </div>
          <div className={`text-2xl font-bold ${getSignalColor(techData.technical_indicators.institutional_bias.signal)}`}>
            {techData.technical_indicators.institutional_bias.signal}
          </div>
        </div>
      </div>

      {/* Additional Context */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">MACD Value:</span>
            <span className="ml-2 text-slate-300">{techData.technical_indicators.macd.value}</span>
          </div>
          <div>
            <span className="text-slate-400">Overall Sentiment:</span>
            <span className={`ml-2 font-bold ${getSignalColor(techData.market_sentiment)}`}>
              {techData.market_sentiment.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-slate-400">RSI Signal:</span>
            <span className={`ml-2 ${getRSIColor(techData.technical_indicators.rsi.value)}`}>
              {techData.technical_indicators.rsi.signal}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Last Updated:</span>
            <span className="ml-2 text-slate-300">{new Date(techData.last_updated).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Descriptions */}
      <div className="mt-4 text-xs text-slate-500">
        <div className="mb-1">
          <strong>MACD:</strong> {techData.technical_indicators.macd.description}
        </div>
        <div>
          <strong>Institutional:</strong> {techData.technical_indicators.institutional_bias.description}
        </div>
      </div>
    </div>
  )
}