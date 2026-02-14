'use client'

import { useState } from 'react'
import { trackUserRegistration, trackCustomEvent } from './Analytics'

// Example component showing how to track user registrations
export default function RegistrationExample() {
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState('free')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate a unique user ID (in real app, this would come from your auth system)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Simulate user registration API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Track the registration in analytics
      await trackUserRegistration(
        userId,
        email,
        tier,
        'btc_intel_vault_signup'
      )

      // Track additional custom event
      await trackCustomEvent('subscription_selected', {
        tier,
        source: 'main_signup_form',
        email_domain: email.split('@')[1]
      })

      setSuccess(true)
      setEmail('')
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className=\"max-w-md mx-auto bg-green-900/20 border border-green-700/30 rounded-lg p-6 text-center\">
        <h3 className=\"text-xl font-bold text-green-400 mb-2\">Registration Successful!</h3>
        <p className=\"text-gray-300\">Your registration has been tracked in analytics.</p>
        <button 
          onClick={() => setSuccess(false)}
          className=\"mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-colors\"
        >
          Register Another User
        </button>
      </div>
    )
  }

  return (
    <div className=\"max-w-md mx-auto bg-gray-900 border border-gray-700 rounded-lg p-6\">
      <h3 className=\"text-xl font-bold text-white mb-4\">📊 Example: User Registration Tracking</h3>
      <form onSubmit={handleSubmit} className=\"space-y-4\">
        <div>
          <label className=\"block text-sm font-medium text-gray-300 mb-2\">
            Email Address
          </label>
          <input
            type=\"email\"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className=\"w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white\"
            placeholder=\"user@example.com\"
          />
        </div>

        <div>
          <label className=\"block text-sm font-medium text-gray-300 mb-2\">
            Subscription Tier
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className=\"w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white\"
          >
            <option value=\"free\">Free ($0/month)</option>
            <option value=\"basic\">Basic ($19.99/month)</option>
            <option value=\"pro\">Pro ($49.99/month)</option>
            <option value=\"enterprise\">Enterprise ($199/month)</option>
          </select>
        </div>

        <button
          type=\"submit\"
          disabled={loading || !email}
          className=\"w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors\"
        >
          {loading ? 'Registering...' : 'Sign Up (Test)'}
        </button>
      </form>

      <div className=\"mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded text-sm\">
        <p className=\"text-blue-300 font-medium mb-2\">📈 Analytics Tracking:</p>
        <ul className=\"text-gray-400 space-y-1 text-xs\">
          <li>• User registration event</li>
          <li>• Email domain analysis</li>
          <li>• Subscription tier selection</li>
          <li>• Traffic source attribution</li>
          <li>• UTM campaign tracking</li>
        </ul>
      </div>
    </div>
  )
}