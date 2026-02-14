'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { VolumeChart } from '../../components/VolumeChart'
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, Percent } from 'lucide-react'

interface PreferredStock {
  symbol: string
  price: number
  volume: number
  change: number
  change_percent: number
  dividend_yield: number
  timestamp: string
  source: string
}

interface PreferredsData {
  preferreds: { [key: string]: PreferredStock }
  summary: {
    total_symbols: number
    total_volume: number
    average_dividend_yield: number
    last_updated: string
  }
  data_quality: string
}

export default function MSTRPreferreds() {
  const [preferredsData, setPreferredsData] = useState<PreferredsData | null>(null)
  const [navData, setNavData] = useState<any>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('STRC')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferreds data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [preferredsResponse, navResponse] = await Promise.all([
          fetch('/api/v1/live/preferreds'),
          fetch('/api/v1/live/nav')
        ])

        if (preferredsResponse.ok) {
          const preferredsData = await preferredsResponse.json()
          setPreferredsData(preferredsData)
        }

        if (navResponse.ok) {
          const navData = await navResponse.json()
          setNavData(navData)
        }

        setError(null)
      } catch (err) {
        console.log('Failed to fetch preferreds data:', err)
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Format volume with appropriate suffix
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

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading MSTR Preferreds data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center text-red-400">
              <p className="text-lg font-semibold mb-2">Unable to load data</p>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const preferreds = preferredsData?.preferreds || {}
  const preferredsList = Object.entries(preferreds)

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold">MSTR Preferred Securities</h1>
        </div>
        <p className="text-slate-400 text-lg">
          Advanced volume analysis and trading intelligence for MicroStrategy preferred stocks
        </p>
      </div>

      {/* Summary Cards */}
      {preferredsData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {formatVolume(preferredsData.summary.total_volume)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Securities</p>
                  <p className="text-2xl font-bold text-white">
                    {preferredsData.summary.total_symbols}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Avg Dividend</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {preferredsData.summary.average_dividend_yield.toFixed(2)}%
                  </p>
                </div>
                <Percent className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">NAV Premium</p>
                  <p className={`text-2xl font-bold ${navData?.nav_premium_discount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {navData?.nav_premium_discount >= 0 ? '+' : ''}{navData?.nav_premium_discount.toFixed(1)}%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preferreds Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {preferredsList.map(([symbol, data]) => (
          <div 
            key={symbol}
            className="cursor-pointer transition-all"
            onClick={() => setSelectedSymbol(symbol)}
          >
            <Card className={`bg-slate-800 border-slate-700 ${
              selectedSymbol === symbol ? 'ring-2 ring-blue-400' : 'hover:bg-slate-750'
            }`}>
            <CardContent className="pt-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-1">{symbol}</h3>
                <p className="text-2xl font-bold text-blue-400 mb-2">
                  ${data.price.toFixed(2)}
                </p>
                <div className={`text-sm ${getChangeColor(data.change_percent)} mb-2`}>
                  {data.change_percent >= 0 ? (
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 inline mr-1" />
                  )}
                  {formatPercent(data.change_percent)}
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span className="text-white font-medium">{formatVolume(data.volume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yield:</span>
                    <span className="text-orange-400 font-medium">{data.dividend_yield.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>

      {/* Advanced Volume Chart */}
      {selectedSymbol && preferreds[selectedSymbol] && (
        <div className="mb-8">
          <VolumeChart
            symbol={selectedSymbol}
            currentVolume={preferreds[selectedSymbol].volume}
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
        </div>
      )}

      {/* Detailed Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
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
                {preferredsList.map(([symbol, data]) => (
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
                      ${data.price.toFixed(2)}
                    </td>
                    <td className={`py-4 text-right font-medium ${getChangeColor(data.change_percent)}`}>
                      <div className="flex items-center justify-end space-x-1">
                        {data.change_percent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{formatPercent(data.change_percent)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-white">
                      {formatVolume(data.volume)}
                    </td>
                    <td className="py-4 text-right font-medium text-orange-400">
                      {data.dividend_yield.toFixed(2)}%
                    </td>
                    <td className="py-4 text-center">
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                        {data.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Info */}
      {preferredsData?.data_quality && (
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Data Quality: {preferredsData.data_quality} • Last Updated: {new Date(preferredsData.summary.last_updated).toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}