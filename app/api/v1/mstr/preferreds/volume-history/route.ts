export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'STRC'
  const period = searchParams.get('period') || '1mo'

  try {
    // Map period to Yahoo Finance params
    const periodMap: Record<string, { range: string; interval: string }> = {
      '5d': { range: '5d', interval: '1d' },
      '1mo': { range: '1mo', interval: '1d' },
      '3mo': { range: '3mo', interval: '1d' },
      '6mo': { range: '6mo', interval: '1wk' },
      '1y': { range: '1y', interval: '1wk' },
      'max': { range: 'max', interval: '1mo' },
    }

    const params = periodMap[period] || periodMap['1mo']
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${params.range}&interval=${params.interval}&includePrePost=false`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`)
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]
    
    if (!result) {
      throw new Error('No chart data returned')
    }

    const timestamps = result.timestamp || []
    const quote = result.indicators?.quote?.[0] || {}
    const volumes = quote.volume || []
    const closes = quote.close || []

    const volumeHistory = timestamps.map((ts: number, i: number) => ({
      timestamp: new Date(ts * 1000).toISOString(),
      date: new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: volumes[i] ?? 0,
      price: closes[i] != null ? Math.round(closes[i] * 100) / 100 : null,
    })).filter((d: any) => d.volume > 0)

    return new Response(JSON.stringify({
      symbol,
      period,
      volume_history: volumeHistory,
      data_source: 'yahoo_finance',
      data_points: volumeHistory.length,
      last_updated: new Date().toISOString(),
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // cache 5 min
      }
    })
  } catch (error: any) {
    console.error(`Volume history error for ${symbol}:`, error?.message)
    
    return new Response(JSON.stringify({
      error: error?.message || 'Failed to fetch volume history',
      symbol,
      period,
      volume_history: [],
      success: false,
    }), {
      status: 200, // Don't break the frontend
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}
