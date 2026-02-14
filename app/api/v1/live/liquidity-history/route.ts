import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Historical global liquidity composite score + BTC price for charting
// We fetch M2 from FRED and combine with BTC price history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1Y'

    // Fetch US M2 from FRED (monthly, billions)
    const fredKey = process.env.FRED_API_KEY || '6640fe5217f7ce0378e770fac029393c'
    
    // Determine date range
    const now = new Date()
    let startDate = new Date()
    switch (period) {
      case '6M': startDate.setMonth(now.getMonth() - 6); break
      case '1Y': startDate.setFullYear(now.getFullYear() - 1); break
      case '2Y': startDate.setFullYear(now.getFullYear() - 2); break
      case '5Y': startDate.setFullYear(now.getFullYear() - 5); break
      case 'MAX': startDate = new Date('2014-01-01'); break
      default: startDate.setFullYear(now.getFullYear() - 1)
    }
    const startStr = startDate.toISOString().split('T')[0]

    // Fetch multiple FRED series in parallel
    const fredSeries = ['WM2NS', 'WALCL', 'RRPONTSYD', 'WTREGEN', 'BAMLH0A0HYM2']
    const seriesNames: Record<string, string> = {
      WM2NS: 'us_m2',
      WALCL: 'fed_balance_sheet',
      RRPONTSYD: 'reverse_repo',
      WTREGEN: 'tga',
      BAMLH0A0HYM2: 'credit_spread',
    }

    const fredPromises = fredSeries.map(id =>
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${fredKey}&file_type=json&observation_start=${startStr}&sort_order=asc`)
        .then(r => r.json())
        .then(d => ({ id, observations: d.observations || [] }))
        .catch(e => { console.error(`FRED ${id} error:`, e.message); return { id, observations: [] } })
    )

    // Fetch BTC price history from CoinGecko
    const days = Math.ceil((now.getTime() - startDate.getTime()) / 86400000)
    const btcPromise = fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`)
      .then(r => r.json())
      .catch(() => ({ prices: [] }))

    const [fredResults, btcData] = await Promise.all([
      Promise.all(fredPromises),
      btcPromise
    ])

    // Build date-indexed maps from FRED
    const seriesMap: Record<string, Record<string, number>> = {}
    for (const { id, observations } of fredResults) {
      const name = seriesNames[id]
      seriesMap[name] = {}
      for (const obs of observations) {
        if (obs.value !== '.') {
          seriesMap[name][obs.date] = parseFloat(obs.value)
        }
      }
    }

    // Build BTC price map (date -> price)
    const btcPriceMap: Record<string, number> = {}
    if (btcData.prices) {
      for (const [ts, price] of btcData.prices) {
        const date = new Date(ts).toISOString().split('T')[0]
        btcPriceMap[date] = price
      }
    }

    // Get all unique dates from M2 (monthly) and fill forward other series
    const m2Dates = Object.keys(seriesMap.us_m2 || {}).sort()
    
    // Also build a weekly timeline from fed_balance_sheet (weekly) for more granular data
    const allDates = new Set<string>()
    for (const name of Object.keys(seriesMap)) {
      for (const date of Object.keys(seriesMap[name])) {
        allDates.add(date)
      }
    }
    const sortedDates = Array.from(allDates).sort()

    // Compute composite score for each date
    const history: Array<{
      date: string
      composite_score: number
      btc_price: number
      us_m2: number
      fed_balance_sheet: number
      reverse_repo: number
      tga: number
      credit_spread: number
      net_liquidity: number
    }> = []

    let lastValues: Record<string, number> = {}

    for (const date of sortedDates) {
      // Forward-fill values
      for (const name of Object.keys(seriesMap)) {
        if (seriesMap[name][date] !== undefined) {
          lastValues[name] = seriesMap[name][date]
        }
      }

      const m2 = lastValues.us_m2 || 0
      const fed = lastValues.fed_balance_sheet || 0
      const rrp = lastValues.reverse_repo || 0
      const tga = lastValues.tga || 0
      const spread = lastValues.credit_spread || 0

      // Skip dates where we don't have enough data
      if (!m2 && !fed) continue

      // Net liquidity = Fed balance sheet - RRP - TGA (in billions)
      // Fed balance sheet is in millions from FRED, convert
      const fedB = fed / 1000 // millions to billions
      const rrpB = rrp / 1000
      const tgaB = tga / 1000
      const netLiq = fedB - rrpB - tgaB

      // Composite score (simplified version of tracker logic)
      let score = 50 // baseline
      
      // M2 growth signal (higher = more expansionary)
      if (m2 > 21000) score += 5
      if (m2 > 22000) score += 5
      
      // RRP drain (lower = more liquidity released)
      if (rrpB < 500) score += 10
      else if (rrpB < 1000) score += 5
      else if (rrpB > 2000) score -= 10
      
      // Credit spread (lower = risk-on)
      if (spread < 3) score += 5
      else if (spread < 4) score += 0
      else if (spread > 5) score -= 10
      else if (spread > 8) score -= 20
      
      // TGA (higher = draining liquidity)
      if (tgaB > 800) score -= 5
      if (tgaB > 1000) score -= 5
      
      // Net liquidity level
      if (netLiq > 5000) score += 5
      if (netLiq > 6000) score += 5

      score = Math.max(0, Math.min(100, score))

      // Find closest BTC price
      let btcPrice = 0
      const btcDates = Object.keys(btcPriceMap).sort()
      for (let i = btcDates.length - 1; i >= 0; i--) {
        if (btcDates[i] <= date) {
          btcPrice = btcPriceMap[btcDates[i]]
          break
        }
      }

      history.push({
        date,
        composite_score: Math.round(score * 10) / 10,
        btc_price: Math.round(btcPrice),
        us_m2: m2,
        fed_balance_sheet: Math.round(fedB * 100) / 100,
        reverse_repo: Math.round(rrpB * 100) / 100,
        tga: Math.round(tgaB * 100) / 100,
        credit_spread: Math.round(spread * 100) / 100,
        net_liquidity: Math.round(netLiq * 100) / 100,
      })
    }

    // Downsample if too many points (keep ~200 max for chart performance)
    let sampled = history
    if (history.length > 200) {
      const step = Math.ceil(history.length / 200)
      sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1)
    }

    return NextResponse.json({
      period,
      count: sampled.length,
      history: sampled,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error: any) {
    console.error('Liquidity history API error:', error)
    return NextResponse.json({ error: error.message, history: [] }, { status: 500 })
  }
}
