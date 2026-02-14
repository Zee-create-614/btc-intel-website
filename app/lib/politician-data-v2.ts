/**
 * Politician Trading Intelligence Data Layer v2
 * Reads from static JSON data files (no external API needed)
 */
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

let _trades: any[] | null = null
let _summaries: any[] | null = null
let _stats: any | null = null
let _members: any[] | null = null
let _tickers: any[] | null = null

function allTrades() { if (!_trades) _trades = loadJSON('trades.json') || []; return _trades! }
function allSummaries() { if (!_summaries) _summaries = loadJSON('politician-summaries.json') || []; return _summaries! }
function statsData() { if (!_stats) _stats = loadJSON('stats.json') || {}; return _stats! }
function allMembers() { if (!_members) _members = loadJSON('congress-members.json') || []; return _members! }
function allTickers() { if (!_tickers) _tickers = loadJSON('tickers.json') || []; return _tickers! }

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CongressMember {
  bioguide_id: string
  full_name: string
  party: string
  state: string
  chamber: string
  district?: string
  photo_url?: string
  twitter?: string
  website?: string
  in_office?: number
  trade_count?: number
}

export interface Transaction {
  id: number
  bioguide_id: string
  politician_name: string
  ticker: string
  asset_name: string
  transaction_type: string
  transaction_date: string
  disclosure_date?: string
  amount_display: string
  owner?: string
  return_pct?: number
  price_at_trade?: number
  price_current?: number
  party?: string
  chamber?: string
  state?: string
  photo_url?: string
}

export interface PortfolioPerformance {
  bioguide_id: string
  name: string
  politician_name?: string
  party: string
  chamber: string
  state: string
  total_trades: number
  total_buys: number
  total_sells: number
  unique_tickers: number
  total_invested_min: number
  total_invested_max: number
  total_return_pct?: number
  avg_trade_return_pct?: number
  best_trade_pct?: number
  worst_trade_pct?: number
  sharpe_ratio?: number
  alpha?: number
  alpha_vs_sp500?: number
  win_rate?: number
  best_trade_ticker?: string
  max_drawdown_pct?: number
  photo_url?: string
  top_tickers?: string[]
}

export interface SystemStats {
  total_members: number
  total_transactions: number
  members_with_trades: number
  unique_tickers: number
  total_buys: number
  total_sells: number
  total_filings: number
  sources: Record<string, number>
  last_scrape?: string
}

export interface TickerInfo {
  ticker: string
  trade_count: number
  politician_count: number
  buys: number
  sells: number
  avg_return?: number
  last_trade_date?: string
}

