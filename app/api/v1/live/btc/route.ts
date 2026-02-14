// LIVE Bitcoin Price API Endpoint
// Real-time BTC price from CoinGecko

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔴 LIVE API: Fetching Bitcoin price...')
    
    // CoinGecko API for live Bitcoin price
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
      { 
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ Live Bitcoin data:', data)
    
    const btcData = {
      price_usd: data.bitcoin.usd,
      change_24h: data.bitcoin.usd_24h_change || 0,
      market_cap: data.bitcoin.usd_market_cap || 0,
      volume_24h: data.bitcoin.usd_24h_vol || 0,
      last_updated: new Date().toISOString(),
      source: 'coingecko'
    }
    
    return NextResponse.json(btcData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('❌ Live BTC API error:', error)
    
    // Fallback with Josh's current price
    return NextResponse.json({
      price_usd: 69851,
      change_24h: 2.5,
      market_cap: 1330000000000,
      volume_24h: 28000000000,
      last_updated: new Date().toISOString(),
      source: 'fallback'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}