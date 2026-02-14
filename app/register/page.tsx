'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, CreditCard } from 'lucide-react'
import { trackUserRegistration } from '../components/Analytics'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tier, setTier] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('free')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          subscription_tier: tier
        })
      })

      const data = await response.json()

      if (data.success) {
        // Track registration in analytics
        await trackUserRegistration(
          data.user.id,
          email,
          tier,
          'btc_intel_vault_registration'
        )

        // Store token and redirect
        localStorage.setItem('auth_token', data.token)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className=\"min-h-screen bg-slate-950 flex items-center justify-center px-4\">
      <div className=\"max-w-md w-full space-y-8\">
        {/* Header */}
        <div className=\"text-center\">
          <h2 className=\"text-3xl font-bold text-white mb-2\">Create Account</h2>
          <p className=\"text-slate-400\">Join BTCIntelVault for exclusive Bitcoin intelligence</p>
        </div>

        {/* Registration Form */}
        <div className=\"bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg p-8\">
          <form onSubmit={handleSubmit} className=\"space-y-6\">
            {/* Email */}
            <div>
              <label className=\"block text-sm font-medium text-slate-300 mb-2\">
                Email Address
              </label>
              <div className=\"relative\">
                <Mail className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400\" />
                <input
                  type=\"email\"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className=\"w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors\"
                  placeholder=\"your@email.com\"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className=\"block text-sm font-medium text-slate-300 mb-2\">
                Password
              </label>
              <div className=\"relative\">
                <Lock className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400\" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className=\"w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors\"
                  placeholder=\"At least 8 characters\"
                />
                <button
                  type=\"button\"
                  onClick={() => setShowPassword(!showPassword)}
                  className=\"absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300\"
                >
                  {showPassword ? <EyeOff className=\"h-5 w-5\" /> : <Eye className=\"h-5 w-5\" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className=\"block text-sm font-medium text-slate-300 mb-2\">
                Confirm Password
              </label>
              <div className=\"relative\">
                <Lock className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400\" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className=\"w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors\"
                  placeholder=\"Repeat your password\"
                />
              </div>
            </div>

            {/* Subscription Tier */}
            <div>
              <label className=\"block text-sm font-medium text-slate-300 mb-3\">
                Choose Your Plan
              </label>
              <div className=\"space-y-3\">
                {[
                  { id: 'free', name: 'Free', price: '$0', description: 'Basic market data' },
                  { id: 'basic', name: 'Basic', price: '$19.99', description: 'Full data access' },
                  { id: 'pro', name: 'Pro', price: '$49.99', description: 'API + Alerts' },
                  { id: 'enterprise', name: 'Enterprise', price: '$199', description: 'White-label + Priority' }
                ].map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all \${
                      tier === plan.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600/30 hover:border-slate-500/50'
                    }\`}
                  >
                    <input
                      type=\"radio\"
                      name=\"tier\"
                      value={plan.id}
                      checked={tier === plan.id}
                      onChange={(e) => setTier(e.target.value as any)}
                      className=\"sr-only\"
                    />
                    <div className=\"flex-1\">
                      <div className=\"flex items-center justify-between\">
                        <span className=\"font-medium text-white\">{plan.name}</span>
                        <span className=\"font-bold text-white\">{plan.price}/month</span>
                      </div>
                      <p className=\"text-sm text-slate-400\">{plan.description}</p>
                    </div>
                    {plan.id !== 'free' && (
                      <CreditCard className=\"h-5 w-5 text-slate-400 ml-3\" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className=\"bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-red-400 text-sm\">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type=\"submit\"
              disabled={loading || !email || !password || !confirmPassword}
              className=\"w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors\"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className=\"mt-6 text-center\">
            <p className=\"text-slate-400\">
              Already have an account?{' '}
              <Link href=\"/login\" className=\"text-blue-400 hover:text-blue-300 font-medium\">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className=\"text-center text-sm text-slate-500\">
          <p>🔒 Your data is encrypted and secure</p>
          <p>📊 Real-time Bitcoin treasury intelligence</p>
          <p>⚡ Cancel anytime with one click</p>
        </div>
      </div>
    </div>
  )
}