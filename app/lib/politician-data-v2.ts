/**
 * Politician Trading Intelligence Data Layer v2
 * Connects to the enhanced API serving all 535 members
 */

const API_BASE = process.env.POLITICIAN_API_URL || 'http://localhost:8100';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CongressMember {
  bioguide_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  chamber: string;
  district?: string;
  term_start: string;
  twitter?: string;
  photo_url?: string;
  trade_count?: number;
}

export interface Transaction {
  id: number;
  bioguide_id: string;
  politician_name: string;
  ticker: string;
  asset_name: string;
  transaction_type: string;
  transaction_date: string;
  disclosure_date?: string;
  amount_display: string;
  amount_min?: number;
  amount_max?: number;
  owner?: string;
  return_pct?: number;
  price_at_trade?: number;
  price_current?: number;
  source: string;
  party?: string;
  chamber?: string;
  state?: string;
  photo_url?: string;
}

export interface PortfolioPerformance {
  bioguide_id: string;
  politician_name: string;
  party: string;
  chamber: string;
  state: string;
  total_trades: number;
  total_buys: number;
  total_sells: number;
  unique_tickers: number;
  total_invested_min: number;
  total_invested_max: number;
  total_return_pct?: number;
  avg_trade_return_pct?: number;
  median_trade_return_pct?: number;
  best_trade_pct?: number;
  best_trade_ticker?: string;
  worst_trade_pct?: number;
  worst_trade_ticker?: string;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  max_drawdown_pct?: number;
  win_rate?: number;
  profit_factor?: number;
  sp500_return_same_period?: number;
  alpha_vs_sp500?: number;
  avg_hold_days?: number;
  avg_disclosure_delay_days?: number;
  first_trade_date?: string;
  last_trade_date?: string;
  photo_url?: string;
  twitter?: string;
}

export interface SystemStats {
  total_members: number;
  total_transactions: number;
  members_with_trades: number;
  unique_tickers: number;
  total_buys: number;
  total_sells: number;
  total_filings: number;
  sources: Record<string, number>;
  last_scrape?: string;
}

export interface TickerInfo {
  ticker: string;
  trade_count: number;
  politician_count: number;
  buys: number;
  sells: number;
  avg_return?: number;
  last_trade_date?: string;
}

export interface PartyComparison {
  [party: string]: {
    politicians: number;
    avg_return?: number;
    avg_win_rate?: number;
    avg_sharpe?: number;
    avg_alpha?: number;
    total_trades: number;
    avg_delay?: number;
  };
}

// ─── Fetcher ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 120 },
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`[politician-data-v2] ${path} failed:`, e);
    return null;
  }
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

export async function getStats(): Promise<SystemStats> {
  const data = await apiFetch<SystemStats>('/api/v2/politicians/stats');
  return data || {
    total_members: 535, total_transactions: 0, members_with_trades: 0,
    unique_tickers: 0, total_buys: 0, total_sells: 0, total_filings: 0, sources: {},
  };
}

export async function getRoster(opts?: {
  chamber?: string; party?: string; state?: string; has_trades?: boolean;
  page?: number; per_page?: number;
}): Promise<{ members: CongressMember[]; total: number; total_pages: number }> {
  let path = `/api/v2/politicians/roster?page=${opts?.page || 1}&per_page=${opts?.per_page || 50}`;
  if (opts?.chamber) path += `&chamber=${opts.chamber}`;
  if (opts?.party) path += `&party=${opts.party}`;
  if (opts?.state) path += `&state=${opts.state}`;
  if (opts?.has_trades) path += `&has_trades=true`;
  return (await apiFetch(path)) || { members: [], total: 0, total_pages: 0 };
}

export async function getTrades(opts?: {
  page?: number; per_page?: number; politician?: string; ticker?: string;
  party?: string; chamber?: string; tx_type?: string;
  date_from?: string; date_to?: string;
  sort_by?: string; sort_dir?: string;
}): Promise<{ trades: Transaction[]; total: number; total_pages: number }> {
  let path = `/api/v2/politicians/trades?page=${opts?.page || 1}&per_page=${opts?.per_page || 50}`;
  if (opts?.politician) path += `&politician=${encodeURIComponent(opts.politician)}`;
  if (opts?.ticker) path += `&ticker=${encodeURIComponent(opts.ticker)}`;
  if (opts?.party) path += `&party=${opts.party}`;
  if (opts?.chamber) path += `&chamber=${opts.chamber}`;
  if (opts?.tx_type) path += `&tx_type=${opts.tx_type}`;
  if (opts?.sort_by) path += `&sort_by=${opts.sort_by}`;
  if (opts?.sort_dir) path += `&sort_dir=${opts.sort_dir}`;
  return (await apiFetch(path)) || { trades: [], total: 0, total_pages: 0 };
}

