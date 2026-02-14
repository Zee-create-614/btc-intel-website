// Analytics tracking system for BTCIntelVault
// Tracks users, visits, sources, and engagement

export interface AnalyticsEvent {
  id?: number
  event_type: string
  user_id?: string
  session_id: string
  page_url: string
  referrer?: string
  user_agent: string
  ip_address: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface UserRegistration {
  id?: number
  user_id: string
  email?: string
  registration_source: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  created_at: string
  subscription_tier?: string
}

export interface PageView {
  id?: number
  session_id: string
  page_url: string
  page_title: string
  referrer?: string
  user_agent: string
  ip_address: string
  time_on_page?: number
  timestamp: string
}

export interface TrafficSource {
  source: string
  medium?: string
  campaign?: string
  visits: number
  unique_visitors: number
  last_seen: string
}

// Analytics data collection
export class AnalyticsTracker {
  private sessionId: string
  private startTime: number

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
    this.initializeTracking()
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  private initializeTracking() {
    // Track page views
    this.trackPageView()

    // Track page unload (time on page)
    window.addEventListener('beforeunload', () => {
      this.trackTimeOnPage()
    })

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.matches('a, button, [data-track]')) {
        this.trackEvent('click', {
          element: target.tagName,
          text: target.textContent?.substring(0, 100),
          href: (target as HTMLAnchorElement).href
        })
      }
    })
  }

  async trackPageView() {
    const pageView: Omit<PageView, 'id'> = {
      session_id: this.sessionId,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
      ip_address: await this.getClientIP(),
      timestamp: new Date().toISOString()
    }

    await this.sendAnalytics('/api/analytics/pageview', pageView)
  }

  async trackEvent(eventType: string, metadata?: Record<string, any>) {
    const event: Omit<AnalyticsEvent, 'id'> = {
      event_type: eventType,
      session_id: this.sessionId,
      page_url: window.location.href,
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
      ip_address: await this.getClientIP(),
      timestamp: new Date().toISOString(),
      metadata
    }

    await this.sendAnalytics('/api/analytics/event', event)
  }

  async trackUserRegistration(userId: string, email?: string, subscriptionTier?: string) {
    const urlParams = new URLSearchParams(window.location.search)
    
    const registration: Omit<UserRegistration, 'id'> = {
      user_id: userId,
      email,
      registration_source: window.location.hostname,
      referrer: document.referrer || undefined,
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      created_at: new Date().toISOString(),
      subscription_tier: subscriptionTier
    }

    await this.sendAnalytics('/api/analytics/registration', registration)
  }

  private async trackTimeOnPage() {
    const timeOnPage = Date.now() - this.startTime
    await this.trackEvent('time_on_page', { 
      duration_ms: timeOnPage,
      duration_seconds: Math.round(timeOnPage / 1000)
    })
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/client-ip')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private async sendAnalytics(endpoint: string, data: any) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }
}

// Initialize analytics tracking
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined') {
    return new AnalyticsTracker()
  }
  return null
}

// Google Analytics integration
export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args)
  }
}

export const trackGoogleAnalytics = (eventName: string, parameters?: Record<string, any>) => {
  gtag('event', eventName, parameters)
}

// Export for admin dashboard
export type { AnalyticsEvent, UserRegistration, PageView, TrafficSource }