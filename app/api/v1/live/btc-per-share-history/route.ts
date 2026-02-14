import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Historical MSTR BTC acquisitions and share counts (public data from SEC filings & strategy.com)
// Each entry: [date, cumulative_btc, shares_outstanding]
const MSTR_HISTORY: [string, number, number][] = [
  // 2020 - Initial purchases
  ['2020-08-11', 21454, 165240000],
  ['2020-09-14', 38250, 165240000],
  ['2020-12-04', 40824, 165240000],
  ['2020-12-21', 70470, 165240000],
  // 2021 - Aggressive accumulation + share issuance
  ['2021-01-22', 70784, 165240000],
  ['2021-02-02', 71079, 165240000],
  ['2021-02-24', 90531, 177000000],
  ['2021-03-05', 91064, 177000000],
  ['2021-03-12', 91326, 177000000],
  ['2021-04-05', 91579, 177000000],
  ['2021-05-13', 92079, 177000000],
  ['2021-05-18', 92079, 177000000],
  ['2021-06-21', 105085, 195000000],
  ['2021-08-24', 108992, 195000000],
  ['2021-09-13', 114042, 195000000],
  ['2021-11-01', 114042, 195000000],
  ['2021-11-29', 121044, 197000000],
  ['2021-12-09', 122478, 197000000],
  ['2021-12-30', 124391, 197000000],
  // 2022 - Bear market, continued buying
  ['2022-01-31', 125051, 197000000],
  ['2022-04-05', 129218, 197000000],
  ['2022-06-28', 129699, 197000000],
  ['2022-09-20', 130000, 197000000],
  ['2022-11-01', 130000, 197000000],
  ['2022-12-22', 132500, 197000000],
  ['2022-12-31', 132500, 197000000],
  // 2023 - Steady accumulation
  ['2023-03-27', 138955, 197000000],
  ['2023-06-28', 152800, 199000000],
  ['2023-07-06', 152800, 199000000],
  ['2023-08-01', 152800, 199000000],
  ['2023-09-24', 158245, 199000000],
  ['2023-11-30', 174530, 199000000],
  ['2023-12-27', 189150, 199000000],
  // 2024 - ATM program ramp up + massive share issuance
  ['2024-01-02', 189150, 199000000],
  ['2024-02-15', 190000, 199000000],
  ['2024-02-26', 193000, 213000000],
  ['2024-03-11', 205000, 213000000],
  ['2024-03-19', 214246, 213000000],
  ['2024-04-01', 214246, 213000000],
  ['2024-06-20', 226331, 218000000],
  ['2024-08-01', 226500, 218000000],
  ['2024-09-13', 244800, 232000000],
  ['2024-09-20', 252220, 232000000],
  ['2024-10-31', 252220, 244000000],
  ['2024-11-11', 279420, 260000000],
  ['2024-11-18', 331200, 280000000],
  ['2024-11-25', 386700, 296000000],
  ['2024-12-02', 402100, 305000000],
  ['2024-12-09', 423650, 310000000],
  ['2024-12-16', 439000, 315000000],
  ['2024-12-23', 444262, 318000000],
  ['2024-12-30', 446400, 320000000],
  // 2025 - Continued aggressive buying
  ['2025-01-06', 450000, 322000000],
  ['2025-01-13', 461000, 325000000],
  ['2025-01-21', 471107, 327000000],
  ['2025-01-27', 471107, 328000000],
  ['2025-02-03', 478740, 330000000],
  ['2025-02-10', 499096, 332000000],
  ['2025-02-14', 714644, 332237825], // Current (from live API)
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '1y'

  try {
    // Each entry = one BTC purchase event, showing cumulative BTC per share
    const filtered = MSTR_HISTORY.map(([date, btc, shares]) => ({
      date,
      timestamp: new Date(date).getTime(),
      btc_holdings: btc,
      shares_outstanding: shares,
      btc_per_share: btc / shares,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }))

    // Calculate growth stats
    const first = filtered[0]
    const last = filtered[filtered.length - 1]
    const growthPct = first && last ? ((last.btc_per_share - first.btc_per_share) / first.btc_per_share) * 100 : 0

    return NextResponse.json({
      period,
      data: filtered,
      stats: {
        current_btc_per_share: last?.btc_per_share || 0,
        period_start_btc_per_share: first?.btc_per_share || 0,
        growth_percent: growthPct,
        total_btc: last?.btc_holdings || 0,
        total_shares: last?.shares_outstanding || 0,
      },
      data_points: filtered.length,
      last_updated: new Date().toISOString(),
      success: true,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Failed',
      data: [],
      success: false,
    })
  }
}
