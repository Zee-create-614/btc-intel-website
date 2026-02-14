import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Known government BTC holdings — updated from bitcointreasuries.net + public sources
// We maintain this list and multiply by live BTC price for real-time valuations
const GOVERNMENT_HOLDINGS = [
  {
    country: 'United States',
    flag: '🇺🇸',
    btc: 328372,
    type: 'Strategic Reserve',
    acquisition: 'Law enforcement seizures; Strategic Bitcoin Reserve (Executive Order, March 2025)',
    notes: 'Largest known sovereign holder. Established Strategic Bitcoin Reserve + Digital Asset Stockpile.',
    strategic: true,
  },
  {
    country: 'China',
    flag: '🇨🇳',
    btc: 190000,
    type: 'Seized Assets',
    acquisition: 'Large-scale criminal seizures (PlusToken, other fraud cases)',
    notes: 'Not a strategic reserve. Crypto trading banned since 2021. Holdings in state custody.',
    strategic: false,
  },
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    btc: 61245,
    type: 'Seized Assets',
    acquisition: 'Criminal asset seizures (major financial crime cases)',
    notes: 'Treasury-held assets. No reserve policy. Some portions may be liquidated.',
    strategic: false,
  },
  {
    country: 'Ukraine',
    flag: '🇺🇦',
    btc: 46351,
    type: 'Mixed Holdings',
    acquisition: 'International donations + official disclosures by public officials',
    notes: 'Assets distributed across multiple agencies. Not a unified reserve.',
    strategic: false,
  },
  {
    country: 'El Salvador',
    flag: '🇸🇻',
    btc: 7562,
    type: 'National Reserve',
    acquisition: 'Direct government purchases since 2021',
    notes: 'First country to adopt Bitcoin as legal tender and hold as sovereign reserve.',
    strategic: true,
  },
  {
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    btc: 6420,
    type: 'Sovereign Holdings',
    acquisition: 'Investment fund allocations',
    notes: 'Holdings through sovereign wealth / government investment entities.',
    strategic: false,
  },
  {
    country: 'Bhutan',
    flag: '🇧🇹',
    btc: 5600,
    type: 'State Mining',
    acquisition: 'Hydropower-backed Bitcoin mining operations',
    notes: 'Generated through state-linked mining using cheap hydroelectric power.',
    strategic: false,
  },
  {
    country: 'North Korea',
    flag: '🇰🇵',
    btc: 803,
    type: 'Illicit Holdings',
    acquisition: 'Cyberattacks and theft (Lazarus Group)',
    notes: 'Stolen via state-sponsored hacking. Not legitimate reserves.',
    strategic: false,
  },
  {
    country: 'Venezuela',
    flag: '🇻🇪',
    btc: 240,
    type: 'Government Holdings',
    acquisition: 'State mining and Petro-related activities',
    notes: 'Small holdings. Previously launched Petro cryptocurrency (failed).',
    strategic: false,
  },
  {
    country: 'Finland',
    flag: '🇫🇮',
    btc: 90,
    type: 'Seized Assets',
    acquisition: 'Criminal seizures',
    notes: 'Remaining after partial liquidation. Previously held ~1,981 BTC.',
    strategic: false,
  },
  {
    country: 'Germany',
    flag: '🇩🇪',
    btc: 0,
    type: 'Liquidated',
    acquisition: 'Seized from Movie2k piracy case (~50,000 BTC)',
    notes: 'Sold entire ~50K BTC stash in July 2024. Widely criticized.',
    strategic: false,
  },
]

export async function GET(request: NextRequest) {
  try {
    // Fetch live BTC price
    let btcPrice = 97000 // fallback
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      const data = await res.json()
      if (data?.bitcoin?.usd) btcPrice = data.bitcoin.usd
    } catch {
      // Try Yahoo Finance as fallback
      try {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1d&range=1d', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        })
        const data = await res.json()
        const close = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        if (close) btcPrice = close
      } catch {}
    }

    const holdings = GOVERNMENT_HOLDINGS.map(h => ({
      ...h,
      value_usd: h.btc * btcPrice,
      pct_supply: ((h.btc / 21000000) * 100),
    }))

    const totalBtc = holdings.reduce((s, h) => s + h.btc, 0)
    const totalValue = holdings.reduce((s, h) => s + h.value_usd, 0)
    const strategicBtc = holdings.filter(h => h.strategic).reduce((s, h) => s + h.btc, 0)

    return NextResponse.json({
      btc_price: btcPrice,
      total_btc: totalBtc,
      total_value_usd: totalValue,
      strategic_reserve_btc: strategicBtc,
      pct_total_supply: ((totalBtc / 21000000) * 100),
      holdings,
      last_updated: new Date().toISOString(),
      source: 'bitcointreasuries.net + public reports',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
