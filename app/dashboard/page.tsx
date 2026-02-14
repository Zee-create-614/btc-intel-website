'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Settings, CreditCard, Key, LogOut, Crown, Zap, Eye, TrendingUp } from 'lucide-react'

interface UserData {
  id: string
  email: string
  subscription_tier: string
  created_at: string
  last_login?: string
  is_verified: boolean
  api_key?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login')
      return
    }

    // Verify token and get user data
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setUser(data.user)
      } else {
        localStorage.removeItem('auth_token')
        router.push('/login')
      }
      setLoading(false)
    })
    .catch(() => {
      localStorage.removeItem('auth_token')
      router.push('/login')
      setLoading(false)
    })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className=\"min-h-screen bg-slate-950 flex items-center justify-center\">
        <div className=\"text-white text-lg\">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tierInfo = {
    free: { name: 'Free', color: 'text-slate-400', icon: Eye, description: 'Basic access' },
    basic: { name: 'Basic', color: 'text-blue-400', icon: TrendingUp, description: 'Full data access' },
    pro: { name: 'Pro', color: 'text-purple-400', icon: Zap, description: 'API + Alerts' },
    enterprise: { name: 'Enterprise', color: 'text-yellow-400', icon: Crown, description: 'White-label + Priority' }
  }

  const currentTier = tierInfo[user.subscription_tier as keyof typeof tierInfo] || tierInfo.free

  return (
    <div className=\"min-h-screen bg-slate-950 px-4 py-8\">
      <div className=\"max-w-6xl mx-auto\">
        {/* Header */}
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold text-white mb-2\">Dashboard</h1>
          <p className=\"text-slate-400\">Welcome back to BTCIntelVault</p>
        </div>

        {/* User Info Card */}
        <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6 mb-8\">
          <div className=\"flex items-center justify-between\">
            <div className=\"flex items-center space-x-4\">
              <div className=\"w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center\">
                <User className=\"h-6 w-6 text-slate-300\" />
              </div>
              <div>
                <h2 className=\"text-xl font-bold text-white\">{user.email}</h2>
                <div className=\"flex items-center space-x-2\">
                  <currentTier.icon className={`h-4 w-4 ${currentTier.color}`} />
                  <span className={`font-medium ${currentTier.color}`}>
                    {currentTier.name} Plan
                  </span>
                  <span className=\"text-slate-500\">•</span>
                  <span className=\"text-slate-400\">{currentTier.description}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className=\"flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors\"
            >
              <LogOut className=\"h-4 w-4\" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8\">
          <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm text-slate-400 mb-1\">Account Status</p>
                <p className=\"text-lg font-bold text-white\">
                  {user.is_verified ? 'Verified' : 'Pending'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${user.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
          </div>

          <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6\">
            <div>
              <p className=\"text-sm text-slate-400 mb-1\">Member Since</p>
              <p className=\"text-lg font-bold text-white\">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6\">
            <div>
              <p className=\"text-sm text-slate-400 mb-1\">Last Login</p>
              <p className=\"text-lg font-bold text-white\">
                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'First visit'}
              </p>
            </div>
          </div>

          <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6\">
            <div>
              <p className=\"text-sm text-slate-400 mb-1\">API Requests</p>
              <p className=\"text-lg font-bold text-white\">0</p>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
          {/* Market Data */}
          <Link href=\"/\" className=\"group\">
            <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 group-hover:border-blue-500/50 rounded-lg p-6 transition-all\">
              <div className=\"flex items-center space-x-3 mb-4\">
                <div className=\"w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center\">
                  <TrendingUp className=\"h-5 w-5 text-white\" />
                </div>
                <h3 className=\"font-bold text-white\">Market Dashboard</h3>
              </div>
              <p className=\"text-slate-400 text-sm\">Real-time Bitcoin and MSTR data</p>
            </div>
          </Link>

          {/* Corporate Holdings */}
          <Link href=\"/corporate\" className=\"group\">
            <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 group-hover:border-green-500/50 rounded-lg p-6 transition-all\">
              <div className=\"flex items-center space-x-3 mb-4\">
                <div className=\"w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center\">
                  <User className=\"h-5 w-5 text-white\" />
                </div>
                <h3 className=\"font-bold text-white\">Corporate Holdings</h3>
              </div>
              <p className=\"text-slate-400 text-sm\">
                {user.subscription_tier === 'free' ? 'Top 5 companies (upgrade for full data)' : 'Complete corporate Bitcoin holdings'}
              </p>
            </div>
          </Link>

          {/* Politicians */}
          <Link href=\"/politicians\" className=\"group\">
            <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 group-hover:border-purple-500/50 rounded-lg p-6 transition-all\">
              <div className=\"flex items-center space-x-3 mb-4\">
                <div className=\"w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center\">
                  <User className=\"h-5 w-5 text-white\" />
                </div>
                <h3 className=\"font-bold text-white\">Politician Trading</h3>
              </div>
              <p className=\"text-slate-400 text-sm\">
                {user.subscription_tier === 'free' ? 'Top trades (upgrade for full database)' : 'Complete politician trade tracking'}
              </p>
            </div>
          </Link>

          {/* Account Settings */}
          <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6\">
            <div className=\"flex items-center space-x-3 mb-4\">
              <div className=\"w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center\">
                <Settings className=\"h-5 w-5 text-white\" />
              </div>
              <h3 className=\"font-bold text-white\">Account Settings</h3>
            </div>
            <div className=\"space-y-2\">
              <button className=\"w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition-colors\">
                Change Password
              </button>
              <button className=\"w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition-colors\">
                Email Preferences
              </button>
            </div>
          </div>

          {/* API Access */}
          <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6\">
            <div className=\"flex items-center space-x-3 mb-4\">
              <div className=\"w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center\">
                <Key className=\"h-5 w-5 text-white\" />
              </div>
              <h3 className=\"font-bold text-white\">API Access</h3>
            </div>
            {user.subscription_tier !== 'free' ? (
              <div className=\"space-y-2\">
                <p className=\"text-xs text-slate-400\">API Key:</p>
                <code className=\"block bg-slate-800 p-2 rounded text-xs font-mono text-green-400 break-all\">
                  {user.api_key || 'Generating...'}
                </code>
              </div>
            ) : (
              <p className=\"text-sm text-slate-400\">
                Upgrade to Basic plan for API access
              </p>
            )}
          </div>

          {/* Subscription */}
          <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-6\">
            <div className=\"flex items-center space-x-3 mb-4\">
              <div className=\"w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center\">
                <CreditCard className=\"h-5 w-5 text-white\" />
              </div>
              <h3 className=\"font-bold text-white\">Subscription</h3>
            </div>
            {user.subscription_tier === 'free' ? (
              <div className=\"space-y-3\">
                <p className=\"text-sm text-slate-400\">Ready to unlock full access?</p>
                <Link 
                  href=\"/pricing\"
                  className=\"inline-block w-full text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors\"
                >
                  Upgrade Now
                </Link>
              </div>
            ) : (
              <div className=\"space-y-2\">
                <p className=\"text-sm text-green-400\">✓ Active {currentTier.name} subscription</p>
                <button className=\"w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded transition-colors\">
                  Manage Billing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Free Tier Upgrade Banner */}
        {user.subscription_tier === 'free' && (
          <div className=\"mt-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 text-center\">
            <h3 className=\"text-xl font-bold text-white mb-2\">🚀 Unlock Full Bitcoin Intelligence</h3>
            <p className=\"text-slate-300 mb-4\">
              Get complete corporate holdings, full politician database, MSTR analytics, and API access
            </p>
            <div className=\"flex flex-col sm:flex-row gap-3 justify-center\">
              <Link 
                href=\"/pricing\"
                className=\"px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors\"
              >
                View Pricing Plans
              </Link>
              <Link 
                href=\"/corporate\"
                className=\"px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg transition-colors\"
              >
                Preview Features
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}