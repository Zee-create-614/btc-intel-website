'use client'

import { useState, useEffect } from 'react'

export default function TestCalculatorPage() {
  const [mstrPrice, setMstrPrice] = useState<number>(0)
  const [marketCap, setMarketCap] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔴 TEST CALC: Starting fetch...')
        const response = await fetch('/api/v1/live/mstr')
        const data = await response.json()
        console.log('🔴 TEST CALC: Got data:', data)
        
        setMstrPrice(data.price || 133.88)
        setMarketCap(data.market_cap || 44480000000)
        setLoading(false)
        
        console.log('✅ TEST CALC: State updated')
      } catch (error) {
        console.log('❌ TEST CALC: Error:', error)
        setMstrPrice(133.88)
        setMarketCap(44480000000)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">🔴 MSTR Calculator Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Current MSTR Price</p>
          <p className="text-3xl font-bold text-green-400">
            {loading ? '⏳' : `$${mstrPrice.toFixed(2)}`}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Market Cap</p>
          <p className="text-3xl font-bold text-blue-400">
            {loading ? '⏳' : `$${(marketCap / 1000000000).toFixed(1)}B`}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">IV Rank</p>
          <p className="text-3xl font-bold text-yellow-400">82%</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">NAV Premium</p>
          <p className="text-3xl font-bold text-green-400">+24.5%</p>
        </div>
      </div>
      
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-400 font-bold mb-2">🐛 Debug Info:</h3>
        <div className="text-sm space-y-1">
          <div>Loading: {loading.toString()}</div>
          <div>MSTR Price: ${mstrPrice}</div>
          <div>Market Cap: ${marketCap}</div>
          <div>Timestamp: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  )
}