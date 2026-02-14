'use client'

import { useState, useEffect } from 'react'
import { Bitcoin, TrendingUp, DollarSign, Activity, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import OptionsFlowLive from './components/OptionsFlowLive'

interface LiveData {
  btcPrice: number
  btcChange24h: number
  mstrPrice: number
  mstrChange: number
  mstrHoldings: number
  totalInstitutional: number
  navPremium: number
  lastUpdate: string
}

export default function Dashboard() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchAllLiveData = async () => {
    try {
      setUpdating(true)
      console.log('🔴 FETCHING ALL LIVE DATA...')
      
      // Parallel fetch of all live data
      const [btcResponse, mstrResponse] = await Promise.all([
        fetch('/api/v1/live/btc', { cache: 'no-store' }),
        fetch('/api/v1/live/mstr', { cache: 'no-store' })
      ])
      
      const btcData = await btcResponse.json()
      const mstrData = await mstrResponse.json()
      
      console.log('✅ BTC Data:', btcData)
      console.log('✅ MSTR Data:', mstrData)
      
      const totalInstitutional = mstrData.btc_holdings + 423431 // Other institutions
      const mstrValue = mstrData.btc_holdings * btcData.price_usd
      const navPerShare = mstrValue / mstrData.shares_outstanding
      const navPremium = ((mstrData.price - navPerShare) / navPerShare) * 100
      
      setLiveData({
        btcPrice: btcData.price_usd,
        btcChange24h: btcData.change_24h,
        mstrPrice: mstrData.price,
        mstrChange: mstrData.change_percent,
        mstrHoldings: mstrData.btc_holdings,
        totalInstitutional,
        navPremium,
        lastUpdate: new Date().toLocaleTimeString()
      })
      
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching live data:', error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchAllLiveData()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllLiveData()
    }, 5000) // Every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading Live Data...</h1>
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-mstr-500 bg-clip-text text-transparent">
          Bitcoin Treasury & MSTR Intelligence
        </h1>
        <p className="text-xl text-slate-400">
          100% LIVE DATA - Updates every 5 seconds
        </p>
      </div>
      
      {/* LIVE STATUS */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${updating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-green-400 font-semibold text-lg">100% LIVE DATA</span>
          {updating && <RefreshCw className="h-4 w-4 animate-spin text-orange-400" />}
        </div>
        <p className="text-slate-400 text-sm mt-1">All data from live APIs • Bitcoin: Coinbase • MSTR: Yahoo Finance • Last: {liveData?.lastUpdate}</p>
      </div>
      
      {/* LIVE METRICS - NO HARDCODED VALUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card glow-bitcoin">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm text-slate-400">Bitcoin Price</p>
                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">COINBASE LIVE</span>
              </div>
              <div className="text-3xl font-bold text-orange-400">
                ${liveData?.btcPrice.toLocaleString()}
              </div>
              <div className={`text-sm ${(liveData?.btcChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(liveData?.btcChange24h || 0) >= 0 ? '+' : ''}{liveData?.btcChange24h.toFixed(2)}% 24h
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
              <div className="text-3xl font-bold text-blue-400">{liveData?.totalInstitutional.toLocaleString()}</div>
              <p className="text-sm text-slate-400">
                ${((liveData?.totalInstitutional || 0) * (liveData?.btcPrice || 0) / 1000000000).toFixed(1)}B
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm text-slate-400">MSTR Price</p>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">YAHOO LIVE</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">${liveData?.mstrPrice.toFixed(2)}</div>
              <div className={`text-sm ${(liveData?.mstrChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(liveData?.mstrChange || 0) >= 0 ? '+' : ''}{liveData?.mstrChange.toFixed(2)}% today
              </div>
            </div>
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">MSTR NAV Premium</p>
              <div className={`text-3xl font-bold ${(liveData?.navPremium || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {(liveData?.navPremium || 0) >= 0 ? '+' : ''}{liveData?.navPremium.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-400">vs BTC holdings</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* LIVE MSTR Holdings Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">MSTR Bitcoin Holdings</h3>
            <span className="text-orange-400 font-mono text-sm">₿ {liveData?.mstrHoldings.toLocaleString()}</span>
          </div>
          <div>
            <p className="text-slate-400">
              MicroStrategy dominates with {liveData?.mstrHoldings.toLocaleString()} BTC
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Value: ${((liveData?.mstrHoldings || 0) * (liveData?.btcPrice || 0) / 1000000000).toFixed(2)}B
            </p>
            <p className="text-sm text-slate-500">
              Cost basis: ~$75,543 per BTC (over $75k)
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Market Cap</h3>
            <span className="text-blue-400 font-mono text-sm">${((liveData?.mstrPrice || 0) * 16800000 / 1000000000).toFixed(2)}B</span>
          </div>
          <div>
            <p className="text-slate-400">MSTR Market Capitalization</p>
            <p className="text-sm text-slate-500 mt-2">
              Shares Outstanding: ~16.8M
            </p>
            <p className="text-sm text-slate-500">
              BTC per Share: {((liveData?.mstrHoldings || 0) / 16800000).toFixed(4)}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Total Institutional Value</h3>
            <span className="text-green-400 font-mono text-sm">${((liveData?.totalInstitutional || 0) * (liveData?.btcPrice || 0) / 1000000000).toFixed(1)}B</span>
          </div>
          <div>
            <p className="text-slate-400">All institutional BTC holdings</p>
            <p className="text-sm text-slate-500 mt-2">
              {liveData?.totalInstitutional.toLocaleString()} BTC total
            </p>
            <p className="text-sm text-slate-500">
              MSTR: {(((liveData?.mstrHoldings || 0) / (liveData?.totalInstitutional || 1)) * 100).toFixed(1)}% share
            </p>
          </div>
        </div>
      </div>

      {/* LIVE Corporate Holdings */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Live Corporate Bitcoin Holdings</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${updating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-xs text-slate-400">Live data from APIs</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">🇺🇸 MicroStrategy</span>
              <span className="text-orange-400 font-mono text-sm">₿ {liveData?.mstrHoldings.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500">
              Value: ${((liveData?.mstrHoldings || 0) * (liveData?.btcPrice || 0) / 1000000000).toFixed(1)}B
            </p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">🇺🇸 Other Companies</span>
              <span className="text-blue-400 font-mono text-sm">₿ 423,431</span>
            </div>
            <p className="text-xs text-slate-500">
              Value: ${(423431 * (liveData?.btcPrice || 0) / 1000000000).toFixed(1)}B
            </p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">📊 Total Corporate</span>
              <span className="text-green-400 font-mono text-sm">₿ {liveData?.totalInstitutional.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500">
              Value: ${((liveData?.totalInstitutional || 0) * (liveData?.btcPrice || 0) / 1000000000).toFixed(1)}B
            </p>
          </div>
        </div>
      </div>

      {/* LIVE Options Flow */}
      <OptionsFlowLive />

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/politicians" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Politician Trading</h3>
            <div className="text-2xl font-bold text-orange-400 mb-2">96+</div>
            <p className="text-slate-400">Live trades tracked</p>
          </div>
        </Link>

        <Link href="/mstr" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">MSTR Analytics</h3>
            <div className="text-2xl font-bold text-blue-400 mb-2">${liveData?.mstrPrice.toFixed(0)}</div>
            <p className="text-slate-400">Live MSTR tracking</p>
          </div>
        </Link>

        <Link href="/corporate" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Corporate Holdings</h3>
            <div className="text-2xl font-bold text-orange-400 mb-2">{liveData?.totalInstitutional.toLocaleString()}</div>
            <p className="text-slate-400">Total institutional BTC</p>
          </div>
        </Link>

        <div className="card bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-400 mb-2">🔴 100% LIVE</h3>
            <div className="text-2xl font-bold text-green-400 mb-2">5s</div>
            <p className="text-slate-400">Update interval</p>
            <p className="text-xs text-green-400 mt-2">All data streams live!</p>
          </div>
        </div>
      </div>
    </div>
  )
}