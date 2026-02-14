import BitcoinTreasuriesTable from '../components/BitcoinTreasuriesTable'
import { getLiveBitcoinTreasuries } from '../lib/bitcointreasuries-live'

export default async function CorporatePage() {
  // Get live data from bitcointreasuries.net
  const treasuriesData = await getLiveBitcoinTreasuries()
  
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🏛️ Corporate Bitcoin Holdings
          </h1>
          <p className="text-xl text-slate-300">
            Live tracking of publicly traded companies holding Bitcoin on their balance sheets.
            Data sourced directly from bitcointreasuries.net.
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-300 mb-2">Total Companies</h3>
            <div className="text-3xl font-bold text-white">{treasuriesData.companies.length}</div>
            <div className="text-sm text-slate-400">Publicly traded</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-300 mb-2">Total Bitcoin</h3>
            <div className="text-3xl font-bold text-white">
              ₿ {treasuriesData.total_btc.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Corporate treasuries</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-300 mb-2">Total Value</h3>
            <div className="text-3xl font-bold text-white">
              ${(treasuriesData.total_value_usd / 1_000_000_000).toFixed(1)}B
            </div>
            <div className="text-sm text-slate-400">Market value</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-300 mb-2">Supply Dominance</h3>
            <div className="text-3xl font-bold text-white">
              {treasuriesData.corporate_dominance_percentage.toFixed(2)}%
            </div>
            <div className="text-sm text-slate-400">Of 21M BTC</div>
          </div>
        </div>
        
        {/* Treasuries Table */}
        <BitcoinTreasuriesTable treasuriesData={treasuriesData} />
        
        {/* Key Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Key Insights</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">MicroStrategy dominance:</span>
                <span className="text-blue-400 font-mono">
                  {((714644 / treasuriesData.total_btc) * 100).toFixed(1)}% of corporate holdings
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">US companies:</span>
                <span className="text-blue-400 font-mono">
                  {treasuriesData.companies.filter(c => c.country === 'United States').length} / {treasuriesData.companies.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Top 3 holdings:</span>
                <span className="text-blue-400 font-mono">
                  ₿ {(714644 + 53250 + 43514).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average holding:</span>
                <span className="text-blue-400 font-mono">
                  ₿ {Math.round(treasuriesData.total_btc / treasuriesData.companies.length).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">📊 Market Impact</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400 mb-1">Corporate adoption trend:</div>
                <div className="text-green-400">📈 Accelerating since 2020</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Treasury strategy:</div>
                <div className="text-white">Hedge against inflation & currency debasement</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Market influence:</div>
                <div className="text-white">Corporate buying drives institutional adoption</div>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Supply impact:</div>
                <div className="text-blue-400">
                  {treasuriesData.corporate_dominance_percentage.toFixed(3)}% of total Bitcoin supply locked
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Source */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-slate-500">
            <span>🔗</span>
            <span>Live data sourced from</span>
            <a 
              href="https://bitcointreasuries.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              bitcointreasuries.net
            </a>
            <span>•</span>
            <span>Updated: {new Date(treasuriesData.last_updated).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}