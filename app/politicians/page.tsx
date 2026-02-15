import { Users, TrendingUp, TrendingDown, BarChart3, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  getTradeStats, getTrades, getPoliticianSummaries, getPoliticianDetail,
  partyColor, partyBg, partyName, tradeTypeColor, tradeTypeEmoji,
  returnColor, formatReturn,
} from '../lib/politician-data'
import PoliticianPhoto from '../components/PoliticianPhoto'
import PoliticianSparkline from '../components/PoliticianSparkline'
import PoliticianFilters from '../components/PoliticianFilters'

export const metadata = {
  title: 'Politician Trading Tracker | BTCIntelVault',
  description: 'Track every stock trade made by US politicians. Real-time alerts, performance tracking, and leaderboards.',
  openGraph: {
    title: 'Politician Trading Tracker | BTCIntelVault',
    description: 'Track every stock trade made by US politicians. 29K+ trades across 202 members of Congress.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

async function StatsBar() {
  const stats = await getTradeStats()
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-bitcoin-500">{stats.total_trades?.toLocaleString()}</p>
        <p className="text-sm text-gray-400">Total Trades</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-white">{stats.unique_politicians}</p>
        <p className="text-sm text-gray-400">Politicians</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-white">{stats.unique_tickers?.toLocaleString()}</p>
        <p className="text-sm text-gray-400">Unique Tickers</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-green-400">{stats.total_buys?.toLocaleString()}</p>
        <p className="text-sm text-gray-400">Buys</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-red-400">{stats.total_sells?.toLocaleString()}</p>
        <p className="text-sm text-gray-400">Sells</p>
      </div>
    </div>
  )
}

function PoliticianAvatar({ name, party, photoUrl, large = false }: { name: string; party: string; photoUrl?: string; large?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bgColor = party === 'R' ? 'bg-gradient-to-br from-red-600 to-red-700' : 
                   party === 'D' ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 
                   'bg-gradient-to-br from-purple-600 to-purple-700'
  const size = large ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-sm'
  
  if (photoUrl) {
    return (
      <PoliticianPhoto 
        src={photoUrl} 
        alt={name}
        className={`${large ? 'w-16 h-16' : 'w-12 h-12'} rounded-full object-cover shadow-lg border-2 border-gray-600`}
      />
    )
  }
  
  return (
    <div className={`${size} ${bgColor} rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-gray-600`}>
      {initials}
    </div>
  )
}

async function PoliticianCards({ page, party, sort, q }: { page: number; party: string; sort: string; q: string }) {
  let summaries = await getPoliticianSummaries()
  
  // Filter by party
  if (party) {
    summaries = summaries.filter(s => s.party === party)
  }
  
  // Filter by search query
  if (q) {
    const lower = q.toLowerCase()
    summaries = summaries.filter(s => s.name.toLowerCase().includes(lower))
  }
  
  // Sort
  switch (sort) {
    case 'best_return':
      summaries = [...summaries].sort((a, b) => (b.avg_return_pct || -999) - (a.avg_return_pct || -999))
      break
    case 'worst_return':
      summaries = [...summaries].sort((a, b) => (a.avg_return_pct || 999) - (b.avg_return_pct || 999))
      break
    case 'alpha':
      summaries = [...summaries].sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'most_trades':
    default:
      summaries = [...summaries].sort((a, b) => b.total_trades - a.total_trades)
      break
  }
  
  const perPage = 24
  const totalPages = Math.ceil(summaries.length / perPage)
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const top = summaries.slice((currentPage - 1) * perPage, currentPage * perPage)
  
  // Build query string for pagination links
  const qs = new URLSearchParams()
  if (party) qs.set('party', party)
  if (sort && sort !== 'most_trades') qs.set('sort', sort)
  if (q) qs.set('q', q)
  const qsStr = qs.toString()
  const qsPrefix = qsStr ? `&${qsStr}` : ''

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-bitcoin-500" />
          {q ? `Results for "${q}"` : 'Active Politicians'}
          <span className="text-sm font-normal text-gray-400">({summaries.length})</span>
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
            <div className="flex items-start gap-3 mb-4">
              <PoliticianAvatar name={pol.name} party={pol.party} photoUrl={pol.photo_url} />
              <div className="flex-grow min-w-0">
                <h3 className="font-semibold text-white group-hover:text-bitcoin-400 transition-colors truncate">
                  {pol.name}
                </h3>
                <p className="text-xs text-gray-400 mb-2">
                  <span className={partyColor(pol.party)}>{partyName(pol.party)}</span>
                  {' · '}{pol.chamber}{pol.state ? ` · ${pol.state}` : ''}
                </p>
                <div className={`text-lg font-bold ${returnColor(pol.avg_return_pct)}`}>
                  {formatReturn(pol.avg_return_pct)} avg per trade
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-900 rounded p-2 text-center">
                <p className="text-xs text-gray-500">Best Trade</p>
                <p className={`text-sm font-bold ${returnColor(pol.best_return_pct)}`}>
                  {formatReturn(pol.best_return_pct)}
                </p>
              </div>
              <div className="bg-gray-900 rounded p-2 text-center">
                <p className="text-xs text-gray-500">Worst Trade</p>
                <p className={`text-sm font-bold ${returnColor(pol.worst_return_pct)}`}>
                  {formatReturn(pol.worst_return_pct)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
              <span>{pol.total_trades} trades</span>
              <span className="text-green-400">{pol.buys} buys</span>
              <span className="text-red-400">{pol.sells} sells</span>
            </div>
            
            {pol.top_tickers && pol.top_tickers.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Portfolio:
                </p>
                <div className="flex flex-wrap gap-1">
                  {pol.top_tickers.slice(0, 5).map(ticker => (
                    <span key={ticker} className="text-xs bg-gradient-to-r from-blue-500/20 to-blue-400/20 border border-blue-500/30 text-blue-400 px-2 py-1 rounded font-mono font-bold">
                      {ticker}
                    </span>
                  ))}
                  {pol.top_tickers.length > 5 && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                      +{pol.top_tickers.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {top.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No politicians found matching your filters.</p>
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          {currentPage > 1 ? (
            <Link
              href={`/politicians?page=${currentPage - 1}${qsPrefix}`}
              className="px-5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-bitcoin-500/50 transition-colors"
            >
              ← Previous
            </Link>
          ) : (
            <span className="px-5 py-2.5 bg-gray-800/50 border border-gray-800 rounded-lg text-gray-600 cursor-not-allowed">
              ← Previous
            </span>
          )}
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages} · {summaries.length} politicians
          </span>
          {currentPage < totalPages ? (
            <Link
              href={`/politicians?page=${currentPage + 1}${qsPrefix}`}
              className="px-5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-bitcoin-500/50 transition-colors"
            >
              Next →
            </Link>
          ) : (
            <span className="px-5 py-2.5 bg-gray-800/50 border border-gray-800 rounded-lg text-gray-600 cursor-not-allowed">
              Next →
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default async function PoliticiansPage({ searchParams }: { searchParams: Promise<{ page?: string; party?: string; sort?: string; q?: string }> }) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const party = params.party || ''
  const sort = params.sort || 'most_trades'
  const q = params.q || ''

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-red-500 bg-clip-text text-transparent">
          Politician Trading Tracker
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Track every stock trade made by US Congress members. Real-time alerts, 
          performance tracking, and transparency leaderboards.
        </p>
      </div>

      <Suspense fallback={null}>
        <PoliticianFilters />
      </Suspense>

      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-semibold">LIVE DATA</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Sourced from Capitol Trades • Updated regularly • Follow @BTCIntelVault for instant alerts
        </p>
      </div>

      <StatsBar />
      <PoliticianCards page={page} party={party} sort={sort} q={q} />
      
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
