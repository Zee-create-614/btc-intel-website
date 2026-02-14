// Data fetching utilities for BTC Intel Platform
// Live data from free APIs with graceful fallbacks

export interface TreasuryHolding {
  id: number;
  entity_name: string;
  entity_type: 'company' | 'etf' | 'country';
  btc_holdings: number;
  last_updated: string;
  avg_cost_basis?: number;
  market_value?: number;
  unrealized_pnl?: number;
  source?: string;
  additional_info?: any;
}

export interface BTCPriceData {
  id: number;
  timestamp: string;
  price_usd: number;
  market_cap?: number;
  volume_24h?: number;
  change_24h?: number;
}

export interface MSTRStockData {
  id: number;
  timestamp: string;
  price: number;
  volume?: number;
  market_cap?: number;
  iv_30d?: number;
  iv_60d?: number;
  iv_90d?: number;
  iv_252d?: number;
  nav_premium?: number;
}

export interface OptionData {
  id: number;
  timestamp: string;
  option_type: 'call' | 'put';
  strike: number;
  expiry: string;
  bid?: number;
  ask?: number;
  volume?: number;
  open_interest?: number;
  implied_volatility?: number;
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;
}

// Helper for fetching with timeout and error handling
async function safeFetch(url: string, revalidate: number = 120): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate },
      headers: { 'User-Agent': 'BTCIntelVault/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getTreasuryHoldings(): Promise<TreasuryHolding[]> {
  try {
    const data = await safeFetch(
      'https://api.coingecko.com/api/v3/companies/public_treasury/bitcoin',
      300
    );
    const btcPrice = (await getBTCPrice()).price_usd;

    const companies: TreasuryHolding[] = (data.companies || []).map(
      (c: any, i: number) => {
        const holdings = c.total_holdings || 0;
        const mv = holdings * btcPrice;
        const costBasis = c.total_entry_value_usd
          ? c.total_entry_value_usd / holdings
          : 0;
        return {
          id: i + 1,
          entity_name: c.name || 'Unknown',
          entity_type: 'company' as const,
          btc_holdings: holdings,
          last_updated: new Date().toISOString(),
          avg_cost_basis: Math.round(costBasis),
          market_value: Math.round(mv),
          unrealized_pnl: Math.round(mv - (c.total_entry_value_usd || 0)),
          source: 'coingecko',
          additional_info: { ticker: c.symbol?.toUpperCase() || '', country: c.country },
        };
      }
    );

    return companies.length > 0 ? companies : getFallbackTreasuries();
  } catch (e) {
    console.error('Treasury fetch failed:', e);
    return getFallbackTreasuries();
  }
}

function getFallbackTreasuries(): TreasuryHolding[] {
  return [
    { id: 1, entity_name: 'MicroStrategy', entity_type: 'company', btc_holdings: 190000, last_updated: new Date().toISOString(), avg_cost_basis: 29803, source: 'fallback', additional_info: { ticker: 'MSTR' } },
    { id: 2, entity_name: 'Tesla', entity_type: 'company', btc_holdings: 9720, last_updated: new Date().toISOString(), avg_cost_basis: 34722, source: 'fallback', additional_info: { ticker: 'TSLA' } },
    { id: 3, entity_name: 'Block Inc', entity_type: 'company', btc_holdings: 8027, last_updated: new Date().toISOString(), avg_cost_basis: 40485, source: 'fallback', additional_info: { ticker: 'SQ' } },
    { id: 4, entity_name: 'Marathon Digital', entity_type: 'company', btc_holdings: 26842, last_updated: new Date().toISOString(), avg_cost_basis: 44394, source: 'fallback', additional_info: { ticker: 'MARA' } },
    { id: 5, entity_name: 'BlackRock IBIT', entity_type: 'etf', btc_holdings: 454789, last_updated: new Date().toISOString(), source: 'official', additional_info: { ticker: 'IBIT' } },
    { id: 6, entity_name: 'Grayscale GBTC', entity_type: 'etf', btc_holdings: 347856, last_updated: new Date().toISOString(), source: 'official', additional_info: { ticker: 'GBTC' } },
    { id: 7, entity_name: 'Fidelity FBTC', entity_type: 'etf', btc_holdings: 183245, last_updated: new Date().toISOString(), source: 'official', additional_info: { ticker: 'FBTC' } },
    { id: 8, entity_name: 'ARK ARKB', entity_type: 'etf', btc_holdings: 47892, last_updated: new Date().toISOString(), source: 'official', additional_info: { ticker: 'ARKB' } },
    { id: 9, entity_name: 'Bitwise BITB', entity_type: 'etf', btc_holdings: 41267, last_updated: new Date().toISOString(), source: 'official', additional_info: { ticker: 'BITB' } },
    { id: 10, entity_name: 'Other Bitcoin ETFs', entity_type: 'etf', btc_holdings: 48951, last_updated: new Date().toISOString(), source: 'aggregated', additional_info: { ticker: 'OTHERS' } },
    { id: 11, entity_name: 'El Salvador', entity_type: 'country', btc_holdings: 2381, last_updated: new Date().toISOString(), avg_cost_basis: 45000, source: 'official', additional_info: {} },
  ];
}

