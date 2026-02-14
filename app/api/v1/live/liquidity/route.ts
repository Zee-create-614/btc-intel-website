// Live Global Liquidity Data API
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('🌊 LIVE LIQUIDITY API: Fetching global liquidity data...')
    
    // Try to read from global liquidity tracker data file
    try {
      const fs = require('fs')
      const path = require('path')
      
      // Look for global liquidity tracker data (try multiple paths)
      const possiblePaths = [
        path.join(process.cwd(), '..', '..', 'global-liquidity-tracker', 'liquidity_data.json'),
        path.join(process.cwd(), '..', '..', '..', 'global-liquidity-tracker', 'liquidity_data.json'),
        'C:\\Users\\joshs\\.openclaw\\workspace\\global-liquidity-tracker\\liquidity_data.json'
      ]
      
      let dataPath = null
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          dataPath = testPath
          break
        }
      }
      
      if (dataPath) {
        const rawData = fs.readFileSync(dataPath, 'utf8')
        const liquidityData = JSON.parse(rawData)
        
        console.log('✅ Live liquidity data from tracker:', liquidityData)
        
        return NextResponse.json({
          composite_score: liquidityData.composite_score,
          btc_correlation: liquidityData.btc_correlation,
          btc_price: liquidityData.btc_price,
          liquidity_state: liquidityData.liquidity_state,
          components: liquidityData.components,
          analysis: liquidityData.analysis,
          last_updated: liquidityData.timestamp,
          source: 'global_liquidity_tracker_live'
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    } catch (error) {
      console.log('⚠️ Liquidity tracker data not available:', error.message)
    }
    
    // Fallback with recent data structure
    console.log('📊 Using current liquidity snapshot')
    
    return NextResponse.json({
      composite_score: 58.1,
      btc_correlation: 0.285,
      btc_price: 69386,
      liquidity_state: 'MILDLY_EXPANSIONARY',
      components: {
        us_m2: 22.41,
        fed_balance_sheet: 6.62,
        net_fed_liquidity: 5707,
        reverse_repo: 0.4,
        tga: 915,
        credit_spread: 2.92,
        dxy: 96.88,
        ecb_assets: 6.26,
        boj_assets: 6.83
      },
      analysis: "Liquidity mildly expansionary — supportive for risk assets. RRP nearly fully drained (bullish). DXY weakening below 97 helps. Credit spreads tight at 2.92% = no stress.",
      last_updated: new Date().toISOString(),
      source: 'fallback_current'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('❌ Liquidity API error:', error)
    
    return NextResponse.json({
      composite_score: 58.1,
      btc_correlation: 0.285,
      btc_price: 69386,
      liquidity_state: 'MILDLY_EXPANSIONARY',
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