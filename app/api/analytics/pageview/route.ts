import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ANALYTICS_DIR = join(process.cwd(), 'data')
const PAGEVIEWS_FILE = join(ANALYTICS_DIR, 'pageviews.jsonl')

// Ensure analytics directory exists
if (!existsSync(ANALYTICS_DIR)) {
  require('fs').mkdirSync(ANALYTICS_DIR, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Add server-side data
    const pageview = {
      ...data,
      id: Date.now() + Math.random(),
      server_timestamp: new Date().toISOString(),
      ip_address: request.ip || 
                 request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    }

    // Append to JSONL file
    const jsonlLine = JSON.stringify(pageview) + '\n'
    
    if (existsSync(PAGEVIEWS_FILE)) {
      require('fs').appendFileSync(PAGEVIEWS_FILE, jsonlLine)
    } else {
      writeFileSync(PAGEVIEWS_FILE, jsonlLine)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics pageview error:', error)
    return NextResponse.json({ error: 'Failed to track pageview' }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!existsSync(PAGEVIEWS_FILE)) {
      return NextResponse.json([])
    }

    const content = readFileSync(PAGEVIEWS_FILE, 'utf-8')
    const pageviews = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .slice(-100) // Return last 100 pageviews

    return NextResponse.json(pageviews)
  } catch (error) {
    console.error('Analytics pageview fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch pageviews' }, { status: 500 })
  }
}