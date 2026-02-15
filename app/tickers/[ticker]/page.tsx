import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Users } from 'lucide-react'
import Link from 'next/link'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  partyColor, partyBg, partyName, tradeTypeColor, tradeTypeEmoji,
} from '../../lib/politician-data'
import PoliticianPhoto from '../../components/PoliticianPhoto'

const dataDir = join(process.cwd(), 'data')

function loadJSON(file: string) {
  try { return JSON.parse(readFileSync(join(dataDir, file), 'utf-8')) }
  catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const t = ticker.toUpperCase()
  return {
    title: `${t} - Congressional Trading Activity | BTCIntelVault`,
    description: `See which politicians are trading ${t}. Buy/sell breakdown, trade history, and volume analysis.`,
    openGraph: {
      title: `${t} Congressional Trades | BTCIntelVault`,
      description: `Track all congressional trades in ${t}`,
    },
    twitter: { card: 'summary' },
  }
}

export const dynamic = 'force-dynamic'

export default async function TickerPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  
  // Load ticker summary
  const tickers: any[] = loadJSON('tickers.json') || []
  const tickerInfo = tickers.find(t => t.ticker === ticker)
  
  // Load all trades for this ticker
  const allTrades: any[] = loadJSON('trades.json') || []
  const tickerTrades = allTrades.filter(t => t.ticker === ticker)
  
  if (!tickerInfo && tickerTrades.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">Ticker ${ticker} not found</h1>
        <Link href="/politicians" className="text-bitcoin-500 hover:text-bitcoin-400 mt-4 inline-block">
          ← Back to politicians
        </Link>
      </div>
    )
  }

  // Group trades by politician
  const byPolitician: Record<string, { trades: any[]; buys: number; sells: number; name: string; party: string; chamber: string; photo_url: string }> = {}
  for (const trade of tickerTrades) {
    const name = trade.politician_name
    if (!byPolitician[name]) {
      byPolitician[name] = { trades: [], buys: 0, sells: 0, name, party: trade.party, chamber: trade.chamber, photo_url: trade.photo_url }
    }
    byPolitician[name].trades.push(trade)
    const upper = (trade.transaction_type || '').toUpperCase()
    if (upper.includes('BUY') || upper.includes('PURCHASE')) byPolitician[name].buys++
    else if (upper.includes('SELL') || upper.includes('SALE')) byPolitician[name].sells++
  }

  const politicianList = Object.values(byPolitician).sort((a, b) => b.trades.length - a.trades.length)
  const totalBuys = tickerTrades.filter(t => (t.transaction_type || '').toUpperCase().includes('BUY') || (t.transaction_type || '').toUpperCase().includes('PURCHASE')).length
  const totalSells = tickerTrades.filter(t => (t.transaction_type || '').toUpperCase().includes('SELL') || (t.transaction_type || '').toUpperCase().includes('SALE')).length

  // Get asset name from first trade
  const assetName = tickerTrades[0]?.asset_name || ticker

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Link href="/politicians" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Politicians
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl font-bold font-mono text-bitcoin-400">${ticker}</span>
            </div>
            <p className="text-gray-400 text-lg">{assetName}</p>
          </div>
          <div className="md:ml-auto flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{tickerTrades.length}</p>
              <p className="text-sm text-gray-400">Total Trades</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{politicianList.length}</p>
              <p className="text-sm text-gray-400">Politicians</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{totalBuys}</p>
              <p className="text-sm text-gray-400">Buys</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">{totalSells}</p>
              <p className="text-sm text-gray-400">Sells</p>
            </div>
          </div>
        </div>

        {/* Buy/Sell bar */}
        {(totalBuys + totalSells) > 0 && (
          <div className="mt-6">
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-800">
              <div className="bg-green-500" style={{ width: `${(totalBuys / (totalBuys + totalSells)) * 100}%` }} />
              <div className="bg-red-500" style={{ width: `${(totalSells / (totalBuys + totalSells)) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Buy {((totalBuys / (totalBuys + totalSells)) * 100).toFixed(0)}%</span>
              <span>Sell {((totalSells / (totalBuys + totalSells)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Politicians who traded this */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-bitcoin-500" />
          Politicians Trading ${ticker}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {politicianList.map(pol => (
            <Link
              key={pol.name}
              href={`/politicians/${encodeURIComponent(pol.name)}`}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-bitcoin-500/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                {pol.photo_url ? (
                  <PoliticianPhoto src={pol.photo_url} alt={pol.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                    {pol.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-bitcoin-400 transition-colors truncate">
                    {pol.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    <span className={partyColor(pol.party)}>{partyName(pol.party)}</span>
                    {' · '}{pol.chamber}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{pol.trades.length} trades</span>
                <span className="text-green-400">{pol.buys} buys</span>
                <span className="text-red-400">{pol.sells} sells</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent trades table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-bitcoin-500" />
          Trade History ({tickerTrades.length} trades)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Politician</th>
                <th className="text-left py-3 px-2">Party</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-left py-3 px-2">Size</th>
                <th className="text-left py-3 px-2">Owner</th>
              </tr>
            </thead>
            <tbody>
              {tickerTrades.slice(0, 100).map((trade, i) => (
                <tr key={trade.id || i} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-2 text-gray-400 text-xs whitespace-nowrap">{trade.transaction_date}</td>
                  <td className="py-3 px-2">
                    <Link href={`/politicians/${encodeURIComponent(trade.politician_name)}`} className="text-bitcoin-500 hover:text-bitcoin-400 font-medium">
                      {trade.politician_name}
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${partyBg(trade.party)}`}>
                      <span className={partyColor(trade.party)}>{trade.party || '?'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={tradeTypeColor(trade.transaction_type)}>
                      {tradeTypeEmoji(trade.transaction_type)} {trade.transaction_type}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-300 text-xs">{trade.amount_display}</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{trade.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tickerTrades.length > 100 && (
            <p className="text-center text-gray-500 text-sm mt-4">Showing first 100 of {tickerTrades.length} trades</p>
          )}
        </div>
      </div>
    </div>
  )
}
