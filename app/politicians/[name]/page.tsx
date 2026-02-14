import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Calendar, ExternalLink, Clock, User } from 'lucide-react'
import Link from 'next/link'
import {
  getPoliticianDetail, getPoliticianSummaries,
  partyColor, partyBg, partyName, tradeTypeColor, tradeTypeEmoji,
  returnColor, formatReturn,
} from '../../lib/politician-data'
import PoliticianPerformanceChart from '../../components/PoliticianPerformanceChart'

export async function generateMetadata({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name)
  return {
    title: `${name} - Stock Trading Activity | BTCIntelVault`,
    description: `Complete stock trading history for ${name}. View all trades, dates, performance metrics across multiple timeframes. Tracked by BTCIntelVault.`,
  }
}

export async function generateStaticParams() {
  // Return empty array during build - pages will be generated dynamically
  return []
}

function PoliticianAvatar({ name, party, photoUrl, large = false }: { name: string; party: string; photoUrl?: string; large?: boolean }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bgColor = party === 'R' ? 'bg-gradient-to-br from-red-600 to-red-700' : 
                   party === 'D' ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 
                   'bg-gradient-to-br from-purple-600 to-purple-700'
  const size = large ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-base'
  
  if (photoUrl) {
    return (
      <img 
        src={photoUrl} 
        alt={name}
        className={`${large ? 'w-20 h-20' : 'w-12 h-12'} rounded-full object-cover shadow-lg border-4 border-gray-700`}
      />
    )
  }
  
  return (
    <div className={`${size} ${bgColor} rounded-full flex items-center justify-center font-bold text-white shadow-lg border-4 border-gray-700`}>
      {initials}
    </div>
  )
}

// Performance timeframe pill
function TimeframePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center min-w-[80px]">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${returnColor(value)}`}>
        {formatReturn(value)}
      </p>
    </div>
  )
}

