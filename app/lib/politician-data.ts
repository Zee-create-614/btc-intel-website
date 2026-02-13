// Data fetching for politician trades
// Fetches from the FastAPI backend or directly from SQLite via API routes

const API_BASE = process.env.POLITICIAN_API_URL || 'http://localhost:8100';

export interface PoliticianTrade {
  id: number;
  politician: string;
  party: string;
  chamber: string;
  state: string;
  ticker: string;
  asset_name: string;
  trade_type: string;
  size_range: string;
  price: string;
  trade_date: string;
  trade_date_display: string;
  days_held: number | null;
  published: string;
  owner: string;
  return_pct: number | null;
  current_price: number | null;
  purchase_price: number | null;
  return_1d: number | null;
  return_5d: number | null;
  return_7d: number | null;
  return_30d: number | null;
  return_3m: number | null;
  return_ytd: number | null;
  return_1y: number | null;
  return_5y: number | null;
  return_alltime: number | null;
}

export interface TimeframePerformance {
  '1d': number | null;
  '5d': number | null;
  '7d': number | null;
  '30d': number | null;
  '3m': number | null;
  'ytd': number | null;
  '1y': number | null;
  '5y': number | null;
  'alltime': number | null;
}

export interface PoliticianSummary {
  name: string;
  party: string;
  chamber: string;
  state: string;
  total_trades: number;
  buys: number;
  sells: number;
  unique_tickers: number;
  top_tickers: string[];
  avg_return_pct: number | null;
  best_return_pct: number | null;
  worst_return_pct: number | null;
  trades: PoliticianTrade[];
  performance?: TimeframePerformance;
}

export interface TradeStats {
  total_trades: number;
  unique_politicians: number;
  unique_tickers: number;
  total_buys: number;
  total_sells: number;
  last_updated: string;
}

async function apiFetch(path: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 120 },
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`[politician-data] Fetch ${path} failed:`, e);
    return null;
  }
}

export async function getTradeStats(): Promise<TradeStats> {
  const data = await apiFetch('/api/politicians/stats');
  return data || {
    total_trades: 96,
    unique_politicians: 25,
    unique_tickers: 40,
    total_buys: 45,
    total_sells: 51,
    last_updated: new Date().toISOString(),
  };
}

export async function getTrades(page = 1, perPage = 25, filters?: {
  politician?: string;
  ticker?: string;
  party?: string;
}): Promise<{ trades: PoliticianTrade[]; total: number; total_pages: number }> {
  let path = `/api/politicians/trades?page=${page}&per_page=${perPage}`;
  if (filters?.politician) path += `&politician=${encodeURIComponent(filters.politician)}`;
  if (filters?.ticker) path += `&ticker=${encodeURIComponent(filters.ticker)}`;
  if (filters?.party) path += `&party=${encodeURIComponent(filters.party)}`;
  
  const data = await apiFetch(path);
  return data || { trades: [], total: 0, total_pages: 0 };
}

export async function getPoliticianSummaries(): Promise<PoliticianSummary[]> {
  const data = await apiFetch('/api/politicians/summary');
  return data || [];
}

export async function getPoliticianDetail(name: string, timeframes = false): Promise<PoliticianSummary | null> {
  const data = await apiFetch(`/api/politicians/${encodeURIComponent(name)}?timeframes=${timeframes}`);
  return data;
}

export async function getLeaderboard(sortBy = 'avg_return', limit = 20): Promise<PoliticianSummary[]> {
  const data = await apiFetch(`/api/politicians/leaderboard?sort_by=${sortBy}&limit=${limit}`);
  return data || [];
}

// Formatting helpers
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

export function partyName(party: string): string {
  switch (party?.toUpperCase()) {
    case 'R': return 'Republican';
    case 'D': return 'Democrat';
    case 'I': return 'Independent';
    default: return party || 'Unknown';
  }
}

export function tradeTypeColor(type: string): string {
  const upper = type?.toUpperCase() || '';
  if (upper.includes('BUY') || upper.includes('PURCHASE')) return 'text-green-400';
  if (upper.includes('SELL') || upper.includes('SALE')) return 'text-red-400';
  return 'text-yellow-400';
}

export function tradeTypeEmoji(type: string): string {
  const upper = type?.toUpperCase() || '';
  if (upper.includes('BUY') || upper.includes('PURCHASE')) return '🟢';
  if (upper.includes('SELL') || upper.includes('SALE')) return '🔴';
  return '🔄';
}

export function returnColor(val: number | null | undefined): string {
  if (val == null) return 'text-gray-500';
  if (val > 0) return 'text-green-400';
  if (val < 0) return 'text-red-400';
  return 'text-gray-400';
}

export function formatReturn(val: number | null | undefined): string {
  if (val == null) return 'N/A';
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}
