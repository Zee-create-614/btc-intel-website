'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Activity, Volume2, Zap } from 'lucide-react'
import { getMSTRvsSTRCComparison, formatSTRCPrice, formatSTRCMarketCap, getYieldColor } from '../lib/real-strc-data'

// Quick format functions for the component
function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
  if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`
  return volume?.toLocaleString() || '0'
}

function getVolumeColor(current: number, average: number): string {
  const ratio = current / average
  if (ratio > 1.5) return 'text-red-400'
  if (ratio > 1.2) return 'text-yellow-400'
  return 'text-green-400'
}

function getVolatilityColor(volatility: number): string {
  if (volatility > 40) return 'text-red-400'
  if (volatility > 25) return 'text-yellow-400'
  return 'text-green-400'
}
import { formatCurrency, formatNumber, formatPercent } from '../lib/data'

export default function DualTickerComparison() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '7d' | '30d'>('1d')

  useEffect(() => {
    async function fetchData() {
      try {
        const comparisonData = await getMSTRvsSTRCComparison()
        setData(comparisonData)
      } catch (error) {
        console.error('Error fetching dual ticker data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Update every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mstr-500"></div>
          <span className="ml-3 text-gray-400">Loading STRC comparison...</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { mstr, strc, comparison } = data
  
  const getPerformanceIcon = (performer: string, ticker: 'MSTR' | 'STRC') => {
    if (performer === ticker) return <TrendingUp className="h-4 w-4 text-green-400" />
    if (performer === 'tie') return <Activity className="h-4 w-4 text-yellow-400" />
    return <TrendingDown className="h-4 w-4 text-red-400" />
  }

  const getPerformanceColor = (performer: string, ticker: 'MSTR' | 'STRC') => {
    if (performer === ticker) return 'text-green-400'
    if (performer === 'tie') return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">MSTR vs STRC Comparison</h2>
          <p className="text-gray-400">Bitcoin treasury stock vs preferred stock dividend play analysis</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">Live Data</span>
        </div>
      </div>

      {/* Side-by-Side Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MSTR Card */}
        <div className="bg-gradient-to-br from-mstr-500/20 to-orange-500/10 border border-mstr-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mstr-500 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-sm">MSTR</span>
              </div>
              <div>
                <h3 className="font-bold text-white">MicroStrategy</h3>
                <p className="text-sm text-gray-400">Bitcoin Treasury Leader</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-mstr-500">${mstr.price?.toFixed(2)}</p>
              <p className="text-sm text-gray-400">
                Vol: {formatVolume(mstr.volume || 0)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Market Cap</p>
              <p className="font-bold text-white">{formatCurrency(mstr.market_cap || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">BTC Holdings</p>
              <p className="font-bold text-bitcoin-500">190,000 BTC</p>
            </div>
          </div>
        </div>

        {/* STRC Card */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-sm">STRC</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Strategy Preferred</h3>
                <p className="text-sm text-gray-400">Variable Rate Perpetual</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400">${strc.price?.toFixed(2)}</p>
              <p className="text-sm text-gray-400">
                Vol: {formatVolume(strc.volume)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Market Cap</p>
              <p className="font-bold text-white">{formatSTRCMarketCap(strc.market_cap)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Dividend Yield</p>
              <p className={`font-bold ${getYieldColor(strc.dividend_yield || 0)}`}>{(strc.dividend_yield || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* STRC Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <Volume2 className="h-8 w-8 text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Daily Volume</p>
          <p className="text-xl font-bold text-white">{formatVolume(strc.volume)}</p>
          <p className={`text-xs ${getVolumeColor(strc.volume, strc.daily_volume_avg_30d)}`}>
            vs 30D avg: {formatVolume(strc.daily_volume_avg_30d)}
          </p>
          {strc.unusual_volume_detected && (
            <div className="flex items-center justify-center mt-1">
              <Zap className="h-3 w-3 text-yellow-400 mr-1" />
              <span className="text-xs text-yellow-400">Unusual Activity</span>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <BarChart3 className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Volatility (Low)</p>
          <p className={`text-xl font-bold ${getVolatilityColor(strc.volatility_30d || 2.1)}`}>
            {(strc.volatility_30d || 2.1).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">
            Preferred Stock Stability
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Current Yield</p>
          <p className={`text-xl font-bold ${getYieldColor(strc.current_yield || 6.2)}`}>
            {(strc.current_yield || 6.2).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">
            Variable Rate Dividend
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Price to Par</p>
          <p className={`text-xl font-bold ${
            (strc.price_to_par_ratio || 0.998) > 1.02 ? 'text-red-400' : 
            (strc.price_to_par_ratio || 0.998) > 0.98 ? 'text-green-400' : 
            'text-yellow-400'
          }`}>
            {((strc.price_to_par_ratio || 0.998) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">
            Par: $100.00
          </p>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6">Performance Comparison</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Timeframe Performance */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-300">Relative Performance</h4>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-sm">1 Day</span>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${getPerformanceColor(comparison.better_performer_1d, 'MSTR')}`}>
                  MSTR
                </span>
                {getPerformanceIcon(comparison.better_performer_1d, 'MSTR')}
                <span className="text-gray-500">vs</span>
                {getPerformanceIcon(comparison.better_performer_1d, 'STRC')}
                <span className={`font-bold ${getPerformanceColor(comparison.better_performer_1d, 'STRC')}`}>
                  STRC
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-sm">7 Days</span>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${getPerformanceColor(comparison.better_performer_7d, 'MSTR')}`}>
                  MSTR
                </span>
                {getPerformanceIcon(comparison.better_performer_7d, 'MSTR')}
                <span className="text-gray-500">vs</span>
                {getPerformanceIcon(comparison.better_performer_7d, 'STRC')}
                <span className={`font-bold ${getPerformanceColor(comparison.better_performer_7d, 'STRC')}`}>
                  STRC
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span className="text-sm">30 Days</span>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${getPerformanceColor(comparison.better_performer_30d, 'MSTR')}`}>
                  MSTR
                </span>
                {getPerformanceIcon(comparison.better_performer_30d, 'MSTR')}
                <span className="text-gray-500">vs</span>
                {getPerformanceIcon(comparison.better_performer_30d, 'STRC')}
                <span className={`font-bold ${getPerformanceColor(comparison.better_performer_30d, 'STRC')}`}>
                  STRC
                </span>
              </div>
            </div>
          </div>

          {/* Correlation Analysis */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-300">Correlation Analysis</h4>
            
            <div className="p-4 bg-gray-800 rounded text-center">
              <p className="text-2xl font-bold text-bitcoin-500">
                {(comparison.price_correlation * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-400">Price Correlation</p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.price_correlation > 0.8 ? 'Highly Correlated' : 
                 comparison.price_correlation > 0.6 ? 'Moderately Correlated' : 
                 'Low Correlation'}
              </p>
            </div>
            
            <div className="p-3 bg-gray-800 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Volume Ratio</span>
                <span className="font-bold text-white">
                  {comparison.volume_ratio.toFixed(1)}x
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                MSTR trades {comparison.volume_ratio.toFixed(1)}x more volume than STRC
              </p>
            </div>
            
            <div className="p-3 bg-gray-800 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Market Cap Ratio</span>
                <span className="font-bold text-white">
                  {comparison.market_cap_ratio.toFixed(1)}x
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                MSTR is {comparison.market_cap_ratio.toFixed(1)}x larger than STRC
              </p>
            </div>
          </div>

          {/* Volatility Comparison */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-300">Risk Analysis</h4>
            
            <div className="p-3 bg-gray-800 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Volatility Leader</span>
                <span className={`font-bold ${
                  comparison.volatility_comparison === 'strc_higher' ? 'text-blue-400' : 'text-mstr-500'
                }`}>
                  {comparison.volatility_comparison === 'strc_higher' ? 'STRC' : 'MSTR'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">MSTR 30D Vol:</span>
                  <span className="text-mstr-500">~35%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">STRC 30D Vol:</span>
                  <span className="text-blue-400">{strc.volatility_30d.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-800 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">STRC Beta to BTC</span>
                <span className="font-bold text-bitcoin-500">
                  {strc.beta_to_btc.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {strc.beta_to_btc > 1.5 ? 'High Beta' : strc.beta_to_btc > 1 ? 'Medium Beta' : 'Low Beta'} to Bitcoin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}