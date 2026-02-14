import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// VaultSignal - BTC & MSTR intelligence indicator
// Combines on-chain, macro, sentiment, and technical signals
// This is the foundation - will evolve into the full VaultSignal product

export async function GET(request: NextRequest) {
  try {
    // Fetch live prices
    const [btcRes, mstrRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?range=5d&interval=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/MSTR?range=5d&interval=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
    ])

    const btcData = await btcRes.json()
    const mstrData = await mstrRes.json()

    const btcResult = btcData?.chart?.result?.[0]
    const mstrResult = mstrData?.chart?.result?.[0]

    const btcCloses = btcResult?.indicators?.quote?.[0]?.close?.filter((c: any) => c != null) || []
    const mstrCloses = mstrResult?.indicators?.quote?.[0]?.close?.filter((c: any) => c != null) || []
    const btcVolumes = btcResult?.indicators?.quote?.[0]?.volume?.filter((v: any) => v != null) || []
    const mstrVolumes = mstrResult?.indicators?.quote?.[0]?.volume?.filter((v: any) => v != null) || []

    // Calculate signals
    const btcPrice = btcCloses[btcCloses.length - 1] || 0
    const btcPrev = btcCloses[btcCloses.length - 2] || btcPrice
    const btcChange = btcPrice > 0 ? ((btcPrice - btcPrev) / btcPrev) * 100 : 0
    
    const mstrPrice = mstrCloses[mstrCloses.length - 1] || 0
    const mstrPrev = mstrCloses[mstrCloses.length - 2] || mstrPrice
    const mstrChange = mstrPrice > 0 ? ((mstrPrice - mstrPrev) / mstrPrev) * 100 : 0

    // Simple momentum signal (will be replaced with full VaultSignal algo)
    const btcMomentum = btcCloses.length >= 3
      ? (btcCloses[btcCloses.length - 1] - btcCloses[0]) / btcCloses[0] * 100
      : 0
    
    const mstrMomentum = mstrCloses.length >= 3
      ? (mstrCloses[mstrCloses.length - 1] - mstrCloses[0]) / mstrCloses[0] * 100
      : 0

    // Volume trend
    const avgBtcVol = btcVolumes.length > 0 ? btcVolumes.reduce((a: number, b: number) => a + b, 0) / btcVolumes.length : 0
    const latestBtcVol = btcVolumes[btcVolumes.length - 1] || 0
    const btcVolTrend = avgBtcVol > 0 ? latestBtcVol / avgBtcVol : 1

    const avgMstrVol = mstrVolumes.length > 0 ? mstrVolumes.reduce((a: number, b: number) => a + b, 0) / mstrVolumes.length : 0
    const latestMstrVol = mstrVolumes[mstrVolumes.length - 1] || 0
    const mstrVolTrend = avgMstrVol > 0 ? latestMstrVol / avgMstrVol : 1

    // Composite score (-100 to +100)
    const btcScore = Math.max(-100, Math.min(100, 
      btcMomentum * 10 + // momentum weight
      btcChange * 5 + // daily change weight
      (btcVolTrend > 1.2 ? 15 : btcVolTrend < 0.8 ? -10 : 0) // volume confirmation
    ))
    
    const mstrScore = Math.max(-100, Math.min(100,
      mstrMomentum * 8 +
      mstrChange * 5 +
      (mstrVolTrend > 1.2 ? 15 : mstrVolTrend < 0.8 ? -10 : 0) +
      btcScore * 0.3 // BTC correlation
    ))

    const getSignal = (score: number) => {
      if (score >= 50) return 'STRONG BUY'
      if (score >= 20) return 'BUY'
      if (score >= -20) return 'NEUTRAL'
      if (score >= -50) return 'SELL'
      return 'STRONG SELL'
    }

    return NextResponse.json({
      btc: {
        price: btcPrice,
        change_24h: btcChange,
        momentum_5d: btcMomentum,
        volume_trend: btcVolTrend,
        score: Math.round(btcScore),
        signal: getSignal(btcScore),
      },
      mstr: {
        price: mstrPrice,
        change_24h: mstrChange,
        momentum_5d: mstrMomentum,
        volume_trend: mstrVolTrend,
        score: Math.round(mstrScore),
        signal: getSignal(mstrScore),
      },
      timestamp: new Date().toISOString(),
      version: 'v0.1-beta',
      note: 'VaultSignal indicator - early beta. Full on-chain + macro + sentiment coming soon.',
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      btc: { price: 0, change_24h: 0, momentum_5d: 0, volume_trend: 1, score: 0, signal: 'NEUTRAL' },
      mstr: { price: 0, change_24h: 0, momentum_5d: 0, volume_trend: 1, score: 0, signal: 'NEUTRAL' },
      error: error?.message,
      timestamp: new Date().toISOString(),
      version: 'v0.1-beta',
    })
  }
}
