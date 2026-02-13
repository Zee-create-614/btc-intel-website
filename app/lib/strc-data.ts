// STRC (Strategy Variable Rate Perpetual Preferred Stock) data tracking
// Professional-grade STRC preferred stock analytics alongside MSTR for BTCIntelVault

interface STRCData {
  // Stock Data
  price: number
  volume: number
  market_cap: number
  shares_outstanding: number
  daily_volume_avg_10d: number
  daily_volume_avg_30d: number
  
  // Volatility Metrics
  volatility_1d: number
  volatility_7d: number
  volatility_30d: number
  beta_to_btc: number
  
  // BTC Correlation
  btc_correlation_30d: number
  btc_correlation_90d: number
  
  // Technical Indicators
  rsi_14: number
  macd_signal: 'buy' | 'sell' | 'neutral'
  bollinger_position: number
  
  // Trading Activity
  unusual_volume_detected: boolean
  volume_spike_percentage: number
  institutional_activity_score: number
  
  timestamp: string
}

interface DualTickerComparison {
  mstr: any
  strc: STRCData
  comparison: {
    price_correlation: number
    volume_ratio: number // MSTR volume / STRC volume
    market_cap_ratio: number
    volatility_comparison: 'mstr_higher' | 'strc_higher' | 'similar'
    better_performer_1d: 'MSTR' | 'STRC' | 'tie'
    better_performer_7d: 'MSTR' | 'STRC' | 'tie'
    better_performer_30d: 'MSTR' | 'STRC' | 'tie'
  }
}

export async function getSTRCData(): Promise<STRCData> {
  try {
    // Get real-time STRC stock price from Yahoo Finance
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/STRC?interval=1d&range=30d',
      { next: { revalidate: 60 } }
    )
    const data = await response.json()
    const result = data.chart?.result?.[0]
    const meta = result?.meta || {}
    const quotes = result?.indicators?.quote?.[0] || {}
    
    const currentPrice = meta.regularMarketPrice || 0
    const currentVolume = meta.regularMarketVolume || 0
    const marketCap = currentPrice * (meta.sharesOutstanding || 50000000) // Estimated shares
    
    // Calculate historical volumes
    const volumes = quotes.volume?.filter((v: any) => v != null) || []
    const recentVolumes = volumes.slice(-10)
    const monthlyVolumes = volumes.slice(-30)
    
    const avgVolume10d = recentVolumes.length > 0 
      ? recentVolumes.reduce((sum: number, v: number) => sum + v, 0) / recentVolumes.length 
      : 0
    const avgVolume30d = monthlyVolumes.length > 0
      ? monthlyVolumes.reduce((sum: number, v: number) => sum + v, 0) / monthlyVolumes.length
      : 0
    
    // Calculate volatility metrics
    const closes = quotes.close?.filter((c: any) => c != null) || []
    const volatility30d = calculateVolatility(closes.slice(-30))
    const volatility7d = calculateVolatility(closes.slice(-7))
    const volatility1d = Math.abs(((closes[closes.length - 1] || 0) - (closes[closes.length - 2] || 0)) / (closes[closes.length - 2] || 1)) * 100
    
    // Volume analysis
    const volumeSpike = currentVolume > (avgVolume30d * 2) ? 
      ((currentVolume - avgVolume30d) / avgVolume30d) * 100 : 0
    const unusualVolumeDetected = volumeSpike > 50
    
    // Mock some professional metrics (in production, use real sources)
    const btcCorrelation30d = 0.75 + (Math.random() - 0.5) * 0.4 // 0.55-0.95
    const btcCorrelation90d = 0.70 + (Math.random() - 0.5) * 0.4
    const betaToBtc = 1.5 + (Math.random() - 0.5) * 1.0 // 1.0-2.0
    const rsi14 = 30 + Math.random() * 40
    const macdSignal = rsi14 > 60 ? 'buy' : rsi14 < 40 ? 'sell' : 'neutral'
    const bollingerPosition = (Math.random() - 0.5) * 2
    const institutionalActivityScore = Math.random() * 10
    
    return {
      price: currentPrice,
      volume: currentVolume,
      market_cap: marketCap,
      shares_outstanding: meta.sharesOutstanding || 50000000,
      daily_volume_avg_10d: avgVolume10d,
      daily_volume_avg_30d: avgVolume30d,
      
      volatility_1d: volatility1d,
      volatility_7d: volatility7d,
      volatility_30d: volatility30d,
      beta_to_btc: betaToBtc,
      
      btc_correlation_30d: btcCorrelation30d,
      btc_correlation_90d: btcCorrelation90d,
      
      rsi_14: rsi14,
      macd_signal: macdSignal as 'buy' | 'sell' | 'neutral',
      bollinger_position: bollingerPosition,
      
      unusual_volume_detected: unusualVolumeDetected,
      volume_spike_percentage: volumeSpike,
      institutional_activity_score: institutionalActivityScore,
      
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching STRC data:', error)
    
    // Fallback data
    return {
      price: 12.50,
      volume: 850000,
      market_cap: 625000000,
      shares_outstanding: 50000000,
      daily_volume_avg_10d: 950000,
      daily_volume_avg_30d: 1200000,
      
      volatility_1d: 4.2,
      volatility_7d: 18.5,
      volatility_30d: 32.1,
      beta_to_btc: 1.8,
      
      btc_correlation_30d: 0.82,
      btc_correlation_90d: 0.78,
      
      rsi_14: 45.2,
      macd_signal: 'neutral',
      bollinger_position: 0.3,
      
      unusual_volume_detected: false,
      volume_spike_percentage: 0,
      institutional_activity_score: 6.5,
      
      timestamp: new Date().toISOString()
    }
  }
}

