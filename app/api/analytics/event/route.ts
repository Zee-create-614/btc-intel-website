import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ANALYTICS_DIR = join(process.cwd(), 'data')
const EVENTS_FILE = join(ANALYTICS_DIR, 'events.jsonl')

// Ensure analytics directory exists
if (!existsSync(ANALYTICS_DIR)) {
  require('fs').mkdirSync(ANALYTICS_DIR, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Add server-side data
    const event = {
      ...data,
      id: Date.now() + Math.random(),
      server_timestamp: new Date().toISOString(),
      ip_address: request.ip || 
                 request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    }

    // Append to JSONL file
    const jsonlLine = JSON.stringify(event) + '\n'
    
    if (existsSync(EVENTS_FILE)) {
      require('fs').appendFileSync(EVENTS_FILE, jsonlLine)
    } else {
      writeFileSync(EVENTS_FILE, jsonlLine)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics event error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!existsSync(EVENTS_FILE)) {
      return NextResponse.json([])
    }

    const content = readFileSync(EVENTS_FILE, 'utf-8')
    const events = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .slice(-100) // Return last 100 events

    return NextResponse.json(events)
  } catch (error) {
    console.error('Analytics events fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}