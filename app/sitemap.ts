import { MetadataRoute } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'

const BASE = 'https://bitcoinintelvault.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const dataDir = join(process.cwd(), 'data')
  
  let politicians: any[] = []
  let tickers: any[] = []
  try { politicians = JSON.parse(readFileSync(join(dataDir, 'politician-summaries.json'), 'utf-8')) } catch {}
  try { tickers = JSON.parse(readFileSync(join(dataDir, 'tickers.json'), 'utf-8')) } catch {}

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/politicians`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/politicians/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/mstr`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/corporate`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
  ]

  const politicianPages: MetadataRoute.Sitemap = politicians.map(p => ({
    url: `${BASE}/politicians/${encodeURIComponent(p.name)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Top 200 tickers by trade count
  const tickerPages: MetadataRoute.Sitemap = tickers.slice(0, 200).map(t => ({
    url: `${BASE}/tickers/${encodeURIComponent(t.ticker)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...politicianPages, ...tickerPages]
}