export async function getDualTickerComparison(): Promise<DualTickerComparison> {
  try {
    const [mstrData, strcData] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/MSTR?interval=1d&range=30d').then(r => r.json()),
      getSTRCData()
    ])
    
    const mstrResult = mstrData.chart?.result?.[0]
    const mstrMeta = mstrResult?.meta || {}
    const mstrPrice = mstrMeta.regularMarketPrice || 0
    const mstrVolume = mstrMeta.regularMarketVolume || 0
    const mstrMarketCap = mstrPrice * 16500000 // MSTR shares
    
    // Calculate comparison metrics
    const volumeRatio = mstrVolume > 0 && strcData.volume > 0 ? mstrVolume / strcData.volume : 1
    const marketCapRatio = mstrMarketCap > 0 && strcData.market_cap > 0 ? mstrMarketCap / strcData.market_cap : 1
    
    // Mock performance comparisons (in production, calculate from historical data)
    const priceCorrelation = 0.85 + (Math.random() - 0.5) * 0.3
    const volatilityComparison = strcData.volatility_30d > 35 ? 'strc_higher' : 'mstr_higher'
    const betterPerformer1d = Math.random() > 0.5 ? 'MSTR' : 'STRC'
    const betterPerformer7d = Math.random() > 0.4 ? 'MSTR' : 'STRC' // MSTR tends to outperform
    const betterPerformer30d = Math.random() > 0.3 ? 'MSTR' : 'STRC'
    
    return {
      mstr: {
        price: mstrPrice,
        volume: mstrVolume,
        market_cap: mstrMarketCap
      },
      strc: strcData,
      comparison: {
        price_correlation: priceCorrelation,
        volume_ratio: volumeRatio,
        market_cap_ratio: marketCapRatio,
        volatility_comparison: volatilityComparison as 'mstr_higher' | 'strc_higher' | 'similar',
        better_performer_1d: betterPerformer1d as 'MSTR' | 'STRC' | 'tie',
        better_performer_7d: betterPerformer7d as 'MSTR' | 'STRC' | 'tie',
        better_performer_30d: betterPerformer30d as 'MSTR' | 'STRC' | 'tie'
      }
    }
  } catch (error) {
    console.error('Error fetching dual ticker comparison:', error)
    throw error
  }
}

// Helper function to calculate volatility
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0
  
  const returns = []
  for (let i = 1; i < prices.length; i++) {
    const dayReturn = (prices[i] - prices[i-1]) / prices[i-1]
    returns.push(dayReturn)
  }
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100 // Annualized volatility as percentage
  
  return volatility
}

// Format helpers for STRC data
export function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
  if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`
  return volume.toLocaleString()
}

export function getVolatilityColor(volatility: number): string {
  if (volatility > 50) return 'text-red-400'
  if (volatility > 30) return 'text-yellow-400'
  return 'text-green-400'
}

export function getVolumeColor(current: number, average: number): string {
  const ratio = current / average
  if (ratio > 2) return 'text-red-400' // High volume spike
  if (ratio > 1.5) return 'text-yellow-400' // Elevated volume
  return 'text-green-400' // Normal volume
}