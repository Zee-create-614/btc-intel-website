// Version endpoint to check deployment status
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    version: 'v2.14.09.15',
    build: 'NAV COLORS + DILUTED NAV CALCULATION FIXED',
    timestamp: new Date().toISOString(),
    changes: [
      'Fixed +19% NAV premium color to GREEN',
      'Fixed diluted NAV calculation method',
      'Removed problematic LiveMSTRAnalytics component',
      'Added proper BTC-based diluted NAV formula'
    ],
    deployed_at: '2026-02-14T15:09:00Z'
  })
}