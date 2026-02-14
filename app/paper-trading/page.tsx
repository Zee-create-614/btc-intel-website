'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Target, Trash2, X, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAccount, getStats, getOpenTrades, getClosedTrades, closeTrade, deleteTrade, resetAccount, PaperTrade } from '../lib/paper-trading'

export default function PaperTradingDashboard() {
  const [stats, setStats] = useState(getStats())
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([])
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([])
  const [mstrPrice, setMstrPrice] = useState(0)
  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const [showReset, setShowReset] = useState(false)

  const refresh = () => {
    setStats(getStats())
    setOpenTrades(getOpenTrades())
    setClosedTrades(getClosedTrades())
  }

  useEffect(() => {
    refresh()
    // Fetch live price
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/v1/live/mstr', { cache: 'no-store' })
        const data = await res.json()
        setMstrPrice(data.price)
      } catch {
        setMstrPrice(133.88)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleClose = (trade: PaperTrade) => {
    if (!mstrPrice) return
    // Estimate current premium (simplified — in production would use BS)
    const daysLeft = Math.max(0, (new Date(trade.expirationDate).getTime() - Date.now()) / 86400000)
    const timeDecay = Math.sqrt(daysLeft / 30)
    const estimatedPremium = trade.premium * timeDecay * 0.8 // rough estimate
    closeTrade(trade.id, mstrPrice, estimatedPremium)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteTrade(id)
    refresh()
  }

  const handleReset = () => {
    resetAccount()
    refresh()
    setShowReset(false)
  }

  // Calculate unrealized P&L for open trades
  const getUnrealizedPnl = (trade: PaperTrade) => {
    if (!mstrPrice) return 0
    if (trade.strategy === 'covered_call') {
      const stockPnl = (mstrPrice - trade.entryPrice) * trade.shares
      const intrinsic = Math.max(0, mstrPrice - trade.strikePrice) * trade.shares
      return stockPnl - intrinsic + trade.totalPremium
    } else if (trade.strategy === 'cash_secured_put') {
      const intrinsic = Math.max(0, trade.strikePrice - mstrPrice) * trade.shares
      return trade.totalPremium - intrinsic
    } else if (trade.strategy === 'protective_put') {
      const stockPnl = (mstrPrice - trade.entryPrice) * trade.shares
      const intrinsic = Math.max(0, trade.strikePrice - mstrPrice) * trade.shares
      return stockPnl + intrinsic - trade.totalPremium
    }
    return 0
  }

  const totalUnrealized = openTrades.reduce((s, t) => s + getUnrealizedPnl(t), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Paper Trading Dashboard</h1>
          </div>
          <p className="text-slate-400">Track your practice trades and performance</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {mstrPrice > 0 && (
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-slate-400">MSTR:</span>
              <span className="text-sm font-bold text-white">${mstrPrice.toFixed(2)}</span>
            </div>
          )}
          <Link href="/mstr/calculator" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            + New Trade
          </Link>
          <button onClick={() => setShowReset(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
            Reset Account
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      {showReset && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-400">Reset account to $100,000 and delete all trades?</p>
          <div className="flex space-x-2">
            <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Yes, Reset</button>
            <button onClick={() => setShowReset(false)} className="px-4 py-2 bg-slate-700 text-white rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Balance</p>
          <p className="text-xl font-bold text-white">${stats.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total Return</p>
          <p className={`text-xl font-bold ${stats.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalReturn >= 0 ? '+' : ''}{stats.totalReturn.toFixed(2)}%
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Realized P&L</p>
          <p className={`text-xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(0)}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Unrealized P&L</p>
          <p className={`text-xl font-bold ${totalUnrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(0)}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Win Rate</p>
          <p className="text-xl font-bold text-white">
            {stats.totalTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
          </p>
          <p className="text-xs text-slate-500">{stats.wins}W / {stats.losses}L</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Open Positions</p>
          <p className="text-xl font-bold text-blue-400">{stats.openTrades}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('open')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            tab === 'open' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Open Positions ({openTrades.length})
        </button>
        <button
          onClick={() => setTab('closed')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            tab === 'closed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Trade History ({closedTrades.length})
        </button>
      </div>

      {/* Open Positions */}
      {tab === 'open' && (
        <div className="space-y-3">
          {openTrades.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400 mb-4">No open positions</p>
              <Link href="/mstr/calculator" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-block">
                Place Your First Trade →
              </Link>
            </div>
          ) : (
            openTrades.map(trade => {
              const unrealized = getUnrealizedPnl(trade)
              const daysLeft = Math.max(0, Math.ceil((new Date(trade.expirationDate).getTime() - Date.now()) / 86400000))
              return (
                <div key={trade.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-white text-lg">{trade.strategyName}</span>
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{trade.symbol}</span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{trade.contracts} contract{trade.contracts > 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">Strike:</span>
                          <span className="ml-1 text-white">${trade.strikePrice}{trade.strikePrice2 ? `/$${trade.strikePrice2}` : ''}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Entry:</span>
                          <span className="ml-1 text-white">${trade.entryPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Premium:</span>
                          <span className="ml-1 text-green-400">${trade.totalPremium.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Expires:</span>
                          <span className="ml-1 text-white">{daysLeft}d</span>
                        </div>
                        <div>
                          <span className="text-slate-400">P&L:</span>
                          <span className={`ml-1 font-bold ${unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {unrealized >= 0 ? '+' : ''}${unrealized.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleClose(trade)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleDelete(trade.id)}
                        className="p-2 bg-slate-700 hover:bg-red-700 text-slate-400 hover:text-white rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Closed Trades */}
      {tab === 'closed' && (
        <div className="space-y-3">
          {closedTrades.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400">No closed trades yet</p>
            </div>
          ) : (
            closedTrades.map(trade => (
              <div key={trade.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-bold text-white">{trade.strategyName}</span>
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{trade.contracts}x</span>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        (trade.pnl || 0) >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(0)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-400">
                      <div>Strike: ${trade.strikePrice}</div>
                      <div>Entry: ${trade.entryPrice.toFixed(2)} → Close: ${trade.closePrice?.toFixed(2) || '—'}</div>
                      <div>Premium: ${trade.totalPremium.toFixed(0)}</div>
                      <div>Opened: {new Date(trade.openedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(trade.id)}
                    className="p-2 bg-slate-700 hover:bg-red-700 text-slate-400 hover:text-white rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Performance Summary */}
      {stats.totalTrades > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Avg Win</p>
              <p className="text-green-400 font-bold">${stats.avgWin.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-slate-400">Avg Loss</p>
              <p className="text-red-400 font-bold">${stats.avgLoss.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-slate-400">Profit Factor</p>
              <p className="text-white font-bold">{stats.profitFactor.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-slate-400">Starting Balance</p>
              <p className="text-white font-bold">${stats.startingBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
