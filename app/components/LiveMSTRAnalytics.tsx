'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, DollarSign, RefreshCw } from 'lucide-react'
import { 
  getLiveAnalytics, 
  formatLivePrice, 
  formatLiveBTC, 
  formatLivePercent, 
  formatLiveValue,
  LIVE_UPDATE_INTERVAL 
} from '../lib/live-data-feeds'

export default function LiveMSTRAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [updating, setUpdating] = useState(false)

  const fetchLiveData = async () => {
    try {
      setUpdating(true)
      console.log('🔴 LIVE UPDATE: Fetching real-time MSTR data...')
      
      const data = await getLiveAnalytics()
      setAnalytics(data)
      setLastUpdate(new Date().toLocaleTimeString())
      setLoading(false)
      
      console.log('✅ Live data updated successfully')
    } catch (error) {
      console.error('❌ Live data fetch error:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchLiveData()
  }, [])

  // Auto-update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveData()
    }, LIVE_UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-orange-400">BTC Holdings Analysis</h2>
          <div className="flex items-center space-x-2 text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading live data...</span>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="bg-slate-800 rounded-lg p-6 h-24"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 h-20"></div>
            <div className="bg-slate-800 rounded-lg p-4 h-20"></div>
          </div>
        </div>
      </div>
    )
  }

  const { btc_data, mstr_data, holdings_data, nav_per_share, nav_premium_discount, btc_per_share } = analytics

  return (
    <div className="space-y-6">
      {/* Header with Live Update Status */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-orange-400">BTC Holdings Analysis</h2>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            updating ? 'bg-yellow-900/20 text-yellow-400' : 'bg-green-900/20 text-green-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              updating ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
            }`}></div>
            <RefreshCw className={`h-3 w-3 ${updating ? 'animate-spin' : ''}`} />
            <span>LIVE</span>
          </div>
          <span className="text-xs text-slate-500">
            Updated: {lastUpdate}
          </span>
        </div>
      </div>

      {/* Main Holdings Card */}
      <div className="bg-slate-900/60 border border-slate-700/30 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-orange-400 mb-2">
            ₿ {formatLiveBTC(holdings_data.btc_holdings)}
          </div>
          <p className="text-slate-400">Total BTC Holdings</p>
          <p className="text-sm text-slate-500 mt-1">
            Last updated: {holdings_data.last_filing_date} ({holdings_data.source})
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-slate-400 mb-2">Average Cost Basis</p>
            <p className="text-2xl font-bold text-white">
              {formatLivePrice(holdings_data.btc_cost_basis_per_coin)}
            </p>
            <p className="text-sm text-slate-500">
              Current BTC: {formatLivePrice(btc_data.price_usd)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-slate-400 mb-2">Unrealized P&L</p>
            <p className={`text-2xl font-bold ${
              holdings_data.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatLiveValue(holdings_data.unrealized_pnl)}
            </p>
            <p className="text-sm text-slate-500">
              Total Invested: {formatLiveValue(holdings_data.total_cost_basis)}
            </p>
          </div>
        </div>
      </div>

      {/* Market Intelligence */}
      <div className="bg-slate-900/60 border border-slate-700/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-orange-400 mb-4">Market Intelligence</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-slate-400 mb-2">MSTR Stock Price</p>
            <p className="text-2xl font-bold text-white">
              {formatLivePrice(mstr_data.price)}
            </p>
            <p className={`text-sm ${
              mstr_data.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatLivePercent(mstr_data.change_percent)} today
            </p>
          </div>

          <div className="text-center">
            <p className="text-slate-400 mb-2">NAV Premium/Discount</p>
            <p className={`text-2xl font-bold ${
              nav_premium_discount >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatLivePercent(nav_premium_discount)}
            </p>
            <p className="text-sm text-slate-500">
              NAV per Share: {formatLivePrice(nav_per_share)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-slate-400 mb-2">BTC per Share</p>
            <p className="text-2xl font-bold text-orange-400">
              ₿ {btc_per_share.toFixed(6)}
            </p>
            <p className="text-sm text-slate-500">
              {formatLiveValue(btc_per_share * btc_data.price_usd)} USD value
            </p>
          </div>
        </div>
      </div>

      {/* Current Market Conditions */}
      <div className="bg-slate-900/60 border border-slate-700/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-orange-400 mb-4">Current Market Conditions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">Bitcoin Price</span>
              <span className="font-mono text-white">
                {formatLivePrice(btc_data.price_usd)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">24h Change</span>
              <span className={`font-mono ${
                btc_data.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatLivePercent(btc_data.change_24h)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Market Cap</span>
              <span className="font-mono text-white">
                {formatLiveValue(btc_data.market_cap)}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">MSTR Volume</span>
              <span className="font-mono text-white">
                {formatLiveValue(mstr_data.volume * mstr_data.price)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">Market Cap</span>
              <span className="font-mono text-white">
                {formatLiveValue(mstr_data.market_cap)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">BTC Dominance</span>
              <span className="font-mono text-orange-400">
                {((holdings_data.btc_holdings / 19800000) * 100).toFixed(3)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Attribution */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
        <p>
          📊 100% Live Data • Real-time market updates • 
          Updates every 30 seconds • 
          Last refresh: {lastUpdate}
        </p>
      </div>
    </div>
  )
}