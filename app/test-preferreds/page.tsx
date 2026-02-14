'use client'

import { useState, useEffect } from 'react'

export default function TestPreferreds() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching preferreds data...')
        const response = await fetch('/api/v1/live/preferreds')
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Data received:', data)
          setData(data)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
        
        setError(null)
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Test Preferreds - Loading...</h1>
        <div className="animate-pulse bg-slate-700 h-8 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Test Preferreds - Error</h1>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test Preferreds - Success</h1>
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
        <p className="text-green-400">Data loaded successfully</p>
        <pre className="text-sm text-slate-300 mt-2 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}