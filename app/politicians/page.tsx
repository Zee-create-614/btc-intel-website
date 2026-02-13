import { Users, TrendingUp, TrendingDown, BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  getTradeStats, getTrades, getPoliticianSummaries,
  partyColor, partyBg, partyName, tradeTypeColor, tradeTypeEmoji,
  returnColor, formatReturn,
} from '../lib/politician-data'

export const metadata = {
  title: 'Politician Trading Tracker | BTCIntelVault',
  description: 'Track every stock trade made by US politicians. Real-time alerts, performance tracking, and leaderboards.',
}

async function StatsBar() {
  const stats = await getTradeStats()
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-bitcoin-500">{stats.total_trades}</p>
        <p className="text-sm text-gray-400">Total Trades</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-white">{stats.unique_politicians}</p>
        <p className="text-sm text-gray-400">Politicians</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-white">{stats.unique_tickers}</p>
        <p className="text-sm text-gray-400">Unique Tickers</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-green-400">{stats.total_buys}</p>
        <p className="text-sm text-gray-400">Buys</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-red-400">{stats.total_sells}</p>
        <p className="text-sm text-gray-400">Sells</p>
      </div>
    </div>
  )
}

async function RecentTrades() {
  const { trades } = await getTrades(1, 15)
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-bitcoin-500" />
          Recent Trades
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="text-left py-3 px-2">Politician</th>
              <th className="text-left py-3 px-2">Party</th>
              <th className="text-left py-3 px-2">Ticker</th>
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Size</th>
              <th className="text-left py-3 px-2">Price</th>
              <th className="text-left py-3 px-2">Date</th>
              <th className="text-left py-3 px-2">Owner</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => (
              <tr key={trade.id || i} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="py-3 px-2">
                  <Link 
                    href={`/politicians/${encodeURIComponent(trade.politician)}`}
                    className="text-bitcoin-500 hover:text-bitcoin-400 font-medium"
                  >
                    {trade.politician}
                  </Link>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${partyBg(trade.party)}`}>
                    <span className={partyColor(trade.party)}>
                      {trade.party || '?'}
                    </span>
                  </span>
                </td>
                <td className="py-3 px-2 font-mono">
                  {trade.ticker ? (
                    <span className="text-white font-semibold">${trade.ticker}</span>
                  ) : (
                    <span className="text-gray-500 text-xs">{trade.asset_name?.slice(0, 25)}</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span className={tradeTypeColor(trade.trade_type)}>
                    {tradeTypeEmoji(trade.trade_type)} {trade.trade_type}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-300 text-xs">{trade.size_range}</td>
                <td className="py-3 px-2 text-gray-300">{trade.price || 'N/A'}</td>
                <td className="py-3 px-2 text-gray-400 text-xs">{trade.trade_date}</td>
                <td className="py-3 px-2 text-gray-500 text-xs">{trade.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function PoliticianCards() {
  const summaries = await getPoliticianSummaries()
  const top = summaries.slice(0, 12)
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-bitcoin-500" />
          Active Politicians
        </h2>
        <Link href="/politicians/leaderboard" className="text-bitcoin-500 hover:text-bitcoin-400 text-sm flex items-center gap-1">
          Leaderboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {top.map((pol) => (
          <Link
            key={pol.name}
            href={`/politicians/${encodeURIComponent(pol.name)}`}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-bitcoin-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white group-hover:text-bitcoin-400 transition-colors">
                  {pol.name}
                </h3>
                <p className="text-xs text-gray-400">
                  <span className={partyColor(pol.party)}>{partyName(pol.party)}</span>
                  {' · '}{pol.chamber}{pol.state ? ` · ${pol.state}` : ''}
                </p>
              </div>
              <div className={`text-lg font-bold ${returnColor(pol.avg_return_pct)}`}>
                {formatReturn(pol.avg_return_pct)}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{pol.total_trades} trades</span>
              <span className="text-green-400">{pol.buys} buys</span>
              <span className="text-red-400">{pol.sells} sells</span>
            </div>
            
            {pol.top_tickers && pol.top_tickers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {pol.top_tickers.slice(0, 4).map(t => (
                  <span key={t} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                    ${t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function PoliticiansPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-red-500 bg-clip-text text-transparent">
          Politician Trading Tracker
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Track every stock trade made by US Congress members. Real-time alerts, 
          performance tracking, and transparency leaderboards.
        </p>
      </div>

      {/* BETA Banner */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-orange-400 font-semibold">LIVE DATA</span>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Sourced from Capitol Trades • Updated every 30 minutes • Follow @BTCIntelVault for instant alerts
        </p>
      </div>

      {/* Stats */}
      <StatsBar />
      
      {/* Politician Cards */}
      <PoliticianCards />
      
      {/* Recent Trades Table */}
      <RecentTrades />
      
      {/* CTA */}
      <div className="card text-center py-8">
        <h3 className="text-2xl font-bold mb-4">Get Instant Trade Alerts</h3>
        <p className="text-gray-400 mb-6">
          Follow @BTCIntelVault on X for real-time notifications when politicians make trades.
        </p>
        <a 
          href="https://x.com/BTCIntelVault" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-bitcoin-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-bitcoin-400 transition-colors"
        >
          Follow @BTCIntelVault on X
        </a>
      </div>
    </div>
  )
}
