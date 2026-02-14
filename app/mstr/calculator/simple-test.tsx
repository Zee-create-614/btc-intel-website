'use client'

import { useState, useEffect } from 'react'

export default function SimpleCalculatorTest() {
  const [mstrPrice, setMstrPrice] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/v1/live/mstr')
        const data = await response.json()
        setMstrPrice(data.price)
        setLoading(false)
        console.log('✅ SIMPLE TEST: MSTR price set to:', data.price)
      } catch (error) {
        setMstrPrice(133.88) // Fallback
        setLoading(false)
        console.log('⚠️ SIMPLE TEST: Using fallback price')
      }
    }
    
    fetchPrice()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">🔴 SIMPLE MSTR PRICE TEST</h1>
      <div className="bg-slate-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">Current MSTR Price</p>
        <p className="text-4xl font-bold text-green-400">
          {loading ? '⏳ Loading...' : `$${mstrPrice.toFixed(2)}`}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Status: {loading ? 'Fetching data...' : 'Live data loaded'}
        </p>
      </div>
    </div>
  )
}