import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get client IP from various headers
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') || // Cloudflare
             request.headers.get('x-forwarded') ||
             request.headers.get('forwarded-for') ||
             request.headers.get('forwarded') ||
             'unknown'

  return NextResponse.json({ 
    ip,
    headers: Object.fromEntries(request.headers.entries())
  })
}