// LIVE MSTR Stock Price API Endpoint  
// Real-time MSTR from Yahoo Finance + Bitcoin holdings data

import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('🔴 LIVE API: Fetching MSTR stock data...')
    
    // Yahoo Finance API for LIVE MSTR stock price  
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/MSTR?interval=1m&range=1d&timestamp=${Date.now()}`,
      { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    )
    
    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status}`)
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ YAHOO FINANCE LIVE DATA:', data)
    
    const result = data.chart.result[0]
    const meta = result.meta
    
    console.log('🔴 LIVE MSTR PRICE FROM YAHOO:', meta.regularMarketPrice)
    
    // MSTR Bitcoin holdings (Josh's confirmed data)
    const btcHoldings = 714644
    const costBasisPerCoin = 75543 // Over $75k as Josh confirmed
    const totalInvestment = 54000000000 // $54B
    
    const currentPrice = meta.regularMarketPrice || meta.previousClose || 480
    const previousClose = meta.previousClose || currentPrice
    const dailyChange = currentPrice - previousClose
    const dailyChangePercent = (dailyChange / previousClose) * 100
    
    const stockData = {
      symbol: 'MSTR',
      price: currentPrice,
      change: dailyChange,
      change_percent: dailyChangePercent,
      volume: meta.regularMarketVolume || 2500000,
      market_cap: currentPrice * 16800000, // Current market cap
      shares_outstanding: 16800000,
      
      // Bitcoin holdings data (Josh's confirmed numbers)
      btc_holdings: btcHoldings,
      btc_cost_basis_per_coin: costBasisPerCoin,
      total_investment: totalInvestment,
      
      // Calculated metrics
      btc_per_share: btcHoldings / 16800000,
      last_updated: new Date().toISOString(),
      source: 'yahoo_finance_live',
      timestamp: Date.now(),
      raw_data: {
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        marketState: meta.marketState
      }
    }
    
    console.log('✅ FINAL MSTR DATA:', stockData)
    
    return NextResponse.json(stockData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache', 
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('❌ Live MSTR API error:', error)
    
    // Fallback data with Josh's specifications
    return NextResponse.json({
      symbol: 'MSTR',
      price: 480.00,
      change: 5.20,
      change_percent: 1.10,
      volume: 2500000,
      market_cap: 8064000000,
      shares_outstanding: 16800000,
      btc_holdings: 714644,
      btc_cost_basis_per_coin: 75543,
      total_investment: 54000000000,
      btc_per_share: 0.0425,
      last_updated: new Date().toISOString(),
      source: 'fallback'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0', 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }
}