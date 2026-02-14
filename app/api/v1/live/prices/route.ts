import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const CACHE_DB = path.join(process.cwd(), '..', 'backend', 'price_cache.db')
const PRIORITY_FILE = path.join(process.cwd(), '..', 'backend', 'priority_tickers.txt')

export async function GET(request: NextRequest) {
  const tickersParam = request.nextUrl.searchParams.get('tickers')
  if (!tickersParam) {
    return NextResponse.json({ error: 'Missing tickers parameter' }, { status: 400 })
  }

  const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase()).filter(t => /^[A-Z]{1,5}$/.test(t))
  if (tickers.length === 0) {
    return NextResponse.json({ prices: {} })
  }

  // Bump requested tickers to priority queue
  try {
    fs.appendFileSync(PRIORITY_FILE, tickers.join('\n') + '\n')
  } catch {}

  // Read from cache DB
  try {
    const db = new Database(CACHE_DB, { readonly: true, fileMustExist: true })
    const placeholders = tickers.map(() => '?').join(',')
    const rows = db.prepare(`SELECT ticker, price, updated_at FROM price_cache WHERE ticker IN (${placeholders})`).all(...tickers) as any[]
    db.close()

    const prices: Record<string, { price: number; updated: string }> = {}
    for (const row of rows) {
      prices[row.ticker] = { price: row.price, updated: row.updated_at }
    }

    return NextResponse.json({ prices })
  } catch (e: any) {
    // DB might not exist yet
    return NextResponse.json({ prices: {}, error: 'Price cache not ready' })
  }
}
