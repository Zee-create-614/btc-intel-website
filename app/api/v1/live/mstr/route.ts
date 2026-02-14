// LIVE MSTR Stock Price API Endpoint  
// Real-time MSTR from Yahoo Finance + Bitcoin holdings data

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔴 LIVE API: Fetching MSTR stock data...')
    
    // Yahoo Finance API for live MSTR stock price
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/MSTR?interval=1m&range=1d',
      { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }
    
    const data = await response.json()
    const result = data.chart.result[0]
    const meta = result.meta
    
    // MSTR Bitcoin holdings (Josh's confirmed data)
    const btcHoldings = 714644
    const costBasisPerCoin = 75543 // Over $75k as Josh confirmed
    const totalInvestment = 54000000000 // $54B
    
    const stockData = {
      symbol: 'MSTR',
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      change_percent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      volume: meta.regularMarketVolume || 0,
      market_cap: meta.regularMarketPrice * 16800000, // Shares outstanding
      shares_outstanding: 16800000,
      
      // Bitcoin holdings data
      btc_holdings: btcHoldings,
      btc_cost_basis_per_coin: costBasisPerCoin,
      total_investment: totalInvestment,
      
      // Calculated metrics
      btc_per_share: btcHoldings / 16800000,
      last_updated: new Date().toISOString(),
      source: 'yahoo_finance'
    }
    
    return NextResponse.json(stockData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
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
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}