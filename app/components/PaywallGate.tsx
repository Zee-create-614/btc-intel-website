'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, Crown, Zap, Eye, ArrowUpRight } from 'lucide-react'

interface PaywallGateProps {
  children: React.ReactNode
  requiredTier: 'free' | 'basic' | 'pro' | 'enterprise'
  fallback?: React.ReactNode
  previewLines?: number
  title?: string
  description?: string
}

export default function PaywallGate({ 
  children, 
  requiredTier, 
  fallback,
  previewLines = 3,
  title,
  description
}: PaywallGateProps) {
  const [userTier, setUserTier] = useState<string>('guest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setUserTier('guest')
      setLoading(false)
      return
    }

    // Verify token and get user tier
    fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setUserTier(data.user.subscription_tier)
      } else {
        setUserTier('guest')
        localStorage.removeItem('auth_token')
      }
      setLoading(false)
    })
    .catch(() => {
      setUserTier('guest')
      setLoading(false)
    })
  }, [])

  const hasAccess = () => {
    const tierHierarchy = ['guest', 'free', 'basic', 'pro', 'enterprise']
    const userLevel = tierHierarchy.indexOf(userTier)
    const requiredLevel = tierHierarchy.indexOf(requiredTier)
    return userLevel >= requiredLevel
  }

  const tierInfo = {
    basic: { name: 'Basic', price: '$19.99', color: 'text-blue-400', icon: Eye },
    pro: { name: 'Pro', price: '$49.99', color: 'text-purple-400', icon: Zap },
    enterprise: { name: 'Enterprise', price: '$199', color: 'text-yellow-400', icon: Crown }
  }

  if (loading) {
    return (
      <div className=\"animate-pulse bg-slate-900/30 border border-slate-700/30 rounded-lg p-6\">
        <div className=\"h-4 bg-slate-700/50 rounded mb-2\"></div>
        <div className=\"h-4 bg-slate-700/50 rounded w-3/4\"></div>
      </div>
    )
  }

  if (hasAccess()) {
    return <>{children}</>
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Default paywall UI
  const tier = tierInfo[requiredTier as keyof typeof tierInfo] || tierInfo.basic
  const TierIcon = tier.icon

  return (
    <div className=\"relative\">
      {/* Preview Content (blurred) */}
      <div className=\"relative overflow-hidden\">
        <div 
          className=\"filter blur-sm\" 
          style={{ 
            maxHeight: `${previewLines * 1.5}rem`,
            maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)'
          }}
        >
          {children}
        </div>
        
        {/* Gradient Overlay */}
        <div className=\"absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/90\" />
      </div>

      {/* Paywall Overlay */}
      <div className=\"absolute inset-0 flex items-center justify-center\">
        <div className=\"bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 text-center max-w-md mx-4\">
          <div className=\"flex items-center justify-center mb-4\">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 flex items-center justify-center`}>
              <Lock className=\"h-6 w-6 text-white\" />
            </div>
          </div>

          <h3 className=\"text-xl font-bold text-white mb-2\">
            {title || 'Premium Content'}
          </h3>
          
          <p className=\"text-slate-400 mb-4\">
            {description || `This content requires a ${tier.name} subscription or higher.`}
          </p>

          <div className=\"flex items-center justify-center space-x-2 mb-4\">
            <TierIcon className={`h-5 w-5 ${tier.color}`} />
            <span className={`font-semibold ${tier.color}`}>{tier.name} Plan</span>
            <span className=\"text-slate-400\">•</span>
            <span className=\"text-white font-bold\">{tier.price}/month</span>
          </div>

          <div className=\"space-y-3\">
            {userTier === 'guest' ? (
              <>
                <Link 
                  href=\"/register\"
                  className=\"block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors\"
                >
                  Sign Up Free
                </Link>
                <Link 
                  href=\"/login\"
                  className=\"block w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg transition-colors\"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href=\"/pricing\"
                  className=\"flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors\"
                >
                  <span>Upgrade Now</span>
                  <ArrowUpRight className=\"h-4 w-4\" />
                </Link>
                <Link 
                  href=\"/dashboard\"
                  className=\"block w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-lg transition-colors\"
                >
                  View Dashboard
                </Link>
              </>
            )}
          </div>

          <p className=\"text-xs text-slate-500 mt-4\">
            ✓ Cancel anytime • ✓ 7-day money back guarantee
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper component for quick paywalls
export function BasicPaywall({ children }: { children: React.ReactNode }) {
  return (
    <PaywallGate 
      requiredTier=\"basic\" 
      title=\"Full Data Access\"
      description=\"Unlock complete Bitcoin treasury intelligence and corporate holdings data.\"
    >
      {children}
    </PaywallGate>
  )
}

export function ProPaywall({ children }: { children: React.ReactNode }) {
  return (
    <PaywallGate 
      requiredTier=\"pro\" 
      title=\"Pro Features\"
      description=\"Access API endpoints, real-time alerts, and advanced analytics.\"
    >
      {children}
    </PaywallGate>
  )
}

// Data masking component
export function DataMask({ 
  children, 
  requiredTier = 'basic',
  maskSymbol = '•••',
  showFirst = 0 
}: { 
  children: React.ReactNode
  requiredTier?: 'basic' | 'pro' | 'enterprise'
  maskSymbol?: string
  showFirst?: number
}) {
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const tierHierarchy = ['guest', 'free', 'basic', 'pro', 'enterprise']
        const userLevel = tierHierarchy.indexOf(data.user.subscription_tier)
        const requiredLevel = tierHierarchy.indexOf(requiredTier)
        setHasAccess(userLevel >= requiredLevel)
      }
    })
    .catch(() => setHasAccess(false))
  }, [requiredTier])

  if (hasAccess) {
    return <>{children}</>
  }

  return <span className=\"text-slate-500 font-mono\">{maskSymbol}</span>
}