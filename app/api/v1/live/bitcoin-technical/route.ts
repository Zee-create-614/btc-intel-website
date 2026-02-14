import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// RSI calculation function
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50 // Not enough data
  
  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }
  
  let avgGain = 0
  let avgLoss = 0
  
  // Initial average calculation
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i]
    else avgLoss += Math.abs(changes[i])
  }
  
  avgGain /= period
  avgLoss /= period
  
  // Subsequent calculations using smoothing
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = ((avgGain * (period - 1)) + changes[i]) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = ((avgLoss * (period - 1)) + Math.abs(changes[i])) / period
    }
  }
  
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// EMA calculation for MACD
function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const emaArray: number[] = []
  emaArray[0] = prices[0]
  
  for (let i = 1; i < prices.length; i++) {
    emaArray[i] = (prices[i] * k) + (emaArray[i - 1] * (1 - k))
  }
  
  return emaArray
}

// MACD calculation
function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1]
  
  // Determine signal
  let signal = 'NEUTRAL'
  if (macdLine > 50) signal = 'BULLISH'
  else if (macdLine < -50) signal = 'BEARISH'
  
  return {
    value: Math.round(macdLine * 100) / 100,
    signal,
    description: signal === 'BULLISH' ? 'Positive momentum' : 
                signal === 'BEARISH' ? 'Negative momentum' : 'Sideways trend'
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔴 LIVE API: Fetching Bitcoin technical indicators...')
    
    // Get Bitcoin price from our existing API
    const btcResponse = await fetch('http://localhost:3002/api/v1/live/btc', {
      cache: 'no-store'
    })
    const btcData = await btcResponse.json()
    
    // Fetch 30-day Bitcoin price history from CoinGecko
    const historyResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily',
      {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
    )
    
    let rsi = 50 // Default neutral
    let macd = { value: 0, signal: 'NEUTRAL', description: 'Normal trading activity' }
    let dataSource = 'fallback'
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json()
      const prices = historyData.prices?.map((item: any) => item[1]) || []
      
      if (prices.length >= 15) {
        rsi = calculateRSI(prices)
        macd = calculateMACD(prices)
        dataSource = 'live_calculation'
        console.log('✅ Bitcoin technical indicators calculated from live data')
      }
    }
    
    // Institutional bias based on volume and price movement
    const priceChange = btcData.change_24h || 0
    let institutionalBias = 'NEUTRAL'
    let biasDescription = 'Normal trading activity'
    
    if (priceChange > 3) {
      institutionalBias = 'BULLISH'
      biasDescription = 'Strong buying pressure'
    } else if (priceChange < -3) {
      institutionalBias = 'BEARISH' 
      biasDescription = 'Selling pressure detected'
    }
    
    const technicalData = {
      symbol: 'BTC',
      current_price: btcData.price_usd || 70000,
      price_change_percent: priceChange,
      technical_indicators: {
        rsi: {
          value: Math.round(rsi * 10) / 10,
          period: 14,
          signal: rsi >= 70 ? 'OVERBOUGHT' : rsi <= 30 ? 'OVERSOLD' : 'NEUTRAL'
        },
        macd,
        institutional_bias: {
          signal: institutionalBias,
          description: biasDescription
        }
      },
      market_sentiment: rsi > 60 && macd.signal === 'BULLISH' ? 'STRONG_BULLISH' :
                        rsi < 40 && macd.signal === 'BEARISH' ? 'STRONG_BEARISH' : 'NEUTRAL',
      last_updated: new Date().toISOString(),
      timestamp: Date.now()
    }
    
    console.log('✅ Bitcoin technical data:', technicalData)
    
    return NextResponse.json(technicalData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('❌ Error fetching Bitcoin technical indicators:', error)
    
    // Fallback data
    return NextResponse.json({
      symbol: 'BTC',
      current_price: 70000,
      price_change_percent: 0,
      technical_indicators: {
        rsi: {
          value: 50.0,
          period: 14,
          signal: 'NEUTRAL'
        },
        macd: {
          value: 0,
          signal: 'NEUTRAL',
          description: 'Normal trading activity'
        },
        institutional_bias: {
          signal: 'NEUTRAL', 
          description: 'Normal trading activity'
        }
      },
      market_sentiment: 'NEUTRAL',
      last_updated: new Date().toISOString(),
      timestamp: Date.now(),
      error: 'Bitcoin technical indicators temporarily unavailable'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}