export interface PartyComparison {
  [party: string]: {
    politicians: number
    avg_return?: number
    avg_win_rate?: number
    avg_alpha?: number
    avg_delay?: number
    total_trades: number
  }
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

export async function getStats(): Promise<SystemStats> {
  const s = statsData()
  return {
    total_members: 538,
    total_transactions: s.total_trades || 0,
    members_with_trades: s.unique_politicians || 0,
    unique_tickers: s.unique_tickers || 0,
    total_buys: s.total_buys || 0,
    total_sells: s.total_sells || 0,
    total_filings: 0,
    sources: { capitol_trades: s.total_trades || 0 },
  }
}

export async function getRoster(opts?: {
  chamber?: string; party?: string; state?: string; has_trades?: boolean;
  page?: number; per_page?: number;
}): Promise<{ members: CongressMember[]; total: number; total_pages: number }> {
  let members = allMembers()
  if (opts?.chamber) members = members.filter((m: any) => m.chamber === opts.chamber)
  if (opts?.party) members = members.filter((m: any) => m.party === opts.party)
  if (opts?.state) members = members.filter((m: any) => m.state === opts.state)
  
  if (opts?.has_trades) {
    const tradingNames = new Set(allSummaries().map((s: any) => s.bioguide_id))
    members = members.filter((m: any) => tradingNames.has(m.bioguide_id))
  }
  
  const page = opts?.page || 1
  const perPage = opts?.per_page || 50
  const total = members.length
  const start = (page - 1) * perPage
  
  return {
    members: members.slice(start, start + perPage),
    total,
    total_pages: Math.ceil(total / perPage),
  }
}

export async function getTrades(opts?: {
  page?: number; per_page?: number; politician?: string; ticker?: string;
  party?: string; chamber?: string; tx_type?: string; sort_by?: string; sort_dir?: string;
}): Promise<{ trades: Transaction[]; total: number; total_pages: number }> {
  let trades = allTrades()
  
  if (opts?.politician) {
    const p = opts.politician.toLowerCase()
    trades = trades.filter((t: any) => t.politician_name?.toLowerCase().includes(p))
  }
  if (opts?.ticker) trades = trades.filter((t: any) => t.ticker === opts.ticker)
  if (opts?.party) trades = trades.filter((t: any) => t.party === opts.party)
  if (opts?.chamber) trades = trades.filter((t: any) => t.chamber === opts.chamber)
  if (opts?.tx_type) trades = trades.filter((t: any) => t.transaction_type === opts.tx_type)
  
  if (opts?.sort_by) {
    const dir = opts.sort_dir === 'asc' ? 1 : -1
    trades.sort((a: any, b: any) => {
      const av = a[opts.sort_by!] ?? ''
      const bv = b[opts.sort_by!] ?? ''
      return av < bv ? -dir : av > bv ? dir : 0
    })
  }

  const page = opts?.page || 1
  const perPage = opts?.per_page || 50
  const total = trades.length
  const start = (page - 1) * perPage
  
  return {
    trades: trades.slice(start, start + perPage),
    total,
    total_pages: Math.ceil(total / perPage),
  }
}

export async function getLeaderboard(opts?: {
  sort_by?: string; sort_dir?: string; party?: string; chamber?: string;
  min_trades?: number; limit?: number;
}): Promise<{ leaderboard: PortfolioPerformance[]; total: number }> {
  let summaries = allSummaries()
  
  if (opts?.party) summaries = summaries.filter((s: any) => s.party === opts.party)
  if (opts?.chamber) summaries = summaries.filter((s: any) => s.chamber === opts.chamber)
  if (opts?.min_trades) summaries = summaries.filter((s: any) => s.total_trades >= opts.min_trades!)
  
  const sortBy = opts?.sort_by || 'total_trades'
  const dir = opts?.sort_dir === 'asc' ? 1 : -1
  
  summaries.sort((a: any, b: any) => {
    if (sortBy === 'avg_trade_return_pct') return dir * ((b.avg_return_pct || 0) - (a.avg_return_pct || 0))
    if (sortBy === 'total_trades') return dir * (b.total_trades - a.total_trades)
    return dir * (b.total_trades - a.total_trades)
  })
  
  const limit = opts?.limit || 50
  const leaderboard = summaries.slice(0, limit).map((s: any) => ({
    bioguide_id: s.bioguide_id,
    name: s.name,
    politician_name: s.name,
    party: s.party,
    chamber: s.chamber,
    state: s.state,
    total_trades: s.total_trades,
    total_buys: s.buys,
    total_sells: s.sells,
    unique_tickers: s.unique_tickers,
    total_invested_min: 0,
    total_invested_max: 0,
    avg_trade_return_pct: s.avg_return_pct,
    best_trade_pct: s.best_return_pct,
    worst_trade_pct: s.worst_return_pct,
    photo_url: s.photo_url,
    top_tickers: s.top_tickers,
  }))
  
  return { leaderboard, total: summaries.length }
}

export async function getPolitician(identifier: string): Promise<{
  member: CongressMember
  performance: PortfolioPerformance | null
  trades: Transaction[]
  top_tickers: TickerInfo[]
  trade_count: number
} | null> {
  const decoded = decodeURIComponent(identifier).toLowerCase()
  const summary = allSummaries().find((s: any) => s.name.toLowerCase() === decoded)
  if (!summary) return null
  
  const member = allMembers().find((m: any) => m.bioguide_id === summary.bioguide_id) || {
    bioguide_id: summary.bioguide_id,
    full_name: summary.name,
    party: summary.party,
    state: summary.state,
    chamber: summary.chamber,
    photo_url: summary.photo_url,
  }
  
  const trades = allTrades().filter((t: any) => t.politician_name === summary.name)
  
  return {
    member,
    performance: {
      bioguide_id: summary.bioguide_id,
      name: summary.name,
      party: summary.party,
      chamber: summary.chamber,
      state: summary.state,
      total_trades: summary.total_trades,
      total_buys: summary.buys,
      total_sells: summary.sells,
      unique_tickers: summary.unique_tickers,
      total_invested_min: 0,
      total_invested_max: 0,
      avg_trade_return_pct: summary.avg_return_pct,
      best_trade_pct: summary.best_return_pct,
      worst_trade_pct: summary.worst_return_pct,
      photo_url: summary.photo_url,
    },
    trades,
    top_tickers: summary.top_tickers?.map((t: string) => ({ ticker: t, trade_count: 0, politician_count: 1, buys: 0, sells: 0 })) || [],
    trade_count: trades.length,
  }
}

export async function getPopularTickers(limit = 30): Promise<{ tickers: TickerInfo[] }> {
  const tickers = allTickers().slice(0, limit).map((t: any) => ({
    ticker: t.ticker,
    trade_count: t.count,
    politician_count: t.politicians,
    buys: t.buys,
    sells: t.sells,
  }))
  return { tickers }
}

export async function getRecentActivity(days = 30, limit = 50): Promise<{ trades: Transaction[] }> {
  const trades = allTrades().slice(0, limit)
  return { trades }
}

export async function getPartyComparison(): Promise<PartyComparison> {
  const summaries = allSummaries()
  const result: PartyComparison = {}
  
  for (const party of ['R', 'D', 'I']) {
    const partyPols = summaries.filter((s: any) => s.party === party)
    const returns = partyPols.map((s: any) => s.avg_return_pct).filter((r: any) => r != null)
    const winRates = partyPols.map((s: any) => s.win_rate).filter((r: any) => r != null)
    result[party] = {
      politicians: partyPols.length,
      avg_return: returns.length ? returns.reduce((a: number, b: number) => a + b, 0) / returns.length : undefined,
      avg_win_rate: winRates.length ? winRates.reduce((a: number, b: number) => a + b, 0) / winRates.length : undefined,
      avg_alpha: undefined,
      avg_delay: undefined,
      total_trades: partyPols.reduce((sum: number, s: any) => sum + s.total_trades, 0),
    }
  }
  
  return result
}

export async function searchPoliticians(q: string): Promise<{
  politicians: CongressMember[]
  tickers: TickerInfo[]
}> {
  const ql = q.toLowerCase()
  const politicians = allMembers().filter((m: any) => m.full_name?.toLowerCase().includes(ql)).slice(0, 10)
  const tickers = allTickers().filter((t: any) => t.ticker?.toLowerCase().includes(ql)).slice(0, 10)
  return { politicians, tickers }
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

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

export function partyBadge(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'bg-red-600 text-white'
    case 'D': return 'bg-blue-600 text-white'
    case 'I': return 'bg-purple-600 text-white'
    default: return 'bg-gray-600 text-white'
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

export function txTypeColor(type: string): string {
  const t = type?.toLowerCase() || ''
  if (t.includes('purchase') || t.includes('buy')) return 'text-green-400'
  if (t.includes('sale') || t.includes('sell')) return 'text-red-400'
  return 'text-yellow-400'
}

export function txTypeLabel(type: string): string {
  const t = type?.toLowerCase() || ''
  if (t.includes('purchase') || t.includes('buy')) return 'BUY'
  if (t.includes('sale') || t.includes('sell')) return 'SELL'
  if (t.includes('exchange')) return 'EXCHANGE'
  return type?.toUpperCase() || 'TRADE'
}

export function txTypeEmoji(type: string): string {
  const t = type?.toLowerCase() || ''
  if (t.includes('purchase') || t.includes('buy')) return '🟢'
  if (t.includes('sale') || t.includes('sell')) return '🔴'
  return '🔄'
}

export function returnColor(val: number | null | undefined): string {
  if (val == null) return 'text-gray-500'
  if (val > 0) return 'text-green-400'
  if (val < 0) return 'text-red-400'
  return 'text-gray-400'
}

export function formatReturn(val: number | null | undefined): string {
  if (val == null) return '—'
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}

export function formatMoney(val: number | null | undefined): string {
  if (val == null) return '—'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}

export function chamberLabel(chamber: string): string {
  switch (chamber?.toLowerCase()) {
    case 'senate': case 'sen': return 'Senate'
    case 'house': case 'rep': return 'House'
    default: return chamber || ''
  }
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
