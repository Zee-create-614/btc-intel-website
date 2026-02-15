import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/login', '/register'],
    },
    sitemap: 'https://bitcoinintelvault.com/sitemap.xml',
  }
}
