'use client'

import { useState, useEffect } from 'react'
import { Users, Eye, MousePointer, TrendingUp, Globe, Clock } from 'lucide-react'

interface PageView {
  id: number
  session_id: string
  page_url: string
  page_title: string
  referrer?: string
  user_agent: string
  ip_address: string
  timestamp: string
}

interface AnalyticsEvent {
  id: number
  event_type: string
  session_id: string
  page_url: string
  referrer?: string
  user_agent: string
  ip_address: string
  timestamp: string
  metadata?: any
}

interface AnalyticsSummary {
  totalPageviews: number
  uniqueVisitors: number
  totalEvents: number
  topPages: { page: string; views: number }[]
  topReferrers: { referrer: string; visits: number }[]
  eventTypes: { event: string; count: number }[]
  recentActivity: (PageView | AnalyticsEvent)[]
}

export default function AnalyticsAdminPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [pageviews, setPageviews] = useState<PageView[]>([])
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'pageviews' | 'events'>('overview')

  useEffect(() => {
    loadAnalyticsData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAnalyticsData = async () => {
    try {
      const [pageviewsRes, eventsRes] = await Promise.all([
        fetch('/api/analytics/pageview'),
        fetch('/api/analytics/event')
      ])

      const pageviewsData = await pageviewsRes.json()
      const eventsData = await eventsRes.json()

      setPageviews(pageviewsData)
      setEvents(eventsData)

      // Calculate summary
      const uniqueVisitors = new Set(pageviewsData.map((pv: PageView) => pv.ip_address)).size
      
      const pageCounts: Record<string, number> = {}
      pageviewsData.forEach((pv: PageView) => {
        const page = new URL(pv.page_url).pathname
        pageCounts[page] = (pageCounts[page] || 0) + 1
      })

      const referrerCounts: Record<string, number> = {}
      pageviewsData.forEach((pv: PageView) => {
        if (pv.referrer && !pv.referrer.includes('bitcoinintelvault.com')) {
          const domain = new URL(pv.referrer).hostname
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1
        }
      })

      const eventTypeCounts: Record<string, number> = {}
      eventsData.forEach((event: AnalyticsEvent) => {
        eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1
      })

      const recentActivity = [...pageviewsData, ...eventsData]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)

      setSummary({
        totalPageviews: pageviewsData.length,
        uniqueVisitors,
        totalEvents: eventsData.length,
        topPages: Object.entries(pageCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([page, views]) => ({ page, views })),
        topReferrers: Object.entries(referrerCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([referrer, visits]) => ({ referrer, visits })),
        eventTypes: Object.entries(eventTypeCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([event, count]) => ({ event, count })),
        recentActivity
      })

      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className=\"min-h-screen bg-black text-white p-6\">
        <div className=\"max-w-7xl mx-auto\">
          <h1 className=\"text-3xl font-bold mb-8\">📊 Analytics Dashboard</h1>
          <div className=\"text-gray-400\">Loading analytics data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className=\"min-h-screen bg-black text-white p-6\">
      <div className=\"max-w-7xl mx-auto\">
        {/* Header */}
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold mb-2\">📊 BTCIntelVault Analytics</h1>
          <p className=\"text-gray-400\">Real-time website analytics and user behavior tracking</p>
        </div>

        {/* Navigation */}
        <div className=\"flex space-x-4 mb-8\">
          {(['overview', 'pageviews', 'events'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && summary && (
          <div className=\"space-y-8\">
            {/* Key Metrics */}
            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-400 mb-1\">Total Pageviews</p>
                    <p className=\"text-3xl font-bold\">{summary.totalPageviews.toLocaleString()}</p>
                  </div>
                  <Eye className=\"h-12 w-12 text-blue-500\" />
                </div>
              </div>

              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-400 mb-1\">Unique Visitors</p>
                    <p className=\"text-3xl font-bold\">{summary.uniqueVisitors.toLocaleString()}</p>
                  </div>
                  <Users className=\"h-12 w-12 text-green-500\" />
                </div>
              </div>

              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-400 mb-1\">Total Events</p>
                    <p className=\"text-3xl font-bold\">{summary.totalEvents.toLocaleString()}</p>
                  </div>
                  <MousePointer className=\"h-12 w-12 text-purple-500\" />
                </div>
              </div>

              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <div className=\"flex items-center justify-between\">
                  <div>
                    <p className=\"text-sm text-gray-400 mb-1\">Avg Pages/Visit</p>
                    <p className=\"text-3xl font-bold\">
                      {summary.uniqueVisitors > 0 ? (summary.totalPageviews / summary.uniqueVisitors).toFixed(1) : '0'}
                    </p>
                  </div>
                  <TrendingUp className=\"h-12 w-12 text-yellow-500\" />
                </div>
              </div>
            </div>

            {/* Charts and Tables */}
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-8\">
              {/* Top Pages */}
              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <h3 className=\"text-xl font-bold mb-4 flex items-center\">
                  <Globe className=\"h-5 w-5 mr-2 text-blue-500\" />
                  Top Pages
                </h3>
                <div className=\"space-y-3\">
                  {summary.topPages.map((page, index) => (
                    <div key={page.page} className=\"flex justify-between items-center\">
                      <span className=\"text-gray-300 truncate\">{page.page}</span>
                      <span className=\"text-white font-mono\">{page.views}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Referrers */}
              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <h3 className=\"text-xl font-bold mb-4 flex items-center\">
                  <TrendingUp className=\"h-5 w-5 mr-2 text-green-500\" />
                  Top Referrers
                </h3>
                <div className=\"space-y-3\">
                  {summary.topReferrers.length > 0 ? (
                    summary.topReferrers.map((referrer, index) => (
                      <div key={referrer.referrer} className=\"flex justify-between items-center\">
                        <span className=\"text-gray-300 truncate\">{referrer.referrer}</span>
                        <span className=\"text-white font-mono\">{referrer.visits}</span>
                      </div>
                    ))
                  ) : (
                    <p className=\"text-gray-500\">No external referrers yet</p>
                  )}
                </div>
              </div>

              {/* Event Types */}
              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <h3 className=\"text-xl font-bold mb-4 flex items-center\">
                  <MousePointer className=\"h-5 w-5 mr-2 text-purple-500\" />
                  Event Types
                </h3>
                <div className=\"space-y-3\">
                  {summary.eventTypes.map((eventType, index) => (
                    <div key={eventType.event} className=\"flex justify-between items-center\">
                      <span className=\"text-gray-300\">{eventType.event}</span>
                      <span className=\"text-white font-mono\">{eventType.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
                <h3 className=\"text-xl font-bold mb-4 flex items-center\">
                  <Clock className=\"h-5 w-5 mr-2 text-yellow-500\" />
                  Recent Activity
                </h3>
                <div className=\"space-y-3 max-h-64 overflow-y-auto\">
                  {summary.recentActivity.map((activity, index) => {
                    const isEvent = 'event_type' in activity
                    return (
                      <div key={index} className=\"text-sm\">
                        <div className=\"flex justify-between items-start\">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              isEvent ? 'bg-purple-600' : 'bg-blue-600'
                            }`}>
                              {isEvent ? activity.event_type : 'pageview'}
                            </span>
                            <p className=\"text-gray-300 mt-1 truncate\">
                              {isEvent ? activity.page_url : activity.page_url}
                            </p>
                          </div>
                          <span className=\"text-gray-500 text-xs\">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pageviews' && (
          <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
            <h3 className=\"text-xl font-bold mb-4\">Recent Pageviews</h3>
            <div className=\"overflow-x-auto\">
              <table className=\"w-full text-sm\">
                <thead>
                  <tr className=\"border-b border-gray-700\">
                    <th className=\"text-left p-3\">Timestamp</th>
                    <th className=\"text-left p-3\">Page</th>
                    <th className=\"text-left p-3\">Referrer</th>
                    <th className=\"text-left p-3\">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {pageviews.slice(0, 50).map((pv, index) => (
                    <tr key={index} className=\"border-b border-gray-800\">
                      <td className=\"p-3 text-gray-300\">
                        {new Date(pv.timestamp).toLocaleString()}
                      </td>
                      <td className=\"p-3\">{new URL(pv.page_url).pathname}</td>
                      <td className=\"p-3 text-gray-400 truncate max-w-48\">
                        {pv.referrer ? new URL(pv.referrer).hostname : 'Direct'}
                      </td>
                      <td className=\"p-3 font-mono text-gray-500\">{pv.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className=\"bg-gray-900 border border-gray-700 rounded-lg p-6\">
            <h3 className=\"text-xl font-bold mb-4\">Recent Events</h3>
            <div className=\"overflow-x-auto\">
              <table className=\"w-full text-sm\">
                <thead>
                  <tr className=\"border-b border-gray-700\">
                    <th className=\"text-left p-3\">Timestamp</th>
                    <th className=\"text-left p-3\">Event Type</th>
                    <th className=\"text-left p-3\">Page</th>
                    <th className=\"text-left p-3\">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 50).map((event, index) => (
                    <tr key={index} className=\"border-b border-gray-800\">
                      <td className=\"p-3 text-gray-300\">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className=\"p-3\">
                        <span className=\"bg-purple-600 px-2 py-1 rounded text-xs\">
                          {event.event_type}
                        </span>
                      </td>
                      <td className=\"p-3\">{new URL(event.page_url).pathname}</td>
                      <td className=\"p-3 text-gray-400 truncate max-w-48\">
                        {event.metadata ? JSON.stringify(event.metadata).substring(0, 50) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className=\"mt-8 text-center text-gray-500 text-sm\">
          <p>Analytics data updates every 30 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  )
}