export async function getBTCPrice(): Promise<BTCPriceData> {
  try {
    const data = await safeFetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
      60
    );
    const btc = data.bitcoin;
    return {
      id: 1,
      timestamp: new Date().toISOString(),
      price_usd: btc.usd || 0,
      market_cap: btc.usd_market_cap || 0,
      volume_24h: btc.usd_24h_vol || 0,
      change_24h: btc.usd_24h_change || 0,
    };
  } catch (e) {
    console.error('BTC price fetch failed:', e);
    return {
      id: 1,
      timestamp: new Date().toISOString(),
      price_usd: 0,
      market_cap: 0,
      volume_24h: 0,
      change_24h: 0,
    };
  }
}

export async function getMSTRData(): Promise<MSTRStockData> {
  try {
    const data = await safeFetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/MSTR?interval=1d&range=5d',
      120
    );
    const result = data.chart?.result?.[0];
    const meta = result?.meta || {};
    const quotes = result?.indicators?.quote?.[0] || {};
    const lastClose = quotes.close?.filter((v: any) => v != null).pop() || meta.regularMarketPrice || 0;
    const lastVolume = quotes.volume?.filter((v: any) => v != null).pop() || 0;

    // Try to compute NAV premium: MSTR market cap / (BTC holdings * BTC price)
    let navPremium = 0;
    try {
      const btcPrice = (await getBTCPrice()).price_usd;
      const mstrBtcHoldings = 190000; // approximate known holdings
      const mstrShares = 16500000; // approximate shares outstanding
      const mstrMarketCap = lastClose * mstrShares;
      const btcNav = mstrBtcHoldings * btcPrice;
      if (btcNav > 0) {
        navPremium = ((mstrMarketCap - btcNav) / btcNav) * 100;
      }
    } catch {}

    return {
      id: 1,
      timestamp: new Date().toISOString(),
      price: lastClose,
      volume: lastVolume,
      market_cap: meta.marketCap || lastClose * 16500000,
      iv_30d: undefined, // Will be populated from options if available
      iv_60d: undefined,
      iv_90d: undefined,
      iv_252d: undefined,
      nav_premium: Math.round(navPremium * 10) / 10,
    };
  } catch (e) {
    console.error('MSTR data fetch failed:', e);
    return {
      id: 1,
      timestamp: new Date().toISOString(),
      price: 0,
      volume: 0,
      market_cap: 0,
      nav_premium: 0,
    };
  }
}

