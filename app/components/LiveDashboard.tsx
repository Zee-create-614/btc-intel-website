'use client'

import { useState, useEffect } from 'react'
import { Bitcoin, TrendingUp, DollarSign, Activity, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { 
  getLiveAnalytics, 
  formatLivePrice, 
  formatLiveBTC, 
  formatLivePercent, 
  formatLiveValue,
  LIVE_UPDATE_INTERVAL 
} from '../lib/live-data-feeds'

export default function LiveDashboard() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchLiveData = async () => {
    try {
      setUpdating(true)
      console.log('🔴 DASHBOARD: Fetching live data...')
      
      const data = await getLiveAnalytics()
      setAnalytics(data)
      setLastUpdate(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (error) {
      console.error('❌ Dashboard live data error:', error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchLiveData()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveData()
    }, LIVE_UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  if (loading || !analytics) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-mstr-500 bg-clip-text text-transparent">
            Bitcoin Treasury & MSTR Intelligence
          </h1>
          <p className="text-xl text-slate-400">
            Loading real-time data...
          </p>
        </div>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  const { btc_data, mstr_data, holdings_data, nav_premium_discount } = analytics
  
  // Calculate total institutional value (MSTR + other holders)
  const mstrValue = holdings_data.btc_holdings * btc_data.price_usd
  const otherInstitutionalBTC = 423431 // Other institutions (rough estimate)
  const totalInstitutionalBTC = holdings_data.btc_holdings + otherInstitutionalBTC
  const totalInstitutionalValue = totalInstitutionalBTC * btc_data.price_usd

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-mstr-500 bg-clip-text text-transparent">
          Bitcoin Treasury & MSTR Intelligence
        </h1>
        <p className="text-xl text-slate-400">
          Real-time tracking of institutional Bitcoin holdings and MSTR options analytics
        </p>
        
        {/* Live Status Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            updating ? 'bg-yellow-900/20 text-yellow-400' : 'bg-green-900/20 text-green-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              updating ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
            }`}></div>
            <RefreshCw className={`h-3 w-3 ${updating ? 'animate-spin' : ''}`} />
            <span>LIVE DATA</span>
          </div>
          <span className="text-xs text-slate-500">
            Updated: {lastUpdate}
          </span>
        </div>
      </div>
      
      {/* BETA MODE Banner */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-blue-400 font-semibold text-lg">LIVE MODE</span>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-slate-400 text-sm mt-1">Real-time data updates every 10 seconds • Live Bitcoin from Coinbase • Live MSTR from Yahoo Finance</p>
      </div>
      
      {/* Live Top 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card glow-bitcoin">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm text-slate-400">Bitcoin Price</p>
                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">COINBASE</span>
              </div>
              <div className="text-3xl font-bold text-orange-400">
                {formatLivePrice(btc_data.price_usd)}
              </div>
              <div className={`text-sm ${btc_data.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatLivePercent(btc_data.change_24h)} 24h
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Bitcoin className="h-12 w-12 text-orange-500" />
              <div className={`w-2 h-2 rounded-full mt-2 ${updating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Institutional BTC</p>
              <div className="text-3xl font-bold text-blue-400">
                {formatLiveBTC(totalInstitutionalBTC)}
              </div>
              <p className="text-sm text-slate-400">
                {formatLiveValue(totalInstitutionalValue)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">MSTR Price</p>
              <div className="text-3xl font-bold text-blue-400">
                {formatLivePrice(mstr_data.price)}
              </div>
              <p className={`text-sm ${mstr_data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatLivePercent(mstr_data.change_percent)} today
              </p>
            </div>
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">MSTR NAV Premium</p>
              <div className={`text-3xl font-bold ${nav_premium_discount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatLivePercent(nav_premium_discount)}
              </div>
              <p className="text-sm text-slate-400">vs BTC holdings</p>
            </div>
            <DollarSign className={`h-12 w-12 ${nav_premium_discount >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Live 3 Column Data Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Corporate Holdings</h3>
            <span className="text-orange-400 font-mono text-sm">
              ₿ {formatLiveBTC(holdings_data.btc_holdings)}
            </span>
          </div>
          <div>
            <p className="text-slate-400">BTC held by companies</p>
            <p className="text-sm text-slate-500 mt-2">
              MicroStrategy dominates with {formatLiveBTC(holdings_data.btc_holdings)} BTC
            </p>
          </div>
          
          {/* Top Bitcoin Holders Section */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-500 mb-2">Top Bitcoin Holders:</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">1</span>
                  <span className="text-xs">🇺🇸</span>
                  <span className="text-xs text-orange-400 font-medium">MicroStrategy</span>
                </div>
                <span className="font-mono text-xs text-orange-400 font-bold">
                  ₿ {formatLiveBTC(holdings_data.btc_holdings)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">2</span>
                  <span className="text-xs">🇺🇸</span>
                  <span className="text-xs text-white">MARA Holdings</span>
                </div>
                <span className="font-mono text-xs text-slate-300">₿ 23,560</span>
              </div>
            </div>
            <div className="pt-2 text-center">
              <Link href="/corporate" className="text-xs text-orange-400 hover:text-orange-300">
                View All →
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">ETF Holdings</h3>
            <span className="text-blue-400 font-mono text-sm">₿ 0</span>
          </div>
          <div>
            <p className="text-slate-400">BTC held by ETFs</p>
            <p className="text-sm text-slate-500 mt-2">$0</p>
            <p className="text-sm text-slate-500 mt-2">ETF data coming soon</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Total Value</h3>
            <span className="text-green-400 font-mono text-sm">
              {formatLiveValue(totalInstitutionalValue)}
            </span>
          </div>
          <div>
            <p className="text-slate-400">Total institutional value</p>
            <p className="text-sm text-slate-500 mt-2">
              {formatLiveBTC(totalInstitutionalBTC)} BTC
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/politicians" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Politician Trading</h3>
            <div className="text-2xl font-bold text-orange-400 mb-2">96+</div>
            <p className="text-slate-400">Live trades tracked</p>
            <p className="text-sm text-slate-500 mt-2">
              Congressional stock trades with real-time alerts
            </p>
          </div>
        </Link>

        <Link href="/treasuries" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Treasury Dashboard</h3>
            <p className="text-slate-400 text-sm">
              Complete Bitcoin treasury tracking and analytics
            </p>
          </div>
        </Link>

        <Link href="/mstr" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">MSTR Analytics</h3>
            <p className="text-slate-400 text-sm">
              Advanced MicroStrategy options and NAV analysis
            </p>
          </div>
        </Link>

        <Link href="/mstr/calculator" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Options Calculator</h3>
            <p className="text-slate-400 text-sm">
              MSTR covered calls and put strategies
            </p>
          </div>
        </Link>
      </div>

      {/* Data Source Attribution */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
        <p>
          📊 Live data from CoinGecko • Yahoo Finance • SEC EDGAR filings • 
          Auto-updates every 30 seconds • 
          Last refresh: {lastUpdate}
        </p>
      </div>
    </div>
  )
}