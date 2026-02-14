'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface VolumeData {
  timestamp: string
  volume: number
  price: number
}

interface VolumeChartProps {
  symbol: string
  currentVolume: number
  timeframe: string
  onTimeframeChange: (period: string) => void
}

const timeframeOptions = [
  { value: 'live', label: 'Live' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '3m', label: '3M' },
  { value: 'ytd', label: 'YTD' },
  { value: '1y', label: '1Y' },
  { value: '5y', label: '5Y' },
  { value: 'max', label: 'MAX' }
]

export function VolumeChart({ symbol, currentVolume, timeframe, onTimeframeChange }: VolumeChartProps) {
  const [volumeHistory, setVolumeHistory] = useState<VolumeData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Format volume with appropriate suffix (M/B)
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(1)}M`
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(0)}K`
    } else {
      return `$${volume.toFixed(0)}`
    }
  }

  // Fetch volume data for selected timeframe
  useEffect(() => {
    const fetchVolumeData = async () => {
      if (timeframe === 'live') return // Live data comes from props
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/v1/mstr/preferreds/volume-history?symbol=${symbol}&period=${timeframe}`)
        if (response.ok) {
          const data = await response.json()
          setVolumeHistory(data.volume_history || [])
        }
      } catch (error) {
        console.log(`Volume history fetch failed for ${symbol}:`, error)
        // Generate mock historical data for now
        setVolumeHistory(generateMockVolumeData(timeframe))
      } finally {
        setIsLoading(false)
      }
    }

    fetchVolumeData()
  }, [symbol, timeframe])

  // Generate mock historical data
  const generateMockVolumeData = (period: string): VolumeData[] => {
    const now = new Date()
    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : period === '3m' ? 90 : period === '1y' ? 365 : 1825
    const data: VolumeData[] = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      const baseVolume = currentVolume * (0.7 + Math.random() * 0.6) // ±30% variation
      data.push({
        timestamp: date.toISOString(),
        volume: Math.floor(baseVolume),
        price: 25 + (Math.random() * 10) // Mock price between $25-$35
      })
    }
    return data
  }

  // Calculate volume statistics
  const calculateVolumeStats = () => {
    if (volumeHistory.length === 0) {
      return {
        avgVolume: currentVolume,
        maxVolume: currentVolume,
        minVolume: currentVolume,
        trend: 0
      }
    }

    const volumes = volumeHistory.map(d => d.volume)
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
    const maxVolume = Math.max(...volumes)
    const minVolume = Math.min(...volumes)
    
    // Calculate trend (last vs first)
    const trend = volumes.length > 1 ? 
      ((volumes[volumes.length - 1] - volumes[0]) / volumes[0]) * 100 : 0

    return { avgVolume, maxVolume, minVolume, trend }
  }

  const stats = calculateVolumeStats()

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            {symbol} Volume Analysis
          </CardTitle>
          <Activity className="h-5 w-5 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeframe Selector */}
        <div className="flex flex-wrap gap-1 mb-6">
          {timeframeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onTimeframeChange(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                timeframe === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Volume Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Current</p>
            <p className="text-sm font-bold text-white">{formatVolume(currentVolume)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Average</p>
            <p className="text-sm font-bold text-orange-400">{formatVolume(stats.avgVolume)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Peak</p>
            <p className="text-sm font-bold text-green-400">{formatVolume(stats.maxVolume)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Trend</p>
            <div className="flex items-center justify-center space-x-1">
              {stats.trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400" />
              )}
              <p className={`text-sm font-bold ${stats.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(stats.trend).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Simple Volume Bar Chart */}
        {timeframe !== 'live' && volumeHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              Volume History ({timeframe.toUpperCase()})
            </h4>
            <div className="h-32 flex items-end space-x-1">
              {volumeHistory.slice(-20).map((data, index) => {
                const height = (data.volume / stats.maxVolume) * 100
                return (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500/60 hover:bg-blue-400 transition-colors rounded-sm"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${new Date(data.timestamp).toLocaleDateString()}: ${formatVolume(data.volume)}`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>
                {new Date(volumeHistory[0]?.timestamp).toLocaleDateString()}
              </span>
              <span>
                {new Date(volumeHistory[volumeHistory.length - 1]?.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {timeframe === 'live' && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-blue-400 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-400 text-sm">Live volume data</p>
            <p className="text-xs text-slate-500 mt-1">Updates every 10 seconds</p>
          </div>
        )}

        {isLoading && timeframe !== 'live' && (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">Loading volume data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}