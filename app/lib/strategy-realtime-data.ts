// STRATEGY.COM REAL-TIME DATA INTEGRATION
// Uses our custom scraping system for 15-second updates

interface StrategyRealtimeData {
  // Real-time stock data (from Yahoo Finance via our scraper)
  mstr_stock: {
    price: number
    volume: number
    change: number
    change_percent: number
    market_cap: number
    timestamp: string
    source: string
  }
  
  // Real-time BTC data (from CoinGecko via our scraper)
  btc_price: {
    btc_price: number
    btc_change_24h: number
    timestamp: string
    source: string
  }
  
  // Calculated metrics
  derived_metrics: {
    btc_value: number
    nav_per_share: number
    nav_discount_percent: number
    btc_per_share: number
    total_assets: number
  }
  
  // Bitcoin holdings (from Monday scrapes of strategy.com)
  bitcoin_holdings?: {
    holdings: number
    last_updated: string
    source: string
  }
  
  // Data freshness
  last_updated: string
  data_age_seconds?: number
  is_fresh?: boolean
  update_frequency: string
}

// API endpoints for our scraping system
const SCRAPER_API_BASE = 'http://localhost:5000/api'

export async function getStrategyRealtimeData(): Promise<StrategyRealtimeData> {
  try {
    console.log('Fetching real-time data from strategy.com scraper...')
    
    // Try to get data from our scraping API first
    const response = await fetch(`${SCRAPER_API_BASE}/mstr/combined`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.status === 'success') {
        console.log('✅ Using live scraped data from strategy.com')
        
        const realtimeData = data.realtime_data
        const holdingsData = data.bitcoin_holdings
        
        return {
          mstr_stock: realtimeData.mstr_stock || generateFallbackStockData(),
          btc_price: realtimeData.btc_price || generateFallbackBTCData(),
          derived_metrics: realtimeData.derived_metrics || generateFallbackMetrics(),
          bitcoin_holdings: holdingsData,
          last_updated: realtimeData.last_updated || new Date().toISOString(),
          data_age_seconds: realtimeData.data_age_seconds,
          is_fresh: realtimeData.is_fresh,
          update_frequency: '15_seconds'
        }
      }
    }
    
    console.log('⚠️ Scraper API not available, using fallback data sources...')
    return await getFallbackData()
    
  } catch (error) {
    console.log('❌ Error accessing scraper API, using fallback:', error)
    return await getFallbackData()
  }
}

// Fallback to direct API calls if scraper is down
async function getFallbackData(): Promise<StrategyRealtimeData> {
  try {
    // Get MSTR stock data directly from Yahoo Finance
    const [stockResponse, btcResponse] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/MSTR?interval=1m&range=1d', 
        { next: { revalidate: 15 } }),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        { next: { revalidate: 15 } })
    ])
    
    const stockData = await stockResponse.json()
    const btcData = await btcResponse.json()
    
    const stockMeta = stockData.chart?.result?.[0]?.meta || {}
    const btcInfo = btcData.bitcoin || {}
    
    const mstrStock = {
      price: stockMeta.regularMarketPrice || 133.88,
      volume: stockMeta.regularMarketVolume || 23000000,
      change: stockMeta.regularMarketChange || 0,
      change_percent: stockMeta.regularMarketChangePercent || 0,
      market_cap: (stockMeta.regularMarketPrice || 133.88) * 16800000,
      timestamp: new Date().toISOString(),
      source: 'yahoo_finance_direct'
    }
    
    const btcPrice = {
      btc_price: btcInfo.usd || 68000,
      btc_change_24h: btcInfo.usd_24h_change || 0,
      timestamp: new Date().toISOString(),
      source: 'coingecko_direct'
    }
    
    const derivedMetrics = calculateMetrics(mstrStock.price, btcPrice.btc_price)
    
    return {
      mstr_stock: mstrStock,
      btc_price: btcPrice,
      derived_metrics: derivedMetrics,
      bitcoin_holdings: {
        holdings: 714644,
        last_updated: '2026-02-09',
        source: 'strategy.com_official'
      },
      last_updated: new Date().toISOString(),
      is_fresh: true,
      update_frequency: 'fallback_direct'
    }
    
  } catch (error) {
    console.error('Error in fallback data:', error)
    return getStaticFallbackData()
  }
}

function calculateMetrics(stockPrice: number, btcPrice: number) {
  const BTC_HOLDINGS = 714644
  const SHARES_OUTSTANDING = 16800000
  const OTHER_ASSETS = 500000000
  
  const btcValue = BTC_HOLDINGS * btcPrice
  const totalAssets = btcValue + OTHER_ASSETS
  const navPerShare = totalAssets / SHARES_OUTSTANDING
  const navDiscount = ((stockPrice - navPerShare) / navPerShare) * 100
  const btcPerShare = BTC_HOLDINGS / SHARES_OUTSTANDING
  
  return {
    btc_value: btcValue,
    nav_per_share: navPerShare,
    nav_discount_percent: navDiscount,
    btc_per_share: btcPerShare,
    total_assets: totalAssets
  }
}

// Generate fallback stock data
function generateFallbackStockData() {
  return {
    price: 133.88,
    volume: 23000000,
    change: 2.50,
    change_percent: 1.9,
    market_cap: 2249184000,
    timestamp: new Date().toISOString(),
    source: 'fallback'
  }
}

// Generate fallback BTC data  
function generateFallbackBTCData() {
  return {
    btc_price: 68000,
    btc_change_24h: 2.5,
    timestamp: new Date().toISOString(),
    source: 'fallback'
  }
}

// Generate fallback metrics
function generateFallbackMetrics() {
  return calculateMetrics(133.88, 68000)
}

// Static fallback data (last resort)
function getStaticFallbackData(): StrategyRealtimeData {
  return {
    mstr_stock: generateFallbackStockData(),
    btc_price: generateFallbackBTCData(),
    derived_metrics: generateFallbackMetrics(),
    bitcoin_holdings: {
      holdings: 714644,
      last_updated: '2026-02-09',
      source: 'static_fallback'
    },
    last_updated: new Date().toISOString(),
    is_fresh: false,
    update_frequency: 'static_fallback'
  }
}

// Check if scraper is running
export async function checkScraperStatus() {
  try {
    const response = await fetch(`${SCRAPER_API_BASE}/status`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (response.ok) {
      const status = await response.json()
      return {
        available: true,
        status: status.status,
        uptime: status.uptime,
        last_update: status.last_update
      }
    }
    
    return { available: false, status: 'api_error' }
    
  } catch (error) {
    return { available: false, status: 'connection_error' }
  }
}

// Format data for display
export function formatRealtimePrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function formatRealtimeChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}$${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
}

export function formatDataFreshness(ageSeconds?: number): string {
  if (!ageSeconds) return 'Live'
  
  if (ageSeconds < 30) return `${Math.round(ageSeconds)}s ago`
  if (ageSeconds < 300) return `${Math.round(ageSeconds / 60)}m ago`
  return `${Math.round(ageSeconds / 3600)}h ago`
}

export function getDataSourceColor(source: string): string {
  if (source.includes('scraper') || source === '15_seconds') return 'text-green-400'
  if (source.includes('direct')) return 'text-yellow-400'
  return 'text-gray-400'
}

export function getDataSourceLabel(source: string): string {
  if (source === '15_seconds') return '🔄 Live Scraper'
  if (source.includes('direct')) return '📡 Direct API'
  if (source.includes('fallback')) return '📦 Fallback'
  return '📊 Official Data'
}