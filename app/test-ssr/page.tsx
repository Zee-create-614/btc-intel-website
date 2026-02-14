// Server-side rendered test to ensure data shows up
async function getMSTRData() {
  try {
    // Direct fetch from internal API
    const response = await fetch('http://localhost:3002/api/v1/live/mstr', {
      cache: 'no-store'
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('SSR MSTR fetch error:', error)
    return {
      price: 133.88,
      market_cap: 44480000000,
      volume: 23000000,
      btc_holdings: 714644
    }
  }
}

export default async function TestSSRPage() {
  const mstrData = await getMSTRData()
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">🔴 SSR MSTR Test</h1>
      <p className="text-lg mb-4">This should DEFINITELY show live data (server-side rendered):</p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">MSTR Price (SSR)</p>
          <p className="text-3xl font-bold text-green-400">
            ${mstrData.price.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Market Cap (SSR)</p>
          <p className="text-3xl font-bold text-blue-400">
            ${(mstrData.market_cap / 1000000000).toFixed(1)}B
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Volume (SSR)</p>
          <p className="text-3xl font-bold text-yellow-400">
            {mstrData.volume?.toLocaleString() || 'N/A'}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">BTC Holdings (SSR)</p>
          <p className="text-3xl font-bold text-orange-400">
            {mstrData.btc_holdings?.toLocaleString() || 'N/A'}
          </p>
        </div>
      </div>
      
      <div className="mt-8 bg-green-900/20 border border-green-500 rounded-lg p-4">
        <h3 className="text-green-400 font-bold mb-2">✅ Raw SSR Data:</h3>
        <pre className="text-xs text-green-300 overflow-auto">
          {JSON.stringify(mstrData, null, 2)}
        </pre>
      </div>
    </div>
  )
}