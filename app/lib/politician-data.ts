// Politician trading data - reads from static JSON files
import { readFileSync } from 'fs'
import { join } from 'path'

const dataDir = join(process.cwd(), 'data')

function loadJSON(file: string) {
  try {
    return JSON.parse(readFileSync(join(dataDir, file), 'utf-8'))
  } catch (e) {
    console.error(`Failed to load ${file}:`, e)
    return null
  }
}

// Cache loaded data in memory during build/request
let _trades: any[] | null = null
let _summaries: any[] | null = null
let _stats: any | null = null
let _members: any[] | null = null

function getTrades_() {
  if (!_trades) _trades = loadJSON('trades.json') || []
  return _trades!
}
function getSummaries_() {
  if (!_summaries) _summaries = loadJSON('politician-summaries.json') || []
  return _summaries!
}
function getStats_() {
  if (!_stats) _stats = loadJSON('stats.json') || {}
  return _stats!
}
function getMembers_() {
  if (!_members) _members = loadJSON('congress-members.json') || []
  return _members!
}

export interface PoliticianTrade {
  id: number
  politician_name: string
  bioguide_id: string
  party: string
  chamber: string
  state: string
  ticker: string
  asset_name: string
  transaction_type: string
  transaction_date: string
  disclosure_date: string
  amount_display: string
  owner: string
  price_at_trade: number | null
  price_current: number | null
  return_pct: number | null
  photo_url: string
  in_office: number
  // Mapped fields for compatibility
  politician?: string
  trade_type?: string
  trade_date?: string
  size_range?: string
  price?: string
}

export interface PoliticianSummary {
  name: string
  party: string
  chamber: string
  state: string
  photo_url: string
  bioguide_id: string
  in_office: number
  total_trades: number
  buys: number
  sells: number
  unique_tickers: number
  top_tickers: string[]
  avg_return_pct: number | null
  best_return_pct: number | null
  worst_return_pct: number | null
  trades?: PoliticianTrade[]
}

export interface TradeStats {
  total_trades: number
  unique_politicians: number
  unique_tickers: number
  total_buys: number
  total_sells: number
  total_unknown: number
  last_updated: string
}

function mapTrade(t: any): PoliticianTrade & { politician: string; trade_type: string; trade_date: string; size_range: string; price: string } {
  return {
    ...t,
    politician: t.politician_name,
    trade_type: t.transaction_type,
    trade_date: t.transaction_date,
    size_range: t.amount_display || '',
    price: t.price_at_trade ? `$${t.price_at_trade}` : 'N/A',
  }
}

export async function getTradeStats(): Promise<TradeStats> {
  return getStats_()
}

export async function getTrades(page = 1, perPage = 25, filters?: {
  politician?: string
  ticker?: string
  party?: string
}): Promise<{ trades: any[]; total: number; total_pages: number }> {
  let all = getTrades_()
  
  if (filters?.politician) {
    const p = filters.politician.toLowerCase()
    all = all.filter((t: any) => t.politician_name?.toLowerCase().includes(p))
  }
  if (filters?.ticker) {
    const tk = filters.ticker.toUpperCase()
    all = all.filter((t: any) => t.ticker === tk)
  }
  if (filters?.party) {
    all = all.filter((t: any) => t.party === filters.party)
  }
  
  const total = all.length
  const start = (page - 1) * perPage
  const trades = all.slice(start, start + perPage).map(mapTrade)
  
  return { trades, total, total_pages: Math.ceil(total / perPage) }
}

export async function getPoliticianSummaries(): Promise<PoliticianSummary[]> {
  return getSummaries_()
}

export async function getPoliticianDetail(name: string): Promise<PoliticianSummary | null> {
  const summaries = getSummaries_()
  const summary = summaries.find((s: any) => 
    s.name.toLowerCase() === decodeURIComponent(name).toLowerCase()
  )
  if (!summary) return null
  
  // Try loading per-politician file first (much smaller than full trades.json)
  const safeName = summary.name.replace(/ /g, '_').replace(/\./g, '').replace(/'/g, '')
  let rawTrades: any[] = []
  try {
    const polFile = join(dataDir, 'politician-trades', `${safeName}.json`)
    rawTrades = JSON.parse(readFileSync(polFile, 'utf-8'))
  } catch {
    // Fallback to full trades file
    const allTrades = getTrades_()
    rawTrades = allTrades
      .filter((t: any) => t.politician_name === summary.name)
      .sort((a: any, b: any) => (b.transaction_date || '').localeCompare(a.transaction_date || ''))
      .slice(0, 500)
  }
  
  const trades = rawTrades.map(mapTrade)
  return { ...summary, trades }
}

export async function getLeaderboard(sortBy = 'total_trades', limit = 50): Promise<PoliticianSummary[]> {
  const summaries = getSummaries_()
  const sorted = [...summaries].sort((a: any, b: any) => {
    if (sortBy === 'avg_return') return (b.avg_return_pct || 0) - (a.avg_return_pct || 0)
    if (sortBy === 'worst_return') return (a.avg_return_pct || 0) - (b.avg_return_pct || 0)
    if (sortBy === 'most_trades' || sortBy === 'total_trades') return b.total_trades - a.total_trades
    return b.total_trades - a.total_trades
  })
  return sorted.slice(0, limit)
}

// Formatting helpers
export function partyColor(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'text-red-400'
    case 'D': return 'text-blue-400'
    case 'I': return 'text-purple-400'
    default: return 'text-gray-400'
  }
}

export function partyBg(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'bg-red-500/20 border-red-500/30'
    case 'D': return 'bg-blue-500/20 border-blue-500/30'
    case 'I': return 'bg-purple-500/20 border-purple-500/30'
    default: return 'bg-gray-500/20 border-gray-500/30'
  }
}

export function partyName(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'Republican'
    case 'D': return 'Democrat'
    case 'I': return 'Independent'
    default: return party || 'Unknown'
  }
}

export function tradeTypeColor(type: string): string {
  const upper = type?.toUpperCase() || ''
  if (upper.includes('BUY') || upper.includes('PURCHASE')) return 'text-green-400'
  if (upper.includes('SELL') || upper.includes('SALE')) return 'text-red-400'
  return 'text-yellow-400'
}

export function tradeTypeEmoji(type: string): string {
  const upper = type?.toUpperCase() || ''
  if (upper.includes('BUY') || upper.includes('PURCHASE')) return '🟢'
  if (upper.includes('SELL') || upper.includes('SALE')) return '🔴'
  return '🔄'
}

export function returnColor(val: number | null | undefined): string {
  if (val == null) return 'text-gray-500'
  if (val > 0) return 'text-green-400'
  if (val < 0) return 'text-red-400'
  return 'text-gray-400'
}

export function formatReturn(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}
