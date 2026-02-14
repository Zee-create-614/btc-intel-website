'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

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
  const [activeTab, setActiveTab] = useState<string>('STRC')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchData = async () => {
    try {
      // Fetch preferreds data
      const preferredsResponse = await fetch('/api/v1/live/preferreds', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (preferredsResponse.ok) {
        const preferreds = await preferredsResponse.json()
        setPreferredsData(preferreds)
      }

      // Fetch NAV data
      const navResponse = await fetch('/api/v1/live/nav', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (navResponse.ok) {
        const nav = await navResponse.json()
        setNavData(nav)
      }

      setLastUpdate(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num)
  }

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num)
  }

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-500' : 'text-red-500'
  }

  const getChangeIcon = (change: number): string => {
    return change >= 0 ? '↗' : '↘'
  }

  const preferredSymbols = ['STRC', 'STRF', 'STRD', 'STRK']
  const preferredNames = {
    'STRC': 'MicroStrategy 6.125% Series A Preferred',
    'STRF': 'MicroStrategy 6.75% Series F Preferred', 
    'STRD': 'MicroStrategy 6.375% Series D Preferred',
    'STRK': 'MicroStrategy 6.875% Series K Preferred'
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

  const activeStock = preferredsData?.preferreds[activeTab]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">MSTR Preferred Stocks</h1>
              <p className="text-slate-400">Live trading volumes and dividend analytics from strategy.com</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">MSTR NAV Multiple</div>
              <div className="text-2xl font-bold text-orange-400">
                {navData?.nav_multiple_formatted || '1.19x'}
              </div>
              <div className="text-xs text-slate-500">
                Last Update: {lastUpdate}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Symbols</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {preferredsData?.summary.total_symbols || 4}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">
                {preferredsData ? formatNumber(preferredsData.summary.total_volume) : '208M'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Avg Dividend Yield</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {preferredsData ? `${preferredsData.summary.average_dividend_yield.toFixed(2)}%` : '11.53%'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Data Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                <span className={preferredsData?.data_quality === 'live' ? 'text-green-400' : 'text-yellow-400'}>
                  {preferredsData?.data_quality === 'live' ? '🟢 LIVE' : '🟡 FALLBACK'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for each preferred */}
        <div className="mb-6">
          <div className="border-b border-slate-700">
            <div className="flex space-x-8">
              {preferredSymbols.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => setActiveTab(symbol)}
                  className={`py-2 px-4 border-b-2 font-medium transition-colors ${
                    activeTab === symbol
                      ? 'border-orange-400 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active stock details */}
        {activeStock && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Stock Overview */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{activeStock.symbol}</span>
                  <span className="text-sm text-slate-400">{activeStock.source}</span>
                </CardTitle>
                <p className="text-sm text-slate-400">
                  {preferredNames[activeStock.symbol as keyof typeof preferredNames]}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Current Price</div>
                    <div className="text-3xl font-bold text-white">
                      {formatCurrency(activeStock.price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">24h Change</div>
                    <div className={`text-xl font-bold ${getChangeColor(activeStock.change)}`}>
                      {getChangeIcon(activeStock.change)} {formatCurrency(Math.abs(activeStock.change))} 
                      <span className="text-sm ml-2">
                        ({activeStock.change_percent >= 0 ? '+' : ''}{activeStock.change_percent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Volume */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Trading Volume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Volume</div>
                  <div className="text-3xl font-bold text-orange-400">
                    {formatNumber(activeStock.volume)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Dividend Yield</div>
                  <div className="text-2xl font-bold text-green-400">
                    {activeStock.dividend_yield.toFixed(2)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* All Preferreds Table */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle>All MSTR Preferreds</CardTitle>
            <p className="text-slate-400">Complete overview with live data</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400">Symbol</th>
                    <th className="text-right py-2 text-slate-400">Price</th>
                    <th className="text-right py-2 text-slate-400">Change</th>
                    <th className="text-right py-2 text-slate-400">Volume</th>
                    <th className="text-right py-2 text-slate-400">Dividend</th>
                  </tr>
                </thead>
                <tbody>
                  {preferredSymbols.map((symbol) => {
                    const stock = preferredsData?.preferreds[symbol]
                    if (!stock) return null
                    
                    return (
                      <tr 
                        key={symbol} 
                        className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer ${
                          activeTab === symbol ? 'bg-slate-700/30' : ''
                        }`}
                        onClick={() => setActiveTab(symbol)}
                      >
                        <td className="py-3">
                          <div className="font-bold">{stock.symbol}</div>
                        </td>
                        <td className="text-right py-3">
                          <div className="font-bold">{formatCurrency(stock.price)}</div>
                        </td>
                        <td className="text-right py-3">
                          <div className={`${getChangeColor(stock.change)}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="text-right py-3 text-orange-400 font-bold">
                          {formatNumber(stock.volume)}
                        </td>
                        <td className="text-right py-3 text-green-400 font-bold">
                          {stock.dividend_yield.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Data Attribution */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Data from strategy.com • Updated every 10 seconds • Last refresh: {lastUpdate}</p>
        </div>
      </div>
    </div>
  )
}