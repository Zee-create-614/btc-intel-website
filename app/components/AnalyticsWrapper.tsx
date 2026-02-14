"use client"

import { Analytics } from '@vercel/analytics/react'

export default function AnalyticsWrapper() {
  return (
    <Analytics beforeSend={(event) => {
      if (localStorage.getItem('disable_analytics') === 'true') return null
      return event
    }} />
  )
}
