'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calculator, TrendingUp, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { placeTrade } from '../../lib/paper-trading'

// Black-Scholes
function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1.0 + sign * y)
}

function blackScholes(S: number, K: number, T: number, r: number, sigma: number, type: 'call' | 'put') {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) return { price: Math.max(0, type === 'call' ? S - K : K - S), delta: type === 'call' ? 1 : -1, theta: 0 }
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)
  const nd1 = normalCDF(d1), nd2 = normalCDF(d2)
  const nnd1 = normalCDF(-d1), nnd2 = normalCDF(-d2)
  const pdf_d1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI)
  if (type === 'call') {
    return {
      price: Math.max(0, S * nd1 - K * Math.exp(-r * T) * nd2),
      delta: nd1,
      theta: (-S * pdf_d1 * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * nd2) / 365
    }
  }
  return {
    price: Math.max(0, K * Math.exp(-r * T) * nnd2 - S * nnd1),
    delta: nd1 - 1,
    theta: (-S * pdf_d1 * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * nnd2) / 365
  }
}

const strategies = {
  covered_call: { name: 'Covered Call', description: 'Own shares + sell call. Collect premium income, cap upside at strike.', riskLevel: 'Low', outlook: 'Neutral to slightly bullish' },
  cash_secured_put: { name: 'Cash Secured Put', description: 'Sell put with cash to cover. Collect premium, may buy shares at strike.', riskLevel: 'Moderate', outlook: 'Neutral to bullish' },
  protective_put: { name: 'Protective Put', description: 'Own shares + buy put for insurance. Unlimited upside, capped downside.', riskLevel: 'Low', outlook: 'Bullish with protection' },
  bull_call_spread: { name: 'Bull Call Spread', description: 'Buy call + sell higher call. Defined risk bullish bet.', riskLevel: 'Moderate', outlook: 'Moderately bullish' },
  bear_put_spread: { name: 'Bear Put Spread', description: 'Buy put + sell lower put. Defined risk bearish bet.', riskLevel: 'Moderate', outlook: 'Moderately bearish' },
}