export async function getLeaderboard(opts?: {
  sort_by?: string; sort_dir?: string; party?: string; chamber?: string;
  min_trades?: number; limit?: number;
}): Promise<{ leaderboard: PortfolioPerformance[]; total: number }> {
  let path = `/api/v2/politicians/leaderboard?sort_by=${opts?.sort_by || 'avg_trade_return_pct'}&limit=${opts?.limit || 50}`;
  if (opts?.sort_dir) path += `&sort_dir=${opts.sort_dir}`;
  if (opts?.party) path += `&party=${opts.party}`;
  if (opts?.chamber) path += `&chamber=${opts.chamber}`;
  if (opts?.min_trades) path += `&min_trades=${opts.min_trades}`;
  return (await apiFetch(path)) || { leaderboard: [], total: 0 };
}

export async function getPolitician(identifier: string): Promise<{
  member: CongressMember;
  performance: PortfolioPerformance | null;
  trades: Transaction[];
  top_tickers: TickerInfo[];
  trade_count: number;
} | null> {
  return await apiFetch(`/api/v2/politicians/${encodeURIComponent(identifier)}`);
}

export async function getPopularTickers(limit = 30): Promise<{ tickers: TickerInfo[] }> {
  return (await apiFetch(`/api/v2/politicians/tickers/popular?limit=${limit}`)) || { tickers: [] };
}

export async function getRecentActivity(days = 30, limit = 50): Promise<{ trades: Transaction[] }> {
  return (await apiFetch(`/api/v2/politicians/activity/recent?days=${days}&limit=${limit}`)) || { trades: [] };
}

export async function getPartyComparison(): Promise<PartyComparison> {
  return (await apiFetch('/api/v2/politicians/analytics/party-comparison')) || {};
}

export async function searchPoliticians(q: string): Promise<{
  politicians: CongressMember[];
  tickers: TickerInfo[];
}> {
  return (await apiFetch(`/api/v2/politicians/search?q=${encodeURIComponent(q)}`)) || { politicians: [], tickers: [] };
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

export function partyColor(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'text-red-400';
    case 'D': return 'text-blue-400';
    case 'I': return 'text-purple-400';
    default: return 'text-gray-400';
  }
}

export function partyBg(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'bg-red-500/20 border-red-500/30';
    case 'D': return 'bg-blue-500/20 border-blue-500/30';
    case 'I': return 'bg-purple-500/20 border-purple-500/30';
    default: return 'bg-gray-500/20 border-gray-500/30';
  }
}

export function partyBadge(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'bg-red-600 text-white';
    case 'D': return 'bg-blue-600 text-white';
    case 'I': return 'bg-purple-600 text-white';
    default: return 'bg-gray-600 text-white';
  }
}

export function partyName(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'Republican';
    case 'D': return 'Democrat';
    case 'I': return 'Independent';
    default: return party || 'Unknown';
  }
}

export function txTypeColor(type: string): string {
  const t = type?.toLowerCase() || '';
  if (t.includes('purchase') || t.includes('buy')) return 'text-green-400';
  if (t.includes('sale') || t.includes('sell')) return 'text-red-400';
  return 'text-yellow-400';
}

export function txTypeLabel(type: string): string {
  const t = type?.toLowerCase() || '';
  if (t.includes('purchase') || t.includes('buy')) return 'BUY';
  if (t.includes('sale') || t.includes('sell')) return 'SELL';
  if (t.includes('exchange')) return 'EXCHANGE';
  return type?.toUpperCase() || 'UNKNOWN';
}

export function txTypeEmoji(type: string): string {
  const t = type?.toLowerCase() || '';
  if (t.includes('purchase') || t.includes('buy')) return '🟢';
  if (t.includes('sale') || t.includes('sell')) return '🔴';
  return '🔄';
}

export function returnColor(val: number | null | undefined): string {
  if (val == null) return 'text-gray-500';
  if (val > 0) return 'text-green-400';
  if (val < 0) return 'text-red-400';
  return 'text-gray-400';
}

export function formatReturn(val: number | null | undefined): string {
  if (val == null) return '—';
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}

export function formatMoney(val: number | null | undefined): string {
  if (val == null) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function chamberLabel(chamber: string): string {
  switch (chamber?.toLowerCase()) {
    case 'senate': case 'sen': return 'Senate';
    case 'house': case 'rep': return 'House';
    default: return chamber || '';
  }
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
