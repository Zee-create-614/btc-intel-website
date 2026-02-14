'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Target } from 'lucide-react'

export default function FixedNavAnalysis() {
  const [navData, setNavData] = useState<any>(null)
  const [mstrData, setMstrData] = useState<any>(null)
  const [dilutedData, setDilutedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchCorrectNavData = async () => {
    try {
      setUpdating(true)
      console.log('🔥 FETCHING CORRECT NAV DATA FROM STRATEGY.COM...')
      
      const [navResponse, mstrResponse, dilutedResponse] = await Promise.all([
        fetch('/api/v1/live/nav', { cache: 'no-store' }),
        fetch('/api/v1/live/mstr', { cache: 'no-store' }),
        fetch('/api/v1/live/diluted-shares', { cache: 'no-store' })
      ])
      
      const navApiData = await navResponse.json()
      const mstrApiData = await mstrResponse.json()
      const dilutedApiData = await dilutedResponse.json()
      
      console.log('🔥 NAV API Data:', navApiData)
      console.log('🔥 MSTR API Data:', mstrApiData)
      console.log('🔥 Diluted API Data:', dilutedApiData)
      
      // CORRECT CALCULATION using strategy.com 1.19 multiple
      const strategyMultiple = navApiData.nav_multiple || 1.19
      const mstrPrice = mstrApiData.price
      const basicNavPerShare = mstrPrice / strategyMultiple // CORRECT METHOD
      const basicNavPremium = ((strategyMultiple - 1.0) * 100) // CORRECT METHOD
      
      // FULLY DILUTED CALCULATION
      const basicShares = mstrApiData.shares_outstanding
      const dilutedShares = dilutedApiData.diluted_shares
      const dilutedNavPerShare = (basicNavPerShare * basicShares) / dilutedShares
      const dilutedNavMultiple = mstrPrice / dilutedNavPerShare
      const dilutedNavPremium = ((dilutedNavMultiple - 1.0) * 100)
      
      console.log('🔥 CORRECT NAV CALCULATION RESULTS:', {
        strategy_multiple: strategyMultiple,
        mstr_price: mstrPrice,
        basic_nav_per_share: basicNavPerShare.toFixed(2),
        basic_premium: basicNavPremium.toFixed(1) + '%',
        diluted_nav_per_share: dilutedNavPerShare.toFixed(2),
        diluted_premium: dilutedNavPremium.toFixed(1) + '%'
      })
      
      setNavData({
        basicNavPerShare,
        basicNavPremium,
        dilutedNavPerShare,
        dilutedNavPremium,
        mstrPrice,
        strategyMultiple,
        basicShares,
        dilutedShares
      })
      
      setMstrData(mstrApiData)
      setDilutedData(dilutedApiData)
      setLoading(false)
      
    } catch (error) {
      console.error('❌ Error fetching correct NAV data:', error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchCorrectNavData()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchCorrectNavData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !navData) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-6">🔄 Loading Fixed NAV Data...</h3>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">NAV Analysis (Strategy.com)</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${updating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
          <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
          <span className="text-xs text-green-400">LIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* BASIC NAV from Strategy.com - CORRECTED */}
        <div className="text-center p-6 bg-green-900/20 border border-green-500 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <p className="text-sm text-green-400 font-medium">Basic NAV</p>
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Strategy.com 1.19x</span>
          </div>
          <p className="text-4xl font-bold text-green-400">
            +{navData.basicNavPremium.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-300 mt-2">
            NAV: ${navData.basicNavPerShare.toFixed(0)} | {(navData.basicShares / 1000000).toFixed(0)}M shares
          </p>
          <p className="text-xs text-gray-400 mt-1">
            MSTR ${navData.mstrPrice} ÷ {navData.strategyMultiple} = ${navData.basicNavPerShare.toFixed(2)}
          </p>
        </div>

        {/* FULLY DILUTED NAV - CORRECTED */}
        <div className="text-center p-6 bg-orange-900/20 border border-orange-500 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <p className="text-sm text-orange-400 font-medium">Diluted NAV</p>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">DILUTED</span>
          </div>
          <p className="text-4xl font-bold text-orange-400">
            +{navData.dilutedNavPremium.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-300 mt-2">
            NAV: ${navData.dilutedNavPerShare.toFixed(0)} | {(navData.dilutedShares / 1000000).toFixed(0)}M shares
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Includes convertibles, options, warrants
          </p>
        </div>

        {/* NAV Calculation Details */}
        <div className="text-xs text-slate-400 p-3 bg-slate-800/50 border border-slate-700 rounded">
          <p>Strategy.com Multiple: {navData.strategyMultiple}x • MSTR: ${navData.mstrPrice}</p>
          <p>NAV/Share: ${navData.basicNavPerShare.toFixed(2)} • Premium: +{navData.basicNavPremium.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  )
}