import { 
  Users, TrendingUp, TrendingDown, BarChart3, Search, Filter, Award,
  ArrowUpRight, ArrowDownRight, Activity, Zap, Shield, Target, Clock,
  ChevronRight, ExternalLink, Star
} from 'lucide-react'
import Link from 'next/link'
import {
  getStats, getLeaderboard, getTrades, getPopularTickers, getPartyComparison,
  partyColor, partyBg, partyBadge, partyName, txTypeColor, txTypeLabel, txTypeEmoji,
  returnColor, formatReturn, formatMoney, chamberLabel, slugify,
  type PortfolioPerformance, type Transaction, type SystemStats, type TickerInfo,
} from '../../lib/politician-data-v2'

export const metadata = {
  title: 'Politician Trading Intelligence | BTCIntelVault',
  description: 'Track every stock trade by all 535 members of Congress. Professional analytics, Sharpe ratios, alpha vs S&P 500, and real-time leaderboards.',
}

// ─── Stats Banner ────────────────────────────────────────────────────────────

async function StatsBanner() {
  const stats = await getStats()
  
  const items = [
    { label: 'Congress Members', value: stats.total_members, color: 'text-bitcoin-500' },
    { label: 'Active Traders', value: stats.members_with_trades, color: 'text-white' },
    { label: 'Total Trades', value: stats.total_transactions.toLocaleString(), color: 'text-bitcoin-500' },
    { label: 'Unique Tickers', value: stats.unique_tickers, color: 'text-white' },
    { label: 'Buys', value: stats.total_buys.toLocaleString(), color: 'text-green-400' },
    { label: 'Sells', value: stats.total_sells.toLocaleString(), color: 'text-red-400' },
  ]
  
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-center">
          <p className={`text-2xl md:text-3xl font-bold ${item.color}`}>{item.value}</p>
          <p className="text-xs text-gray-500 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

async function Leaderboard() {
  const { leaderboard } = await getLeaderboard({ sort_by: 'avg_trade_return_pct', limit: 20, min_trades: 3 })
  
  if (!leaderboard?.length) {
    return <div className="text-gray-500 text-center py-8">No performance data available yet. Run the pipeline first.</div>
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
            <th className="text-left py-3 px-2">#</th>
            <th className="text-left py-3 px-2">Politician</th>
            <th className="text-center py-3 px-2">Party</th>
            <th className="text-right py-3 px-2">Trades</th>
            <th className="text-right py-3 px-2">Avg Return</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">Win Rate</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">Sharpe</th>
            <th className="text-right py-3 px-2 hidden lg:table-cell">Alpha vs S&P</th>
            <th className="text-right py-3 px-2 hidden lg:table-cell">Best Trade</th>
            <th className="text-right py-3 px-2 hidden xl:table-cell">Max DD</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((p, i) => (
            <tr key={p.bioguide_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
              <td className="py-3 px-2">
                <span className={`font-bold ${i < 3 ? 'text-bitcoin-500' : 'text-gray-500'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
              </td>
              <td className="py-3 px-2">
                <Link href={`/politicians/${slugify(p.politician_name)}`} className="hover:text-bitcoin-500 transition-colors">
                  <span className="font-medium text-white">{p.politician_name}</span>
                  <span className="text-gray-500 text-xs ml-2">{p.state}</span>
                </Link>
              </td>
              <td className="py-3 px-2 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${partyBadge(p.party)}`}>
                  {p.party}
                </span>
              </td>
              <td className="py-3 px-2 text-right text-gray-300">{p.total_trades}</td>
              <td className={`py-3 px-2 text-right font-bold ${returnColor(p.avg_trade_return_pct)}`}>
                {formatReturn(p.avg_trade_return_pct)}
              </td>
              <td className="py-3 px-2 text-right hidden md:table-cell text-gray-300">
                {p.win_rate != null ? `${p.win_rate.toFixed(0)}%` : '—'}
              </td>
              <td className={`py-3 px-2 text-right hidden md:table-cell ${
                (p.sharpe_ratio ?? 0) > 1 ? 'text-green-400' : (p.sharpe_ratio ?? 0) < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {p.sharpe_ratio != null ? p.sharpe_ratio.toFixed(2) : '—'}
              </td>
              <td className={`py-3 px-2 text-right hidden lg:table-cell font-medium ${returnColor(p.alpha_vs_sp500)}`}>
                {formatReturn(p.alpha_vs_sp500)}
              </td>
              <td className={`py-3 px-2 text-right hidden lg:table-cell ${returnColor(p.best_trade_pct)}`}>
                {p.best_trade_pct != null ? `${formatReturn(p.best_trade_pct)} (${p.best_trade_ticker})` : '—'}
              </td>
              <td className="py-3 px-2 text-right hidden xl:table-cell text-red-400">
                {p.max_drawdown_pct != null ? `-${p.max_drawdown_pct.toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Recent Trades ──────────────────────────────────────────────────────────

async function RecentTrades() {
  const { trades } = await getTrades({ page: 1, per_page: 20, sort_by: 'transaction_date', sort_dir: 'desc' })
  
  if (!trades?.length) {
    return <div className="text-gray-500 text-center py-8">No trades available yet.</div>
  }
  
  return (
    <div className="space-y-2">
      {trades.map((t, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800/50 rounded-lg hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg">{txTypeEmoji(t.transaction_type)}</span>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/politicians/${slugify(t.politician_name)}`} className="font-medium text-white hover:text-bitcoin-500">
                  {t.politician_name}
                </Link>
                {t.party && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${partyBadge(t.party)}`}>{t.party}</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {txTypeLabel(t.transaction_type)} <span className="text-white font-mono">${t.ticker || '???'}</span>
                {t.amount_display && <span className="ml-2">• {t.amount_display}</span>}
                {t.owner && t.owner !== 'Self' && <span className="ml-2">• via {t.owner}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${returnColor(t.return_pct)}`}>
              {formatReturn(t.return_pct)}
            </div>
            <div className="text-xs text-gray-500">{t.transaction_date}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Popular Tickers ────────────────────────────────────────────────────────

async function PopularTickers() {
  const { tickers } = await getPopularTickers(15)
  
  if (!tickers?.length) return null
  
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
      {tickers.map((t, i) => (
        <div key={t.ticker} className="bg-gray-900/60 border border-gray-800/50 rounded-lg p-3 text-center hover:border-bitcoin-500/30 transition-colors">
          <div className="font-mono font-bold text-white">${t.ticker}</div>
          <div className="text-xs text-gray-500 mt-1">
            {t.trade_count} trades • {t.politician_count} pols
          </div>
          <div className="flex justify-center gap-2 mt-1 text-xs">
            <span className="text-green-400">{t.buys}B</span>
            <span className="text-red-400">{t.sells}S</span>
          </div>
          {t.avg_return != null && (
            <div className={`text-xs mt-1 font-medium ${returnColor(t.avg_return)}`}>
              {formatReturn(t.avg_return)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Party Comparison ───────────────────────────────────────────────────────

async function PartyStats() {
  const comparison = await getPartyComparison()
  
  if (!comparison || !Object.keys(comparison).length) return null
  
  const parties = [
    { key: 'D', label: 'Democrats', color: 'blue' },
    { key: 'R', label: 'Republicans', color: 'red' },
    { key: 'I', label: 'Independents', color: 'purple' },
  ]
  
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {parties.map(({ key, label, color }) => {
        const data = comparison[key]
        if (!data) return null
        
        return (
          <div key={key} className={`bg-gray-900/60 border border-${color}-500/30 rounded-lg p-4`}>
            <h3 className={`text-${color}-400 font-bold text-lg mb-3`}>{label}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Active Traders</span>
                <span className="text-white">{data.politicians}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Trades</span>
                <span className="text-white">{data.total_trades?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Return</span>
                <span className={returnColor(data.avg_return)}>{formatReturn(data.avg_return)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Win Rate</span>
                <span className="text-white">{data.avg_win_rate?.toFixed(0) || '—'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Alpha</span>
                <span className={returnColor(data.avg_alpha)}>{formatReturn(data.avg_alpha)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Disclosure Delay</span>
                <span className="text-yellow-400">{data.avg_delay?.toFixed(0) || '—'} days</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default async function ComprehensivePoliticianPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">
            🏛️ Politician Trading Intelligence
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
            Tracking every stock trade by all 535 members of Congress. 
            Professional-grade analytics with Sharpe ratios, alpha benchmarking, and real-time updates.
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Link href="/politicians" className="text-sm text-gray-400 hover:text-white px-3 py-1 border border-gray-700 rounded-full">
              Simple View
            </Link>
            <Link href="/politicians/comprehensive" className="text-sm text-bitcoin-500 px-3 py-1 border border-bitcoin-500/50 rounded-full bg-bitcoin-500/10">
              Advanced Analytics
            </Link>
            <Link href="/politicians/leaderboard" className="text-sm text-gray-400 hover:text-white px-3 py-1 border border-gray-700 rounded-full">
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <StatsBanner />

        {/* Party Comparison */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-bitcoin-500" />
            Party Performance Comparison
          </h2>
          <PartyStats />
        </section>

        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-bitcoin-500" />
              Performance Leaderboard
            </h2>
            <Link href="/politicians/leaderboard" className="text-sm text-bitcoin-500 hover:text-bitcoin-400 flex items-center gap-1">
              Full Leaderboard <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <Leaderboard />
          </div>
        </section>

        {/* Two columns: Recent Trades + Popular Tickers */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-bitcoin-500" />
              Recent Trades
            </h2>
            <RecentTrades />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-bitcoin-500" />
              Most Traded Tickers
            </h2>
            <PopularTickers />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 pt-8 border-t border-gray-800">
          Data sourced from official House and Senate financial disclosures, Capitol Trades, and QuiverQuant.
          Updated automatically. Not financial advice. 
          <br />
          <span className="text-bitcoin-500">BTCIntelVault</span> — Institutional-grade politician trading intelligence.
        </div>
      </div>
    </div>
  )
}
