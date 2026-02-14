'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Target, Trash2, X, RefreshCw, Bitcoin, Activity } from 'lucide-react'
import Link from 'next/link'
import { getAccount, getStats, getOpenTrades, getClosedTrades, closeTrade, closeSpotTrade, deleteTrade, resetAccount, placeSpotTrade, PaperTrade } from '../lib/paper-trading'

interface VaultSignal {
  price: number
  change_24h: number
  momentum_5d: number
  volume_trend: number
  score: number
  signal: string
}

export default function PaperTradingDashboard() {
  const [stats, setStats] = useState(getStats())
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([])
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([])
  const [mstrPrice, setMstrPrice] = useState(0)
  const [btcPrice, setBtcPrice] = useState(0)
  const [btcSignal, setBtcSignal] = useState<VaultSignal | null>(null)
  const [mstrSignal, setMstrSignal] = useState<VaultSignal | null>(null)
  const [tab, setTab] = useState<'open' | 'closed' | 'trade'>('open')
  const [showReset, setShowReset] = useState(false)

  // Spot trade form
  const [spotSymbol, setSpotSymbol] = useState<'BTC' | 'MSTR'>('MSTR')
  const [spotDirection, setSpotDirection] = useState<'long' | 'short'>('long')
  const [spotQuantity, setSpotQuantity] = useState('')
  const [spotDollarAmount, setSpotDollarAmount] = useState('1000')

  const refresh = () => {
    setStats(getStats())
    setOpenTrades(getOpenTrades())
    setClosedTrades(getClosedTrades())
  }

  useEffect(() => {
    refresh()
    const fetchPrices = async () => {
      try {
        const [mstrRes, signalRes] = await Promise.all([
          fetch('/api/v1/live/mstr', { cache: 'no-store' }),
          fetch('/api/v1/live/vault-signal', { cache: 'no-store' }),
        ])
        const mstr = await mstrRes.json()
        setMstrPrice(mstr.price)
        
        const signal = await signalRes.json()
        setBtcPrice(signal.btc.price)
        setBtcSignal(signal.btc)
        setMstrSignal(signal.mstr)
      } catch {}
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleClose = (trade: PaperTrade) => {
    if (trade.tradeType === 'spot') {
      const price = trade.symbol === 'BTC' ? btcPrice : mstrPrice
      if (price > 0) closeSpotTrade(trade.id, price)
    } else {
      const daysLeft = Math.max(0, (new Date(trade.expirationDate).getTime() - Date.now()) / 86400000)
      const timeDecay = Math.sqrt(daysLeft / 30)
      closeTrade(trade.id, mstrPrice, trade.premium * timeDecay * 0.8)
    }
    refresh()
  }

  const handleSpotTrade = () => {
    const price = spotSymbol === 'BTC' ? btcPrice : mstrPrice
    if (price <= 0) return
    
    let qty: number
    if (spotSymbol === 'BTC') {
      qty = parseFloat(spotDollarAmount) / price
    } else {
      qty = Math.floor(parseFloat(spotDollarAmount) / price)
    }
    if (qty <= 0 || isNaN(qty)) return

    const signal = spotSymbol === 'BTC' ? btcSignal?.signal : mstrSignal?.signal
    placeSpotTrade({
      symbol: spotSymbol,
      direction: spotDirection,
      quantity: qty,
      entryPrice: price,
      signal,
    })
    refresh()
    setTab('open')
  }

  const getUnrealizedPnl = (trade: PaperTrade) => {
    if (trade.tradeType === 'spot') {
      const currentPrice = trade.symbol === 'BTC' ? btcPrice : mstrPrice
      if (!currentPrice) return 0
      const qty = trade.quantity || 0
      return trade.direction === 'long'
        ? (currentPrice - trade.entryPrice) * qty
        : (trade.entryPrice - currentPrice) * qty
    }
    if (!mstrPrice) return 0
    if (trade.strategy === 'covered_call') {
      const stockPnl = (mstrPrice - trade.entryPrice) * trade.shares
      const intrinsic = Math.max(0, mstrPrice - trade.strikePrice) * trade.shares
      return stockPnl - intrinsic + trade.totalPremium
    } else if (trade.strategy === 'cash_secured_put') {
      const intrinsic = Math.max(0, trade.strikePrice - mstrPrice) * trade.shares
      return trade.totalPremium - intrinsic
    }
    return 0
  }

  const totalUnrealized = openTrades.reduce((s, t) => s + getUnrealizedPnl(t), 0)

  const getSignalColor = (signal: string) => {
    if (signal.includes('STRONG BUY')) return 'text-green-400 bg-green-900/30'
    if (signal.includes('BUY')) return 'text-green-400 bg-green-900/20'
    if (signal.includes('STRONG SELL')) return 'text-red-400 bg-red-900/30'
    if (signal.includes('SELL')) return 'text-red-400 bg-red-900/20'
    return 'text-yellow-400 bg-yellow-900/20'
  }

  const getScoreBar = (score: number) => {
    const pct = (score + 100) / 2 // normalize -100..100 to 0..100
    return pct
  }

  // Compare trades with signal: how many trades aligned with VaultSignal?
  const signalAligned = closedTrades.filter(t => {
    if (!t.signalAtEntry) return false
    const wasLong = t.direction === 'long'
    const signalWasBuy = t.signalAtEntry.includes('BUY')
    return (wasLong && signalWasBuy) || (!wasLong && !signalWasBuy)
  })
  const signalMisaligned = closedTrades.filter(t => {
    if (!t.signalAtEntry) return false
    const wasLong = t.direction === 'long'
    const signalWasBuy = t.signalAtEntry.includes('BUY')
    return (wasLong && !signalWasBuy) || (!wasLong && signalWasBuy)
  })
  const alignedWins = signalAligned.filter(t => (t.pnl || 0) > 0).length
  const misalignedWins = signalMisaligned.filter(t => (t.pnl || 0) > 0).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Paper Trading</h1>
          </div>
          <p className="text-slate-400">Practice trading BTC, MSTR & options with $100K virtual balance</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Link href="/mstr/calculator" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            Options Calculator
          </Link>
          <button onClick={() => setShowReset(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
            Reset
          </button>
        </div>
      </div>

      {showReset && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-400">Reset to $100K and delete all trades?</p>
          <div className="flex space-x-2">
            <button onClick={() => { resetAccount(); refresh(); setShowReset(false) }} className="px-4 py-2 bg-red-600 text-white rounded text-sm">Yes</button>
            <button onClick={() => setShowReset(false)} className="px-4 py-2 bg-slate-700 text-white rounded text-sm">No</button>
          </div>
        </div>
      )}

      {/* VaultSignal Indicator */}
      {(btcSignal || mstrSignal) && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold">VaultSignal Indicator</h2>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">BETA</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {btcSignal && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Bitcoin className="h-5 w-5 text-orange-400" />
                    <span className="font-bold text-white">Bitcoin</span>
                    <span className="text-sm text-slate-400">${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getSignalColor(btcSignal.signal)}`}>
                    {btcSignal.signal}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${btcSignal.score >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${getScoreBar(btcSignal.score)}%`, marginLeft: btcSignal.score < 0 ? `${getScoreBar(btcSignal.score)}%` : '50%', maxWidth: '50%' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Strong Sell</span>
                  <span>Score: {btcSignal.score}</span>
                  <span>Strong Buy</span>
                </div>
              </div>
            )}
            {mstrSignal && (
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <span className="font-bold text-white">MSTR</span>
                    <span className="text-sm text-slate-400">${mstrPrice.toFixed(2)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getSignalColor(mstrSignal.signal)}`}>
                    {mstrSignal.signal}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${mstrSignal.score >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${getScoreBar(mstrSignal.score)}%`, marginLeft: mstrSignal.score < 0 ? `${getScoreBar(mstrSignal.score)}%` : '50%', maxWidth: '50%' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Strong Sell</span>
                  <span>Score: {mstrSignal.score}</span>
                  <span>Strong Buy</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
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
          <p className="text-xs text-slate-400 mb-1">Unrealized</p>
          <p className={`text-xl font-bold ${totalUnrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(0)}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Win Rate</p>
          <p className="text-xl font-bold text-white">{stats.totalTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}</p>
          <p className="text-xs text-slate-500">{stats.wins}W / {stats.losses}L</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Open</p>
          <p className="text-xl font-bold text-blue-400">{stats.openTrades}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('trade')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${tab === 'trade' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          New Trade
        </button>
        <button onClick={() => setTab('open')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${tab === 'open' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          Open ({openTrades.length})
        </button>
        <button onClick={() => setTab('closed')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${tab === 'closed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          History ({closedTrades.length})
        </button>
      </div>

      {/* New Spot Trade */}
      {tab === 'trade' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">Place Spot Trade</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Asset</label>
              <div className="flex space-x-2">
                <button onClick={() => setSpotSymbol('BTC')} className={`flex-1 py-2 rounded font-medium text-sm ${spotSymbol === 'BTC' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  ₿ BTC
                </button>
                <button onClick={() => setSpotSymbol('MSTR')} className={`flex-1 py-2 rounded font-medium text-sm ${spotSymbol === 'MSTR' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  MSTR
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Direction</label>
              <div className="flex space-x-2">
                <button onClick={() => setSpotDirection('long')} className={`flex-1 py-2 rounded font-medium text-sm ${spotDirection === 'long' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  Buy (Long)
                </button>
                <button onClick={() => setSpotDirection('short')} className={`flex-1 py-2 rounded font-medium text-sm ${spotDirection === 'short' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  Sell (Short)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Amount ($)</label>
              <input
                type="number"
                value={spotDollarAmount}
                onChange={(e) => setSpotDollarAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="1000"
              />
              <p className="text-xs text-slate-500 mt-1">
                ≈ {spotSymbol === 'BTC'
                  ? `${btcPrice > 0 ? (parseFloat(spotDollarAmount || '0') / btcPrice).toFixed(6) : '—'} BTC`
                  : `${mstrPrice > 0 ? Math.floor(parseFloat(spotDollarAmount || '0') / mstrPrice) : '—'} shares`
                }
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSpotTrade}
                disabled={(spotSymbol === 'BTC' ? btcPrice : mstrPrice) <= 0}
                className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold rounded transition-colors"
              >
                {spotDirection === 'long' ? 'Buy' : 'Short'} {spotSymbol}
              </button>
            </div>
          </div>
          {/* Signal hint */}
          {(spotSymbol === 'BTC' ? btcSignal : mstrSignal) && (
            <div className="mt-3 flex items-center space-x-2 text-sm">
              <span className="text-slate-400">VaultSignal says:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${getSignalColor((spotSymbol === 'BTC' ? btcSignal : mstrSignal)?.signal || '')}`}>
                {(spotSymbol === 'BTC' ? btcSignal : mstrSignal)?.signal}
              </span>
              <span className="text-slate-500">Score: {(spotSymbol === 'BTC' ? btcSignal : mstrSignal)?.score}</span>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">For options, use the <Link href="/mstr/calculator" className="text-blue-400 hover:underline">Options Calculator</Link></p>
        </div>
      )}

      {/* Open Positions */}
      {tab === 'open' && (
        <div className="space-y-3">
          {openTrades.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400 mb-4">No open positions</p>
              <button onClick={() => setTab('trade')} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                Place Your First Trade
              </button>
            </div>
          ) : (
            openTrades.map(trade => {
              const unrealized = getUnrealizedPnl(trade)
              const currentPrice = trade.symbol === 'BTC' ? btcPrice : mstrPrice
              const unrealizedPct = trade.entryPrice > 0 ? (unrealized / (trade.entryPrice * (trade.quantity || trade.shares))) * 100 : 0
              return (
                <div key={trade.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-white text-lg">{trade.strategyName}</span>
                        <span className={`text-xs px-2 py-1 rounded ${trade.symbol === 'BTC' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{trade.symbol}</span>
                        {trade.signalAtEntry && (
                          <span className={`text-xs px-2 py-0.5 rounded ${getSignalColor(trade.signalAtEntry)}`}>
                            Signal: {trade.signalAtEntry}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">Qty:</span>
                          <span className="ml-1 text-white">
                            {trade.tradeType === 'spot'
                              ? (trade.symbol === 'BTC' ? `₿${(trade.quantity || 0).toFixed(6)}` : `${trade.quantity} shares`)
                              : `${trade.contracts} contract${trade.contracts > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Entry:</span>
                          <span className="ml-1 text-white">${trade.entryPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Current:</span>
                          <span className="ml-1 text-white">${currentPrice.toFixed(2)}</span>
                        </div>
                        {trade.tradeType === 'option' && (
                          <div>
                            <span className="text-slate-400">Strike:</span>
                            <span className="ml-1 text-white">${trade.strikePrice}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400">P&L:</span>
                          <span className={`ml-1 font-bold ${unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {unrealized >= 0 ? '+' : ''}${unrealized.toFixed(0)} ({unrealizedPct >= 0 ? '+' : ''}{unrealizedPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleClose(trade)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded">Close</button>
                      <button onClick={() => { deleteTrade(trade.id); refresh() }} className="p-2 bg-slate-700 hover:bg-red-700 text-slate-400 hover:text-white rounded">
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

      {/* Closed */}
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
                      <span className={`text-xs px-2 py-1 rounded ${trade.symbol === 'BTC' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{trade.symbol}</span>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${(trade.pnl || 0) >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(0)} ({(trade.pnlPercent || 0).toFixed(1)}%)
                      </span>
                      {trade.signalAtEntry && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getSignalColor(trade.signalAtEntry)}`}>
                          Signal: {trade.signalAtEntry}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      Entry: ${trade.entryPrice.toFixed(2)} → Close: ${trade.closePrice?.toFixed(2) || '—'} • {new Date(trade.openedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={() => { deleteTrade(trade.id); refresh() }} className="p-2 bg-slate-700 hover:bg-red-700 text-slate-400 hover:text-white rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Signal Performance Comparison */}
      {closedTrades.length > 0 && (signalAligned.length > 0 || signalMisaligned.length > 0) && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold">Your Trades vs VaultSignal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-4">
              <p className="text-sm text-green-400 mb-1">Trades Aligned with Signal</p>
              <p className="text-3xl font-bold text-white">{signalAligned.length}</p>
              <p className="text-sm text-slate-400">
                Win rate: {signalAligned.length > 0 ? `${((alignedWins / signalAligned.length) * 100).toFixed(0)}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                P&L: ${signalAligned.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(0)}
              </p>
            </div>
            <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4">
              <p className="text-sm text-red-400 mb-1">Trades Against Signal</p>
              <p className="text-3xl font-bold text-white">{signalMisaligned.length}</p>
              <p className="text-sm text-slate-400">
                Win rate: {signalMisaligned.length > 0 ? `${((misalignedWins / signalMisaligned.length) * 100).toFixed(0)}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                P&L: ${signalMisaligned.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(0)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            VaultSignal tracks whether your trades align with the indicator at time of entry. Trade with the signal to see if it improves your results.
          </p>
        </div>
      )}

      {/* Performance Summary */}
      {stats.totalTrades > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-lg font-bold mb-4">Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-400">Avg Win</p><p className="text-green-400 font-bold">${stats.avgWin.toFixed(0)}</p></div>
            <div><p className="text-slate-400">Avg Loss</p><p className="text-red-400 font-bold">${stats.avgLoss.toFixed(0)}</p></div>
            <div><p className="text-slate-400">Profit Factor</p><p className="text-white font-bold">{stats.profitFactor.toFixed(2)}x</p></div>
            <div><p className="text-slate-400">Starting Balance</p><p className="text-white font-bold">${stats.startingBalance.toLocaleString()}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}
