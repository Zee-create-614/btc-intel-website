'use client'

import { useEffect } from 'react'
import { initializeAnalytics, trackGoogleAnalytics } from '../lib/analytics'

interface AnalyticsProps {
  // Optional Google Analytics ID
  gaId?: string
  // Track additional events
  trackClicks?: boolean
  trackScroll?: boolean
  trackFormSubmits?: boolean
}

export default function Analytics({ 
  gaId = 'G-XXXXXXXXXX', // Replace with actual GA ID
  trackClicks = true,
  trackScroll = true,
  trackFormSubmits = true 
}: AnalyticsProps) {
  
  useEffect(() => {
    // Initialize custom analytics tracking
    const tracker = initializeAnalytics()

    // Initialize Google Analytics if ID provided
    if (gaId && gaId !== 'G-XXXXXXXXXX') {
      // Load Google Analytics script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      document.head.appendChild(script)

      // Initialize Google Analytics
      const configScript = document.createElement('script')
      configScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `
      document.head.appendChild(configScript)
    }

    // Track scroll depth
    if (trackScroll) {
      let maxScroll = 0
      const handleScroll = () => {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        )
        
        if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
          maxScroll = scrollPercent
          tracker?.trackEvent('scroll', { depth: scrollPercent })
          trackGoogleAnalytics('scroll_depth', { depth: scrollPercent })
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }

    // Track form submissions
    if (trackFormSubmits) {
      const handleSubmit = (event: Event) => {
        const form = event.target as HTMLFormElement
        const formId = form.id || form.className || 'unknown'
        
        tracker?.trackEvent('form_submit', { 
          form_id: formId,
          form_action: form.action || window.location.href
        })
        
        trackGoogleAnalytics('form_submit', { form_id: formId })
      }

      document.addEventListener('submit', handleSubmit)
      return () => document.removeEventListener('submit', handleSubmit)
    }

    // Track time on site
    const startTime = Date.now()
    const trackTimeOnSite = () => {
      const timeSpent = Date.now() - startTime
      if (timeSpent > 30000) { // Only track if user spent more than 30 seconds
        tracker?.trackEvent('time_on_site', { 
          duration_ms: timeSpent,
          duration_seconds: Math.round(timeSpent / 1000)
        })
      }
    }

    window.addEventListener('beforeunload', trackTimeOnSite)
    return () => window.removeEventListener('beforeunload', trackTimeOnSite)

  }, [gaId, trackClicks, trackScroll, trackFormSubmits])

  // This component renders nothing visible
  return null
}

// Helper function to track custom events from anywhere in the app
export const trackCustomEvent = async (eventType: string, metadata?: Record<string, any>) => {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        session_id: sessionStorage.getItem('analytics_session') || 'unknown',
        page_url: window.location.href,
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        metadata
      })
    })

    // Also track in Google Analytics if available
    trackGoogleAnalytics(eventType, metadata)
  } catch (error) {
    console.error('Failed to track custom event:', error)
  }
}

// Helper function to track user registration
export const trackUserRegistration = async (
  userId: string, 
  email?: string, 
  subscriptionTier?: string,
  source?: string
) => {
  try {
    await fetch('/api/analytics/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        email,
        registration_source: source || window.location.hostname,
        referrer: document.referrer || undefined,
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
        created_at: new Date().toISOString(),
        subscription_tier: subscriptionTier
      })
    })

    // Track in Google Analytics
    trackGoogleAnalytics('user_registration', {
      user_id: userId,
      subscription_tier: subscriptionTier
    })
  } catch (error) {
    console.error('Failed to track user registration:', error)
  }
}