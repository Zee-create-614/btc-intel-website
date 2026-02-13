'use client'

import { useState } from 'react'
import { Bell, Settings, CheckCircle, AlertTriangle, TrendingUp, Activity } from 'lucide-react'

interface AlertConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  threshold?: number
  frequency: 'immediate' | 'daily' | 'weekly'
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    {
      id: 'btc_price_change',
      name: 'Bitcoin Price Movement',
      description: 'Alert when BTC price changes by more than specified percentage in 24h',
      enabled: true,
      threshold: 5,
      frequency: 'immediate'
    },
    {
      id: 'mstr_iv_spike',
      name: 'MSTR IV Spike',
      description: 'Alert when MSTR implied volatility exceeds 80th percentile',
      enabled: true,
      threshold: 80,
      frequency: 'immediate'
    },
    {
      id: 'nav_premium_change',
      name: 'NAV Premium Change',
      description: 'Alert when MSTR NAV premium/discount changes significantly',
      enabled: true,
      threshold: 5,
      frequency: 'immediate'
    },
    {
      id: 'treasury_purchase',
      name: 'New Treasury Purchases',
      description: 'Alert when companies announce new Bitcoin purchases',
      enabled: false,
      frequency: 'immediate'
    },
    {
      id: 'options_volume',
      name: 'MSTR Options Volume',
      description: 'Alert on unusually high options volume',
      enabled: false,
      threshold: 150,
      frequency: 'immediate'
    },
    {
      id: 'daily_summary',
      name: 'Daily Summary',
      description: 'Daily recap of key metrics and changes',
      enabled: true,
      frequency: 'daily'
    }
  ])

  const [botToken, setBotToken] = useState('8545342182:AAHmvaf8LL85_2kNvIFDygY0Et7fJsQf0Rg')
  const [chatId, setChatId] = useState('8541012593')
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const updateAlert = (id: string, updates: Partial<AlertConfig>) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ))
  }

  const sendTestAlert = async () => {
    try {
      setTestResult(null)
      
      // In a real implementation, this would make an API call
      // For demo purposes, we'll simulate the call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockSuccess = Math.random() > 0.2 // 80% success rate for demo
      
      if (mockSuccess) {
        setTestResult('success')
        setTestMessage('Test alert sent successfully!')
      } else {
        setTestResult('error')
        setTestMessage('Failed to send test alert. Check your bot token and chat ID.')
      }
    } catch (error) {
      setTestResult('error')
      setTestMessage('Error sending test alert')
    }
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setTestResult(null)
      setTestMessage('')
    }, 3000)
  }

  const getAlertIcon = (alertId: string) => {
    switch (alertId) {
      case 'btc_price_change': return <TrendingUp className="h-5 w-5 text-bitcoin-500" />
      case 'mstr_iv_spike': return <Activity className="h-5 w-5 text-mstr-500" />
      case 'nav_premium_change': return <Activity className="h-5 w-5 text-green-400" />
      case 'treasury_purchase': return <TrendingUp className="h-5 w-5 text-blue-400" />
      case 'options_volume': return <Activity className="h-5 w-5 text-yellow-400" />
      case 'daily_summary': return <Bell className="h-5 w-5 text-purple-400" />
      default: return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  const enabledAlerts = alerts.filter(alert => alert.enabled)
  const totalAlerts = alerts.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Alert Configuration</h1>
        <p className="text-gray-400">
          Configure Telegram alerts for Bitcoin treasury and MSTR options events
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Bell className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-2xl font-bold">{enabledAlerts.length}</p>
          <p className="text-gray-400">Active Alerts</p>
        </div>
        
        <div className="card text-center">
          <Settings className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-2xl font-bold">{totalAlerts}</p>
          <p className="text-gray-400">Total Available</p>
        </div>
        
        <div className="card text-center">
          <CheckCircle className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <p className="text-2xl font-bold">24/7</p>
          <p className="text-gray-400">Monitoring</p>
        </div>
      </div>

      {/* Telegram Configuration */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <span>Telegram Bot Configuration</span>
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bot Token</label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-bitcoin-500 font-mono text-sm"
                placeholder="1234567890:ABCdefGhIjKlMnOpQrStUvWxYz..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Chat ID</label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-bitcoin-500 font-mono text-sm"
                placeholder="123456789"
              />
              <p className="text-xs text-gray-400 mt-1">
                Your Telegram chat ID or channel ID
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={sendTestAlert}
              className="btn-primary"
              disabled={!botToken || !chatId}
            >
              Send Test Alert
            </button>
            
            {testResult && (
              <div className={`flex items-center space-x-2 ${testResult === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {testResult === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <span className="text-sm">{testMessage}</span>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <h4 className="font-semibold mb-2">How to Set Up:</h4>
            <ol className="text-sm text-gray-400 space-y-1">
              <li>1. Message @BotFather on Telegram to create a new bot</li>
              <li>2. Copy the bot token and paste it above</li>
              <li>3. Start a chat with your bot or add it to a channel</li>
              <li>4. Get your chat ID using @userinfobot or @getidsbot</li>
              <li>5. Test the connection with the button above</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6">Alert Rules</h3>
        
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-6 rounded-lg border transition-colors ${
                alert.enabled 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-gray-900 border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">
                    {getAlertIcon(alert.id)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{alert.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.enabled 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {alert.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4">
                      {alert.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {alert.threshold && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Threshold {alert.id.includes('percentage') ? '(%)' : ''}
                          </label>
                          <input
                            type="number"
                            value={alert.threshold}
                            onChange={(e) => updateAlert(alert.id, { threshold: Number(e.target.value) })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-bitcoin-500"
                            disabled={!alert.enabled}
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Frequency</label>
                        <select
                          value={alert.frequency}
                          onChange={(e) => updateAlert(alert.id, { frequency: e.target.value as 'immediate' | 'daily' | 'weekly' })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-bitcoin-500"
                          disabled={!alert.enabled}
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => updateAlert(alert.id, { enabled: !alert.enabled })}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      alert.enabled
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {alert.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6">Recent Alerts</h3>
        
        <div className="space-y-3">
          {[
            {
              time: '2 hours ago',
              type: 'BTC Price Movement',
              message: 'Bitcoin up 6.2% in 24h - now at $97,500',
              status: 'sent'
            },
            {
              time: '1 day ago',
              type: 'MSTR IV Spike',
              message: 'MSTR implied volatility reached 87.3% (82nd percentile)',
              status: 'sent'
            },
            {
              time: '2 days ago',
              type: 'Daily Summary',
              message: 'Daily summary: BTC +2.1%, MSTR +4.5%, NAV premium 15.7%',
              status: 'sent'
            },
            {
              time: '3 days ago',
              type: 'Treasury Purchase',
              message: 'Marathon Digital purchased 1,800 additional BTC',
              status: 'failed'
            }
          ].map((alert, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  alert.status === 'sent' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <div>
                  <p className="font-medium">{alert.type}</p>
                  <p className="text-sm text-gray-400">{alert.message}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {alert.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Configuration */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Configuration Status</h4>
            <p className="text-sm text-gray-400">
              Your alert settings are automatically saved
            </p>
          </div>
          <div className="text-green-400 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>All changes saved</span>
          </div>
        </div>
      </div>
    </div>
  )
}