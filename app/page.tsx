import { Bitcoin, TrendingUp, DollarSign, Activity, Users } from 'lucide-react'
import { getDashboardStats, getTreasuryHoldings, formatCurrency, formatNumber, formatPercent } from './lib/data'
import Link from 'next/link'

async function DashboardStats() {
  const stats = await getDashboardStats()
  const holdings = await getTreasuryHoldings()
  
  // Get top 5 holders
  const topHolders = holdings
    .sort((a, b) => b.btc_holdings - a.btc_holdings)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* BETA MODE Banner */}
      <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-orange-400 font-semibold text-lg">BETA MODE</span>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-gray-400 text-sm mt-1">Platform in active development • Data feeds stabilizing • More features coming soon</p>
      </div>
      
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card glow-bitcoin">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Bitcoin Price</p>
              <p className="text-3xl font-bold text-bitcoin-500">
                {formatCurrency(stats.btcPrice)}
              </p>
              <p className={`text-sm ${(stats.btcChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(stats.btcChange24h || 0)} 24h
              </p>
            </div>
            <Bitcoin className="h-12 w-12 text-bitcoin-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Institutional BTC</p>
              <p className="text-3xl font-bold">
                {formatNumber(stats.totalBTC)}
              </p>
              <p className="text-sm text-gray-400">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="metric-card glow-mstr">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">MSTR Price</p>
              <p className="text-3xl font-bold text-mstr-500">
                ${stats.mstrPrice?.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">
                IV: {stats.mstrIV?.toFixed(1)}%
              </p>
            </div>
            <Activity className="h-12 w-12 text-mstr-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">MSTR NAV Premium</p>
              <p className={`text-3xl font-bold ${(stats.navPremium || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(stats.navPremium || 0)}
              </p>
              <p className="text-sm text-gray-400">vs BTC holdings</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-400" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-bitcoin-500">Corporate Holdings</h3>
          <div className="text-center">
            <p className="text-4xl font-bold mb-2">{formatNumber(stats.corporateBTC)}</p>
            <p className="text-gray-400">BTC held by companies</p>
            <p className="text-sm text-gray-500 mt-2">
              {formatCurrency((stats.corporateBTC || 0) * (stats.btcPrice || 0))}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-mstr-500">ETF Holdings</h3>
          <div className="text-center">
            <p className="text-4xl font-bold mb-2">{formatNumber(stats.etfBTC)}</p>
            <p className="text-gray-400">BTC held by ETFs</p>
            <p className="text-sm text-gray-500 mt-2">
              {formatCurrency((stats.etfBTC || 0) * (stats.btcPrice || 0))}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-green-400">Total Value</h3>
          <div className="text-center">
            <p className="text-4xl font-bold mb-2">{formatCurrency(stats.totalValue)}</p>
            <p className="text-gray-400">Total institutional value</p>
            <p className="text-sm text-gray-500 mt-2">
              {formatNumber(stats.totalBTC)} BTC
            </p>
          </div>
        </div>
      </div>

      {/* Top Holders Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Top Bitcoin Holders</h3>
          <Link 
            href="/treasuries"
            className="text-bitcoin-500 hover:text-bitcoin-400 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        
        <div className="space-y-4">
          {topHolders.map((holder, index) => (
            <div key={holder.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="bg-bitcoin-500 text-black text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold">{holder.entity_name}</p>
                  <p className="text-sm text-gray-400 capitalize">{holder.entity_type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatNumber(holder.btc_holdings)} BTC</p>
                <p className="text-sm text-gray-400">
                  {formatCurrency(holder.btc_holdings * (stats.btcPrice || 0))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Politician Trading Preview */}
      <Link href="/politicians" className="card hover:bg-gray-800 transition-colors">
        <h3 className="text-xl font-bold mb-4 text-bitcoin-500">🏛️ Politician Trading Activity</h3>
        <div className="text-center">
          <p className="text-4xl font-bold mb-2 text-white">96+</p>
          <p className="text-gray-400">Live trades tracked</p>
          <p className="text-sm text-gray-500 mt-2">
            25+ Politicians • Real-time alerts
          </p>
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/treasuries" className="card hover:bg-gray-800 transition-colors">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-bitcoin-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Treasury Tracker</h3>
            <p className="text-gray-400 text-sm">
              View all institutional Bitcoin holdings with real-time valuations
            </p>
          </div>
        </Link>

        <Link href="/mstr" className="card hover:bg-gray-800 transition-colors">
          <div className="text-center">
            <Activity className="h-12 w-12 text-mstr-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">MSTR Analytics</h3>
            <p className="text-gray-400 text-sm">
              Deep dive into MicroStrategy options, volatility, and NAV analysis
            </p>
          </div>
        </Link>

        <Link href="/politicians" className="card hover:bg-gray-800 transition-colors">
          <div className="text-center">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Politician Trades</h3>
            <p className="text-gray-400 text-sm">
              Track Congress stock trades with performance analytics and alerts
            </p>
          </div>
        </Link>

        <Link href="/mstr/calculator" className="card hover:bg-gray-800 transition-colors">
          <div className="text-center">
            <DollarSign className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Options Calculator</h3>
            <p className="text-gray-400 text-sm">
              Calculate premiums for covered calls and cash-secured puts
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-mstr-500 bg-clip-text text-transparent">
          Bitcoin Treasury & MSTR Intelligence
        </h1>
        <p className="text-xl text-gray-400">
          Real-time tracking of institutional Bitcoin holdings and MSTR options analytics
        </p>
      </div>
      
      <DashboardStats />
    </div>
  )
}