export default function OptionsCalculator() {
  const [mstrData, setMstrData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState('covered_call')
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30)
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [strikePrice, setStrikePrice] = useState(150)
  const [strikePrice2, setStrikePrice2] = useState(170)
  const [contracts, setContracts] = useState(1)
  const [iv, setIv] = useState(0) // 0 = not loaded yet
  const [tradePlaced, setTradePlaced] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mstrRes, optionsRes] = await Promise.all([
          fetch('/api/v1/live/mstr', { cache: 'no-store' }),
          fetch('/api/v1/live/options-flow', { cache: 'no-store' }),
        ])
        const data = await mstrRes.json()
        setMstrData(data)

        // Get live IV — use ATM option IV from chain for accuracy
        try {
          const optData = await optionsRes.json()
          if (optData?.options_chain?.length > 0) {
            // Find ATM call IV (closest strike to current price)
            const calls = optData.options_chain.filter((o: any) => o.type === 'CALL' && o.impliedVolatility > 0)
            if (calls.length > 0) {
              const atm = calls.reduce((best: any, o: any) =>
                Math.abs(o.strike - data.price) < Math.abs(best.strike - data.price) ? o : best
              )
              const liveIV = Math.round(atm.impliedVolatility * 100)
              if (liveIV > 0 && liveIV < 500) setIv(liveIV)
            }
          }
          // Fallback to market_data field
          if (iv === 0 && optData?.market_data?.implied_volatility) {
            const val = optData.market_data.implied_volatility
            setIv(Math.round(val > 5 ? val : val * 100)) // handle both decimal and percent
          }
        } catch {}

        if (loading) {
          const rounded = Math.ceil(data.price / 5) * 5
          setStrikePrice(rounded + 10)
          setStrikePrice2(rounded + 30)
        }
        setLoading(false)
      } catch {
        setMstrData({ price: 133.88, market_cap: 44480000000, volume: 23000000, btc_holdings: 714644, change_percent: 0 })
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const daysToExp = useMemo(() => Math.max(0, Math.ceil((new Date(expirationDate).getTime() - Date.now()) / 86400000)), [expirationDate])
  const T = daysToExp / 365
  const r = 0.045
  const sigma = (iv || 85) / 100
  const S = mstrData?.price || 133.88
  const shares = contracts * 100
  const needsSpread = selectedStrategy === 'bull_call_spread' || selectedStrategy === 'bear_put_spread'

  const calc = useMemo(() => {
    const call1 = blackScholes(S, strikePrice, T, r, sigma, 'call')
    const put1 = blackScholes(S, strikePrice, T, r, sigma, 'put')
    const call2 = blackScholes(S, strikePrice2, T, r, sigma, 'call')
    const put2 = blackScholes(S, strikePrice2, T, r, sigma, 'put')
    const strat = selectedStrategy
    let premium = 0, maxProfit = 0, maxLoss = 0, breakeven = 0

    if (strat === 'covered_call') {
      // SELL call, collect premium
      premium = call1.price // this DECREASES as strike goes higher (further OTM)
      // Max profit = premium collected (if stock stays below strike, option expires worthless)
      // You keep shares + premium = best outcome
      maxProfit = premium * shares
      // If assigned: you sell shares at strike. P&L = (strike - entry) + premium
      // Max loss: stock goes to $0, you lose share value minus premium
      maxLoss = (S - premium) * shares
      breakeven = S - premium
    } else if (strat === 'cash_secured_put') {
      premium = put1.price // DECREASES as strike goes lower (further OTM)
      maxProfit = premium * shares // option expires worthless
      maxLoss = (strikePrice - premium) * shares // assigned, stock to $0
      breakeven = strikePrice - premium
    } else if (strat === 'protective_put') {
      premium = put1.price
      maxProfit = Infinity
      maxLoss = (S - strikePrice + premium) * shares
      breakeven = S + premium
    } else if (strat === 'bull_call_spread') {
      const debit = call1.price - call2.price
      premium = debit
      maxProfit = (strikePrice2 - strikePrice - debit) * shares
      maxLoss = debit * shares
      breakeven = strikePrice + debit
    } else if (strat === 'bear_put_spread') {
      const lowerStrike = Math.min(strikePrice, strikePrice2)
      const upperStrike = Math.max(strikePrice, strikePrice2)
      const highPut = blackScholes(S, upperStrike, T, r, sigma, 'put')
      const lowPut = blackScholes(S, lowerStrike, T, r, sigma, 'put')
      const debit = highPut.price - lowPut.price
      premium = debit
      maxProfit = (upperStrike - lowerStrike - debit) * shares
      maxLoss = debit * shares
      breakeven = upperStrike - debit
    }

    return { premium: Math.max(0, premium), maxProfit, maxLoss: Math.max(0, maxLoss), breakeven, call: call1, put: put1, call2, put2 }
  }, [S, strikePrice, strikePrice2, T, r, sigma, selectedStrategy, shares])

  const handleStrikeChange = (val: number) => setStrikePrice(Math.max(5, Math.round(val / 5) * 5))
  const handleStrike2Change = (val: number) => setStrikePrice2(Math.max(5, Math.round(val / 5) * 5))

  if (loading || !mstrData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">MSTR Options Calculator</h1>
        <p className="text-gray-400">Black-Scholes pricing with live MSTR data & IV</p>
      </div>

      {/* Live Data */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-400">MSTR Price</p>
            <p className="text-2xl font-bold text-blue-400">${S.toFixed(2)}</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Days to Exp</p>
            <p className="text-2xl font-bold text-white">{daysToExp}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Implied Volatility</p>
            <p className="text-2xl font-bold text-yellow-400">{iv || '...'}%</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-400">Live ATM IV</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">
              {selectedStrategy === 'covered_call' ? 'Call Premium' :
               selectedStrategy === 'cash_secured_put' ? 'Put Premium' : 'Premium'}
            </p>
            <p className="text-2xl font-bold text-green-400">${calc.premium.toFixed(2)}</p>
            <p className="text-xs text-slate-500">per share</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Calculator className="h-6 w-6" />
            <span>Parameters</span>
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Strategy</label>
              <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
                {Object.entries(strategies).map(([key, s]) => (<option key={key} value={key}>{s.name}</option>))}
              </select>
              <p className="text-xs text-gray-400 mt-1">{strategies[selectedStrategy as keyof typeof strategies].description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expiration Date</label>
              <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">{daysToExp} days to expiration</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Strike Price{needsSpread ? ' (Long)' : ''}</label>
              <div className="flex items-center space-x-3">
                <button onClick={() => handleStrikeChange(strikePrice - 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">-5</button>
                <input type="number" value={strikePrice} onChange={(e) => handleStrikeChange(Number(e.target.value))} step="5"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-center focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => handleStrikeChange(strikePrice + 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">+5</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {strikePrice > S ? `${((strikePrice / S - 1) * 100).toFixed(1)}% OTM` : strikePrice < S ? `${((1 - strikePrice / S) * 100).toFixed(1)}% ITM` : 'ATM'}
                {' • Call: $'}{calc.call.price.toFixed(2)}{' • Put: $'}{calc.put.price.toFixed(2)}
              </p>
            </div>
            {needsSpread && (
              <div>
                <label className="block text-sm font-medium mb-2">Strike Price (Short)</label>
                <div className="flex items-center space-x-3">
                  <button onClick={() => handleStrike2Change(strikePrice2 - 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">-5</button>
                  <input type="number" value={strikePrice2} onChange={(e) => handleStrike2Change(Number(e.target.value))} step="5"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-center focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => handleStrike2Change(strikePrice2 + 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">+5</button>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Contracts (1 = 100 shares)</label>
              <div className="flex items-center space-x-3">
                <button onClick={() => setContracts(Math.max(1, contracts - 1))} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">-1</button>
                <input type="number" value={contracts} onChange={(e) => setContracts(Math.max(1, Math.round(Number(e.target.value))))} min="1" step="1"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-center focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => setContracts(contracts + 1)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">+1</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{contracts} contract(s) = {shares} shares</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span>{strategies[selectedStrategy as keyof typeof strategies].name}</span>
          </h3>
          <div className="space-y-4">

            {/* Covered Call specific */}
            {selectedStrategy === 'covered_call' && (
              <>
                <div className="p-5 bg-green-900/20 border-2 border-green-700/50 rounded-lg text-center">
                  <p className="text-sm text-green-400 mb-1">Premium Collected (Income)</p>
                  <p className="text-4xl font-bold text-green-400">${(calc.premium * shares).toFixed(0)}</p>
                  <p className="text-sm text-slate-400 mt-1">${calc.premium.toFixed(2)}/share × {shares} shares</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Return: {((calc.premium / S) * 100).toFixed(2)}% in {daysToExp}d ({((calc.premium / S) * (365 / Math.max(1, daysToExp)) * 100).toFixed(1)}% annualized)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <p className="text-sm text-green-400 mb-1">Max Profit (Expires Worthless)</p>
                    <p className="text-2xl font-bold text-green-400">${calc.maxProfit.toFixed(0)}</p>
                    <p className="text-xs text-slate-400 mt-1">Keep shares + all premium</p>
                  </div>
                  <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                    <p className="text-sm text-yellow-400 mb-1">If Assigned at ${strikePrice}</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      ${((strikePrice - S + calc.premium) * shares).toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Shares sold at strike + premium</p>
                  </div>
                  <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                    <p className="text-sm text-red-400 mb-1">Max Loss</p>
                    <p className="text-2xl font-bold text-red-400">-${calc.maxLoss.toFixed(0)}</p>
                    <p className="text-xs text-slate-400 mt-1">Stock to $0, offset by premium</p>
                  </div>
                  <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <p className="text-sm text-blue-400 mb-1">Breakeven</p>
                    <p className="text-2xl font-bold text-blue-400">${calc.breakeven.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-1">{((1 - calc.breakeven / S) * 100).toFixed(1)}% cushion</p>
                  </div>
                </div>
              </>
            )}

            {/* Cash Secured Put specific */}
            {selectedStrategy === 'cash_secured_put' && (
              <>
                <div className="p-5 bg-green-900/20 border-2 border-green-700/50 rounded-lg text-center">
                  <p className="text-sm text-green-400 mb-1">Premium Collected (Income)</p>
                  <p className="text-4xl font-bold text-green-400">${(calc.premium * shares).toFixed(0)}</p>
                  <p className="text-sm text-slate-400 mt-1">${calc.premium.toFixed(2)}/share × {shares} shares</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Return on capital: {((calc.premium / strikePrice) * 100).toFixed(2)}% in {daysToExp}d ({((calc.premium / strikePrice) * (365 / Math.max(1, daysToExp)) * 100).toFixed(1)}% annualized)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <p className="text-sm text-green-400 mb-1">Max Profit (Expires Worthless)</p>
                    <p className="text-2xl font-bold text-green-400">${calc.maxProfit.toFixed(0)}</p>
                    <p className="text-xs text-slate-400 mt-1">Keep all premium, no shares</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-300 mb-1">Cash Reserved</p>
                    <p className="text-2xl font-bold text-white">${(strikePrice * shares).toFixed(0)}</p>
                    <p className="text-xs text-slate-400 mt-1">{shares} shares @ ${strikePrice} strike</p>
                  </div>
                  <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                    <p className="text-sm text-red-400 mb-1">Max Loss</p>
                    <p className="text-2xl font-bold text-red-400">-${calc.maxLoss.toFixed(0)}</p>
                    <p className="text-xs text-slate-400 mt-1">Assigned, stock to $0</p>
                  </div>
                  <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <p className="text-sm text-blue-400 mb-1">Breakeven</p>
                    <p className="text-2xl font-bold text-blue-400">${calc.breakeven.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-1">Effective buy price if assigned</p>
                  </div>
                </div>
              </>
            )}

            {/* Other strategies */}
            {selectedStrategy !== 'covered_call' && selectedStrategy !== 'cash_secured_put' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                  <p className="text-sm text-green-400 mb-1">Max Profit</p>
                  <p className="text-2xl font-bold text-green-400">{calc.maxProfit === Infinity ? 'Unlimited' : `$${calc.maxProfit.toFixed(0)}`}</p>
                </div>
                <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <p className="text-sm text-red-400 mb-1">Max Loss</p>
                  <p className="text-2xl font-bold text-red-400">-${calc.maxLoss.toFixed(0)}</p>
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <p className="text-sm text-blue-400 mb-1">Breakeven</p>
                  <p className="text-2xl font-bold text-blue-400">${calc.breakeven.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                  <p className="text-sm text-yellow-400 mb-1">Cost / Premium</p>
                  <p className="text-2xl font-bold text-yellow-400">${(calc.premium * shares).toFixed(0)}</p>
                </div>
              </div>
            )}

            {/* P&L at Expiration */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-300 mb-3">P&L at Expiration</h4>
              <div className="space-y-2 text-sm">
                {[0.80, 0.85, 0.90, 0.95, 1.0, 1.05, 1.10, 1.15, 1.20].map(mult => {
                  const price = Math.round(S * mult)
                  let pnl = 0
                  if (selectedStrategy === 'covered_call') {
                    const stockPnl = (price - S) * shares
                    const callPayout = Math.max(0, price - strikePrice) * shares
                    pnl = stockPnl - callPayout + calc.premium * shares
                  } else if (selectedStrategy === 'cash_secured_put') {
                    pnl = calc.premium * shares - Math.max(0, strikePrice - price) * shares
                  } else if (selectedStrategy === 'protective_put') {
                    pnl = (price - S) * shares + Math.max(0, strikePrice - price) * shares - calc.premium * shares
                  } else if (selectedStrategy === 'bull_call_spread') {
                    pnl = (Math.max(0, price - strikePrice) - Math.max(0, price - strikePrice2) - calc.premium) * shares
                  } else if (selectedStrategy === 'bear_put_spread') {
                    const upper = Math.max(strikePrice, strikePrice2), lower = Math.min(strikePrice, strikePrice2)
                    pnl = (Math.max(0, upper - price) - Math.max(0, lower - price) - calc.premium) * shares
                  }
                  const isAtPrice = Math.abs(mult - 1.0) < 0.001
                  return (
                    <div key={mult} className={`flex items-center justify-between ${isAtPrice ? 'bg-slate-600/30 rounded px-2 py-1' : ''}`}>
                      <span className="text-slate-400 font-mono">
                        ${price} ({mult >= 1 ? '+' : ''}{((mult - 1) * 100).toFixed(0)}%)
                        {isAtPrice && ' ← current'}
                      </span>
                      <span className={`font-bold font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Greeks */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-300 mb-3">Greeks</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-slate-400">Call Δ:</span><span className="ml-1 text-white font-mono">{calc.call.delta.toFixed(3)}</span></div>
                <div><span className="text-slate-400">Put Δ:</span><span className="ml-1 text-white font-mono">{calc.put.delta.toFixed(3)}</span></div>
                <div><span className="text-slate-400">Call θ:</span><span className="ml-1 text-red-400 font-mono">${calc.call.theta.toFixed(3)}/d</span></div>
                <div><span className="text-slate-400">Call $:</span><span className="ml-1 text-green-400 font-mono">${calc.call.price.toFixed(2)}</span></div>
                <div><span className="text-slate-400">Put $:</span><span className="ml-1 text-green-400 font-mono">${calc.put.price.toFixed(2)}</span></div>
                <div><span className="text-slate-400">IV:</span><span className="ml-1 text-yellow-400 font-mono">{iv}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paper Trade */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Paper Trade This Strategy</h3>
            <p className="text-sm text-slate-400">Practice with $100K virtual balance</p>
          </div>
          <div className="flex items-center space-x-3">
            {tradePlaced ? (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Trade placed!</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  const strat = strategies[selectedStrategy as keyof typeof strategies]
                  const direction = (selectedStrategy === 'covered_call' || selectedStrategy === 'cash_secured_put') ? 'short' as const : 'long' as const
                  const optionType = needsSpread ? 'spread' as const
                    : (selectedStrategy === 'covered_call' || selectedStrategy === 'bull_call_spread') ? 'call' as const : 'put' as const
                  placeTrade({
                    tradeType: 'option',
                    strategy: selectedStrategy,
                    strategyName: strat.name,
                    symbol: 'MSTR',
                    direction,
                    optionType,
                    strikePrice,
                    strikePrice2: needsSpread ? strikePrice2 : undefined,
                    contracts,
                    shares,
                    entryPrice: S,
                    premium: calc.premium,
                    totalPremium: calc.premium * shares,
                    expirationDate,
                    iv,
                  })
                  setTradePlaced(true)
                  setTimeout(() => setTradePlaced(false), 3000)
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                Place Paper Trade
              </button>
            )}
            <Link href="/paper-trading" className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors">
              Dashboard →
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 py-2">
        Black-Scholes pricing • Live IV from MSTR options chain • Not financial advice
      </div>
    </div>
  )
}