export default async function PoliticianPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name)
  // Fetch with timeframes enabled for detail view
  const politician = await getPoliticianDetail(name)
  
  if (!politician) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">Politician not found</h1>
        <Link href="/politicians" className="text-bitcoin-500 hover:text-bitcoin-400 mt-4 inline-block">
          ← Back to all politicians
        </Link>
      </div>
    )
  }

  const trades: any[] = politician.trades || []
  const withReturns = trades.filter((t: any) => t.return_pct != null)
  const perf = (politician as any).performance || {} as any
  
  // SEC filing links
  const chamberFilingUrl = politician.chamber === 'Senate'
    ? 'https://efdsearch.senate.gov/search/'
    : 'https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure'

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link href="/politicians" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to All Politicians
      </Link>

      {/* ──── Profile Header ──── */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar + Info */}
          <div className="flex items-center gap-5">
            <PoliticianAvatar name={politician.name} party={politician.party} photoUrl={politician.photo_url} large />
            <div>
              <h1 className="text-3xl font-bold mb-1">{politician.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${partyBg(politician.party)}`}>
                  <span className={partyColor(politician.party)}>
                    {partyName(politician.party)}
                  </span>
                </span>
                <span className="text-gray-400 text-sm">
                  {politician.chamber}{politician.state ? ` · ${politician.state}` : ''}
                </span>
              </div>
              <a 
                href={chamberFilingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-bitcoin-400 mt-2 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View SEC Filings ({politician.chamber})
              </a>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="md:ml-auto flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{politician.total_trades}</p>
              <p className="text-sm text-gray-400">Total Trades</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${returnColor(perf['alltime'] ?? politician.avg_return_pct)}`}>
                {formatReturn(perf['alltime'] ?? politician.avg_return_pct)}
              </p>
              <p className="text-sm text-gray-400">All-Time Return</p>
            </div>
          </div>
        </div>
      </div>

      {/* ──── Multi-Timeframe Performance ──── */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-bitcoin-500" />
          Portfolio Performance
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Average return across all open BUY positions over each timeframe.
        </p>
        <div className="flex flex-wrap gap-3">
          <TimeframePill label="1D" value={perf['1d'] ?? null} />
          <TimeframePill label="5D" value={perf['5d'] ?? null} />
          <TimeframePill label="7D" value={perf['7d'] ?? null} />
          <TimeframePill label="30D" value={perf['30d'] ?? null} />
          <TimeframePill label="3M" value={perf['3m'] ?? null} />
          <TimeframePill label="YTD" value={perf['ytd'] ?? null} />
          <TimeframePill label="1Y" value={perf['1y'] ?? null} />
          <TimeframePill label="5Y" value={perf['5y'] ?? null} />
          <TimeframePill label="All-Time" value={perf['alltime'] ?? null} />
        </div>
      </div>

      {/* ──── Performance Chart ──── */}
      <PoliticianPerformanceChart trades={trades} />

      {/* ──── Quick Stats Grid ──── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{politician.buys}</p>
          <p className="text-xs text-gray-400">Buys</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{politician.sells}</p>
          <p className="text-xs text-gray-400">Sells</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">{politician.unique_tickers}</p>
          <p className="text-xs text-gray-400">Tickers</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className={`text-2xl font-bold ${returnColor(politician.best_return_pct)}`}>
            {formatReturn(politician.best_return_pct)}
          </p>
          <p className="text-xs text-gray-400">Best Trade</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className={`text-2xl font-bold ${returnColor(politician.worst_return_pct)}`}>
            {formatReturn(politician.worst_return_pct)}
          </p>
          <p className="text-xs text-gray-400">Worst Trade</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">{withReturns.length}</p>
          <p className="text-xs text-gray-400">Tracked</p>
        </div>
      </div>

      {/* ──── Portfolio Holdings ──── */}
      {politician.top_tickers && politician.top_tickers.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-bitcoin-500" />
            Portfolio Holdings ({politician.top_tickers.length} stocks)
          </h2>
          <p className="text-sm text-gray-400 mb-4">Most actively traded stocks based on transaction frequency</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {politician.top_tickers.map((ticker, index) => (
              <div key={ticker} className="group">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 text-center hover:border-bitcoin-500/50 transition-all group-hover:scale-105">
                  <div className="text-lg font-bold text-bitcoin-400 font-mono mb-1">
                    {ticker}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{index + 1} most traded
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              Portfolio represents most frequently traded stocks, not current holdings or position sizes
            </p>
          </div>
        </div>
      )}

      {/* ──── Complete Trade History (Chronological, newest first) ──── */}
      <div className="card">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-bitcoin-500" />
          Complete Trade History
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          {trades.length} trades shown, newest first. All dates from official disclosure filings.
        </p>
        
        {/* Timeline-style trade list */}
        <div className="space-y-4">
          {trades.map((trade, i) => {
            const prevTrade = trades[i - 1]
            // Show month/year divider when the month changes
            const curMonth = trade.trade_date_display?.slice(0, 3) + ' ' + trade.trade_date_display?.slice(-4)
            const prevMonth = prevTrade
              ? prevTrade.trade_date_display?.slice(0, 3) + ' ' + prevTrade.trade_date_display?.slice(-4)
              : null
            const showDivider = curMonth !== prevMonth

            return (
              <div key={trade.id || i}>
                {/* Month divider */}
                {showDivider && (
                  <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
                    <div className="h-px flex-1 bg-gray-700" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      {curMonth}
                    </span>
                    <div className="h-px flex-1 bg-gray-700" />
                  </div>
                )}

                {/* Trade card */}
                <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg p-4 hover:border-gray-600 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Date column */}
                    <div className="md:w-36 flex-shrink-0">
                      <p className="text-white font-semibold text-sm">
                        {trade.trade_date_display || trade.trade_date || 'Unknown'}
                      </p>
                      {trade.days_held != null && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {trade.days_held === 0 ? 'Today' : trade.days_held === 1 ? '1 day ago' : `${trade.days_held} days ago`}
                        </p>
                      )}
                    </div>

                    {/* Trade direction */}
                    <div className="md:w-20 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${tradeTypeColor(trade.trade_type)}`}>
                        {tradeTypeEmoji(trade.trade_type)} {trade.trade_type}
                      </span>
                    </div>

                    {/* Ticker & Asset */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        {trade.ticker ? (
                          <span className="text-white font-bold font-mono text-lg">${trade.ticker}</span>
                        ) : null}
                        <span className="text-gray-400 text-sm truncate">
                          {trade.asset_name || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Size: {trade.size_range || 'N/A'}</span>
                        {trade.owner && trade.owner !== 'Self' && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {trade.owner}
                          </span>
                        )}
                        {trade.published && (
                          <span>Published: {trade.published}</span>
                        )}
                      </div>
                    </div>

                    {/* Price & Return */}
                    <div className="md:text-right flex-shrink-0">
                      <div className="flex items-center gap-4 md:justify-end">
                        <div>
                          <p className="text-xs text-gray-500">Trade Price</p>
                          <p className="text-white font-medium">
                            {trade.purchase_price ? `$${trade.purchase_price.toFixed(2)}` : (trade.price || 'N/A')}
                          </p>
                        </div>
                        {trade.current_price && (
                          <div>
                            <p className="text-xs text-gray-500">Current</p>
                            <p className="text-white font-medium">${trade.current_price.toFixed(2)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Return</p>
                          <p className={`text-lg font-bold ${returnColor(trade.return_pct)}`}>
                            {formatReturn(trade.return_pct)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mini timeframe returns (if available) */}
                      {(trade.return_1d != null || trade.return_5d != null || trade.return_30d != null) && (
                        <div className="flex items-center gap-2 mt-2 md:justify-end text-xs">
                          {trade.return_1d != null && (
                            <span className={`${returnColor(trade.return_1d)} bg-gray-900 px-1.5 py-0.5 rounded`}>
                              1D: {formatReturn(trade.return_1d)}
                            </span>
                          )}
                          {trade.return_5d != null && (
                            <span className={`${returnColor(trade.return_5d)} bg-gray-900 px-1.5 py-0.5 rounded`}>
                              5D: {formatReturn(trade.return_5d)}
                            </span>
                          )}
                          {trade.return_30d != null && (
                            <span className={`${returnColor(trade.return_30d)} bg-gray-900 px-1.5 py-0.5 rounded`}>
                              30D: {formatReturn(trade.return_30d)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ──── SEC Filing Links ──── */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-bitcoin-500" />
          Official Sources
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          All trade data is sourced from official congressional financial disclosures filed under the STOCK Act.
        </p>
        <div className="flex flex-wrap gap-3">
          <a 
            href={chamberFilingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-sm hover:border-bitcoin-500/50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {politician.chamber === 'Senate' ? 'Senate eFD Search' : 'House Financial Disclosures'}
          </a>
          <a 
            href="https://www.capitoltrades.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-sm hover:border-bitcoin-500/50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Capitol Trades
          </a>
        </div>
      </div>

      {/* ──── CTA ──── */}
      <div className="card text-center py-8 bg-gradient-to-r from-gray-900 to-gray-800 border-bitcoin-500/20">
        <h3 className="text-xl font-bold mb-2">Get Instant Alerts for {politician.name}'s Trades</h3>
        <p className="text-gray-400 text-sm mb-4">
          Follow @BTCIntelVault on X for real-time notifications.
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
