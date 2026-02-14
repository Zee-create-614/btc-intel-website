// Live MSTR Preferreds Data (STRC, STRF, STRD, STRK) with trading volumes
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('🔴 LIVE PREFERREDS API: Fetching STRC, STRF, STRD, STRK...')
    
    const preferreds = ['STRC', 'STRF', 'STRD', 'STRK']
    let preferredData: any = {}
    
    // Try to read from strategy scraper data files
    try {
      const fs = require('fs')
      const path = require('path')
      
      for (const symbol of preferreds) {
        const dataPath = path.join(process.cwd(), '..', '..', 'strategy-scraper', `mstr_${symbol.toLowerCase()}_data.json`)
        
        if (fs.existsSync(dataPath)) {
          const rawData = fs.readFileSync(dataPath, 'utf8')
          const symbolData = JSON.parse(rawData)
          preferredData[symbol] = symbolData
          console.log(`✅ ${symbol}: $${symbolData.price}, Vol: ${symbolData.volume?.toLocaleString()}`)
        }
      }
    } catch (error) {
      console.log('⚠️ Strategy scraper data not available, using fallback')
    }
    
    // Fallback data if scraper files not available
    if (Object.keys(preferredData).length === 0) {
      console.log('📊 Using fallback preferred data with live Yahoo Finance API')
      
      // Try Yahoo Finance for live data
      for (const symbol of preferreds) {
        try {
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&timestamp=${Date.now()}`
          const response = await fetch(yahooUrl, {
            cache: 'no-store',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data?.chart?.result?.[0]?.meta) {
              const meta = data.chart.result[0].meta
              
              preferredData[symbol] = {
                symbol,
                price: meta.regularMarketPrice || meta.previousClose || 0,
                volume: meta.regularMarketVolume || 0,
                change: meta.regularMarketChange || 0,
                change_percent: meta.regularMarketChangePercent || 0,
                previous_close: meta.previousClose || 0,
                dividend_yield: getKnownDividendYield(symbol),
                timestamp: new Date().toISOString(),
                source: 'yahoo_finance_live'
              }
              
              console.log(`✅ ${symbol} live: $${preferredData[symbol].price}, Vol: ${preferredData[symbol].volume?.toLocaleString()}`)
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not fetch live ${symbol} data:`, error.message)
        }
      }
    }
    
    // Ultimate fallback with known good data
    if (Object.keys(preferredData).length === 0) {
      preferredData = getFallbackPreferredData()
    }
    
    // Calculate summary metrics
    const totalVolume = Object.values(preferredData).reduce((sum: number, stock: any) => sum + (stock.volume || 0), 0)
    const avgDividendYield = Object.values(preferredData).reduce((sum: number, stock: any) => sum + (stock.dividend_yield || 0), 0) / preferreds.length
    
    return NextResponse.json({
      preferreds: preferredData,
      summary: {
        total_symbols: Object.keys(preferredData).length,
        total_volume: totalVolume,
        average_dividend_yield: avgDividendYield,
        last_updated: new Date().toISOString()
      },
      symbols_available: Object.keys(preferredData),
      data_quality: preferredData.STRC?.source === 'yahoo_finance_live' ? 'live' : 'fallback'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('❌ Preferreds API error:', error)
    
    return NextResponse.json({
      preferreds: getFallbackPreferredData(),
      summary: {
        total_symbols: 4,
        total_volume: 208000000,
        average_dividend_yield: 11.53,
        last_updated: new Date().toISOString()
      },
      error: 'API error, using fallback data'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

function getKnownDividendYield(symbol: string): number {
  const yields: { [key: string]: number } = {
    'STRC': 11.25,
    'STRF': 10.80,
    'STRD': 12.10,
    'STRK': 11.95
  }
  return yields[symbol] || 11.0
}

function getFallbackPreferredData() {
  return {
    'STRC': {
      symbol: 'STRC',
      price: 25.42,
      volume: 103000000,
      change: 0.12,
      change_percent: 0.47,
      dividend_yield: 11.25,
      timestamp: new Date().toISOString(),
      source: 'fallback_estimated'
    },
    'STRF': {
      symbol: 'STRF',
      price: 24.85,
      volume: 45000000,
      change: 0.08,
      change_percent: 0.32,
      dividend_yield: 10.80,
      timestamp: new Date().toISOString(),
      source: 'fallback_estimated'
    },
    'STRD': {
      symbol: 'STRD',
      price: 25.15,
      volume: 32000000,
      change: 0.15,
      change_percent: 0.60,
      dividend_yield: 12.10,
      timestamp: new Date().toISOString(),
      source: 'fallback_estimated'
    },
    'STRK': {
      symbol: 'STRK',
      price: 24.95,
      volume: 28000000,
      change: -0.05,
      change_percent: -0.20,
      dividend_yield: 11.95,
      timestamp: new Date().toISOString(),
      source: 'fallback_estimated'
    }
  }
}