export async function getMSTROptions(): Promise<OptionData[]> {
  try {
    const data = await safeFetch(
      'https://query1.finance.yahoo.com/v7/finance/options/MSTR',
      300
    );
    const chain = data.optionChain?.result?.[0];
    if (!chain) return [];

    const options: OptionData[] = [];
    let id = 1;

    const expDateStr = chain.expirationDates?.[0]
      ? new Date(chain.expirationDates[0] * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    for (const call of (chain.options?.[0]?.calls || []).slice(0, 10)) {
      options.push({
        id: id++,
        timestamp: new Date().toISOString(),
        option_type: 'call',
        strike: call.strike || 0,
        expiry: expDateStr,
        bid: call.bid,
        ask: call.ask,
        volume: call.volume,
        open_interest: call.openInterest,
        implied_volatility: call.impliedVolatility,
        delta: undefined,
        theta: undefined,
        gamma: undefined,
        vega: undefined,
      });
    }

    for (const put of (chain.options?.[0]?.puts || []).slice(0, 10)) {
      options.push({
        id: id++,
        timestamp: new Date().toISOString(),
        option_type: 'put',
        strike: put.strike || 0,
        expiry: expDateStr,
        bid: put.bid,
        ask: put.ask,
        volume: put.volume,
        open_interest: put.openInterest,
        implied_volatility: put.impliedVolatility,
        delta: undefined,
        theta: undefined,
        gamma: undefined,
        vega: undefined,
      });
    }

    // If we got options, try to extract average IV for MSTR data enrichment
    if (options.length > 0) {
      const ivs = options
        .filter(o => o.implied_volatility && o.implied_volatility > 0)
        .map(o => o.implied_volatility!);
      if (ivs.length > 0) {
        const avgIV = (ivs.reduce((a, b) => a + b, 0) / ivs.length) * 100;
        // Cache this for getMSTRData - stored as module-level
        _cachedIV = Math.round(avgIV * 10) / 10;
      }
    }

    return options.length > 0 ? options : getFallbackOptions();
  } catch (e) {
    console.error('MSTR options fetch failed:', e);
    return getFallbackOptions();
  }
}

let _cachedIV: number | undefined;

function getFallbackOptions(): OptionData[] {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return [
    { id: 1, timestamp: new Date().toISOString(), option_type: 'call', strike: 460, expiry: nextMonth.toISOString().split('T')[0], bid: 12.5, ask: 13.2, volume: 1250, open_interest: 5420, implied_volatility: 0.82 },
    { id: 2, timestamp: new Date().toISOString(), option_type: 'call', strike: 470, expiry: nextMonth.toISOString().split('T')[0], bid: 8.7, ask: 9.3, volume: 980, open_interest: 3210, implied_volatility: 0.79 },
    { id: 3, timestamp: new Date().toISOString(), option_type: 'put', strike: 440, expiry: nextMonth.toISOString().split('T')[0], bid: 15.2, ask: 16.1, volume: 850, open_interest: 2890, implied_volatility: 0.85 },
    { id: 4, timestamp: new Date().toISOString(), option_type: 'put', strike: 430, expiry: nextMonth.toISOString().split('T')[0], bid: 11.8, ask: 12.6, volume: 1120, open_interest: 4560, implied_volatility: 0.81 },
  ];
}

// Fear & Greed Index
export async function getFearGreedIndex(): Promise<{ value: number; classification: string }> {
  try {
    const data = await safeFetch('https://api.alternative.me/fng/?limit=1', 300);
    const entry = data.data?.[0];
    return {
      value: parseInt(entry?.value || '50'),
      classification: entry?.value_classification || 'Neutral',
    };
  } catch {
    return { value: 50, classification: 'Data unavailable' };
  }
}

export async function getDashboardStats() {
  const [holdings, btcPrice, mstrData] = await Promise.all([
    getTreasuryHoldings(),
    getBTCPrice(),
    getMSTRData(),
  ]);

  const totalBTC = holdings.reduce((sum, holding) => sum + holding.btc_holdings, 0);
  const corporateBTC = holdings
    .filter(h => h.entity_type === 'company')
    .reduce((sum, holding) => sum + holding.btc_holdings, 0);
  const etfBTC = holdings
    .filter(h => h.entity_type === 'etf')
    .reduce((sum, holding) => sum + holding.btc_holdings, 0);

  return {
    totalBTC,
    corporateBTC,
    etfBTC,
    btcPrice: btcPrice.price_usd,
    btcChange24h: btcPrice.change_24h,
    mstrPrice: mstrData.price,
    mstrIV: mstrData.iv_30d || _cachedIV,
    navPremium: mstrData.nav_premium,
    totalValue: totalBTC * btcPrice.price_usd,
  };
}

export function formatCurrency(value: number): string {
  if (!value && value !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (!value && value !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
