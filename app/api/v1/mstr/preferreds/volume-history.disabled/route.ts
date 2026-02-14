export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'STRC'
  const period = searchParams.get('period') || '30d'

  try {
    // For now, generate realistic mock historical data
    // TODO: Replace with real Yahoo Finance historical data fetching
    const volumeHistory = generateVolumeHistory(symbol, period)
    
    return new Response(JSON.stringify({
      symbol,
      period,
      volume_history: volumeHistory,
      data_source: 'generated', // Will be 'yahoo_finance' when real
      last_updated: new Date().toISOString(),
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  } catch (error) {
    console.log(`Volume history API error for ${symbol}:`, error)
    
    return new Response(JSON.stringify({
      error: 'Failed to fetch volume history',
      symbol,
      period,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

function generateVolumeHistory(symbol: string, period: string) {
  const now = new Date()
  const data = []
  
  // Define period lengths
  const periodDays: { [key: string]: number } = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '3m': 90,
    'ytd': getDaysFromYearStart(),
    '1y': 365,
    '5y': 1825,
    'max': 2190 // ~6 years for MSTR preferreds
  }
  
  const days = periodDays[period] || 30
  const dataPoints = Math.min(days, period === '24h' ? 24 : days) // Hourly for 24h, daily otherwise
  const interval = period === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 1 hour or 1 day
  
  // Base volumes by symbol (in millions)
  const baseVolumes: { [key: string]: number } = {
    'STRC': 103000000, // $103M
    'STRF': 45000000,  // $45M
    'STRD': 32000000,  // $32M
    'STRK': 28000000,  // $28M
    'SATA': 15000000   // $15M
  }
  
  const baseVolume = baseVolumes[symbol] || 50000000
  
  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * interval))
    
    // Create realistic volume patterns
    const dayOfWeek = timestamp.getDay()
    const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1.0 // Lower weekend volume
    const hourOfDay = timestamp.getHours()
    const marketHoursMultiplier = (hourOfDay >= 9 && hourOfDay <= 16) ? 1.2 : 0.8 // Higher during market hours
    
    // Add some volatility events
    const volatilityEvent = Math.random() < 0.05 ? (1.5 + Math.random() * 2) : 1.0 // 5% chance of high volume event
    
    const volume = Math.floor(baseVolume * 
      weekdayMultiplier * 
      marketHoursMultiplier * 
      volatilityEvent * 
      (0.5 + Math.random() * 1.0) // ±50% random variation
    )
    
    // Generate realistic price (mock data)
    const basePrice = symbol === 'STRC' ? 25.42 : symbol === 'STRF' ? 24.85 : symbol === 'STRD' ? 25.15 : symbol === 'STRK' ? 24.95 : 26.00
    const price = basePrice + (Math.random() - 0.5) * 3 // ±$1.50 variation
    
    data.push({
      timestamp: timestamp.toISOString(),
      volume: volume,
      price: Math.round(price * 100) / 100, // Round to cents
      period_type: period === '24h' ? 'hourly' : 'daily'
    })
  }
  
  return data
}

function getDaysFromYearStart(): number {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  return Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
}