import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ANALYTICS_DIR = join(process.cwd(), 'data')
const REGISTRATIONS_FILE = join(ANALYTICS_DIR, 'registrations.jsonl')

// Ensure analytics directory exists
if (!existsSync(ANALYTICS_DIR)) {
  require('fs').mkdirSync(ANALYTICS_DIR, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Add server-side data
    const registration = {
      ...data,
      id: Date.now() + Math.random(),
      server_timestamp: new Date().toISOString(),
      ip_address: request.ip || 
                 request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    }

    // Append to JSONL file
    const jsonlLine = JSON.stringify(registration) + '\n'
    
    if (existsSync(REGISTRATIONS_FILE)) {
      require('fs').appendFileSync(REGISTRATIONS_FILE, jsonlLine)
    } else {
      writeFileSync(REGISTRATIONS_FILE, jsonlLine)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics registration error:', error)
    return NextResponse.json({ error: 'Failed to track registration' }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!existsSync(REGISTRATIONS_FILE)) {
      return NextResponse.json([])
    }

    const content = readFileSync(REGISTRATIONS_FILE, 'utf-8')
    const registrations = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))

    // Return summary statistics
    const total = registrations.length
    const last24h = registrations.filter(r => 
      new Date(r.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length
    
    const sources = registrations.reduce((acc: Record<string, number>, reg) => {
      const source = reg.utm_source || reg.referrer || 'direct'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    const tiers = registrations.reduce((acc: Record<string, number>, reg) => {
      const tier = reg.subscription_tier || 'free'
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      total,
      last24h,
      sources,
      tiers,
      recent: registrations.slice(-10)
    })
  } catch (error) {
    console.error('Analytics registration fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}