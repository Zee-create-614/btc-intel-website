'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calculator, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'

// Black-Scholes pricing model
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
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) return { price: 0, delta: 0, theta: 0 }
  
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)
  
  let price: number, delta: number, theta: number
  const nd1 = normalCDF(d1)
  const nd2 = normalCDF(d2)
  const nnd1 = normalCDF(-d1)
  const nnd2 = normalCDF(-d2)
  const pdf_d1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI)
  
  if (type === 'call') {
    price = S * nd1 - K * Math.exp(-r * T) * nd2
    delta = nd1
    theta = (-S * pdf_d1 * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * nd2) / 365
  } else {
    price = K * Math.exp(-r * T) * nnd2 - S * nnd1
    delta = nd1 - 1
    theta = (-S * pdf_d1 * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * nnd2) / 365
  }
  
  return { price: Math.max(0, price), delta, theta }
}

const strategies = {
  covered_call: {
    name: 'Covered Call',
    description: 'Own shares + sell call option for income. Collect premium, cap upside at strike.',
    riskLevel: 'Low',
    outlook: 'Neutral to slightly bullish',
  },
  cash_secured_put: {
    name: 'Cash Secured Put',
    description: 'Sell put with cash to cover. Collect premium, may buy shares at strike if assigned.',
    riskLevel: 'Moderate',
    outlook: 'Neutral to bullish',
  },
  protective_put: {
    name: 'Protective Put',
    description: 'Own shares + buy put for insurance. Unlimited upside, limited downside.',
    riskLevel: 'Low',
    outlook: 'Bullish with protection',
  },
  bull_call_spread: {
    name: 'Bull Call Spread',
    description: 'Buy call + sell higher call. Defined risk bullish bet.',
    riskLevel: 'Moderate',
    outlook: 'Moderately bullish',
  },
  bear_put_spread: {
    name: 'Bear Put Spread',
    description: 'Buy put + sell lower put. Defined risk bearish bet.',
    riskLevel: 'Moderate',
    outlook: 'Moderately bearish',
  },
}

export default function OptionsCalculator() {
  const [mstrData, setMstrData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState('covered_call')
  const [expirationDate, setExpirationDate] = useState(() => {
    // Default to ~30 days out, next Friday
    const d = new Date()
    d.setDate(d.getDate() + 30)
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [strikePrice, setStrikePrice] = useState(150)
  const [strikePrice2, setStrikePrice2] = useState(170) // For spreads
  const [contracts, setContracts] = useState(1)
  const [iv, setIv] = useState(85) // MSTR typically 70-120% IV

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/v1/live/mstr', { cache: 'no-store' })
        const data = await res.json()
        setMstrData(data)
        // Set initial strike near current price (round to nearest 5)
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

  const daysToExp = useMemo(() => {
    const diff = new Date(expirationDate).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }, [expirationDate])

  const T = daysToExp / 365
  const r = 0.045 // risk-free rate ~4.5%
  const sigma = iv / 100
  const S = mstrData?.price || 133.88
  const shares = contracts * 100

  // Calculate option prices using Black-Scholes
  const calc = useMemo(() => {
    const call1 = blackScholes(S, strikePrice, T, r, sigma, 'call')
    const put1 = blackScholes(S, strikePrice, T, r, sigma, 'put')
    const call2 = blackScholes(S, strikePrice2, T, r, sigma, 'call')
    const put2 = blackScholes(S, strikePrice2, T, r, sigma, 'put')

    const strat = selectedStrategy
    let premium = 0, maxProfit = 0, maxLoss = 0, breakeven = 0, breakeven2 = 0

    if (strat === 'covered_call') {
      // Sell call, collect premium
      premium = call1.price
      maxProfit = (strikePrice - S + premium) * shares
      maxLoss = (S - premium) * shares // stock goes to 0
      breakeven = S - premium
    } else if (strat === 'cash_secured_put') {
      // Sell put, collect premium
      premium = put1.price
      maxProfit = premium * shares
      maxLoss = (strikePrice - premium) * shares // stock goes to 0
      breakeven = strikePrice - premium
    } else if (strat === 'protective_put') {
      // Buy put, pay premium
      premium = put1.price
      maxProfit = Infinity
      maxLoss = (S - strikePrice + premium) * shares
      breakeven = S + premium
    } else if (strat === 'bull_call_spread') {
      // Buy lower call, sell higher call
      const debit = call1.price - call2.price
      premium = debit
      maxProfit = (strikePrice2 - strikePrice - debit) * shares
      maxLoss = debit * shares
      breakeven = strikePrice + debit
    } else if (strat === 'bear_put_spread') {
      // Buy higher put, sell lower put (strike2 < strike1 here, so swap)
      const higherPut = blackScholes(S, strikePrice, T, r, sigma, 'put')
      const lowerPut = blackScholes(S, strikePrice2 < strikePrice ? strikePrice2 : strikePrice - 20, T, r, sigma, 'put')
      const debit = higherPut.price - lowerPut.price
      premium = debit
      const lowerStrike = strikePrice2 < strikePrice ? strikePrice2 : strikePrice - 20
      maxProfit = (strikePrice - lowerStrike - debit) * shares
      maxLoss = debit * shares
      breakeven = strikePrice - debit
    }

    return {
      premium: Math.max(0, premium),
      maxProfit,
      maxLoss: Math.max(0, maxLoss),
      breakeven,
      breakeven2,
      call: call1,
      put: put1,
      call2,
      put2,
    }
  }, [S, strikePrice, strikePrice2, T, r, sigma, selectedStrategy, shares])

  const handleContractsChange = (val: number) => {
    setContracts(Math.max(1, Math.round(val)))
  }

  const handleStrikeChange = (val: number) => {
    setStrikePrice(Math.max(5, Math.round(val / 5) * 5))
  }

  const handleStrike2Change = (val: number) => {
    setStrikePrice2(Math.max(5, Math.round(val / 5) * 5))
  }

  if (loading || !mstrData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mstr-500 mx-auto mb-4"></div>
          <p className="text-gray-400 ml-4">Loading calculator...</p>
        </div>
      </div>
    )
  }

  const isOTM = selectedStrategy === 'covered_call' || selectedStrategy === 'bull_call_spread'
    ? strikePrice > S
    : strikePrice < S
  const needsSpread = selectedStrategy === 'bull_call_spread' || selectedStrategy === 'bear_put_spread'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">MSTR Options Calculator</h1>
        <p className="text-gray-400">
          Black-Scholes pricing with live MSTR data • Updates every 10 seconds
        </p>
      </div>

      {/* Live Data Bar */}
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
            <p className="text-xs text-slate-400">IV</p>
            <p className="text-2xl font-bold text-yellow-400">{iv}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Option Premium</p>
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
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(strategies).map(([key, s]) => (
                  <option key={key} value={key}>{s.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">{strategies[selectedStrategy as keyof typeof strategies].description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expiration Date</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">{daysToExp} days to expiration</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Strike Price {needsSpread ? '(Long)' : ''}
              </label>
              <div className="flex items-center space-x-3">
                <button onClick={() => handleStrikeChange(strikePrice - 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">-5</button>
                <input
                  type="number"
                  value={strikePrice}
                  onChange={(e) => handleStrikeChange(Number(e.target.value))}
                  step="5"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-center focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => handleStrikeChange(strikePrice + 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">+5</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {strikePrice > S ? `${((strikePrice / S - 1) * 100).toFixed(1)}% OTM` :
                 strikePrice < S ? `${((1 - strikePrice / S) * 100).toFixed(1)}% ITM` : 'ATM'}
                {' • '}
                {selectedStrategy === 'covered_call' || selectedStrategy === 'bull_call_spread'
                  ? `Call: $${calc.call.price.toFixed(2)} (Δ ${calc.call.delta.toFixed(3)})`
                  : `Put: $${calc.put.price.toFixed(2)} (Δ ${calc.put.delta.toFixed(3)})`
                }
              </p>
            </div>

            {needsSpread && (
              <div>
                <label className="block text-sm font-medium mb-2">Strike Price (Short)</label>
                <div className="flex items-center space-x-3">
                  <button onClick={() => handleStrike2Change(strikePrice2 - 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">-5</button>
                  <input
                    type="number"
                    value={strikePrice2}
                    onChange={(e) => handleStrike2Change(Number(e.target.value))}
                    step="5"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-center focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={() => handleStrike2Change(strikePrice2 + 5)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">+5</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Spread width: ${Math.abs(strikePrice2 - strikePrice)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Contracts (1 contract = 100 shares)</label>
              <div className="flex items-center space-x-3">
                <button onClick={() => handleContractsChange(contracts - 1)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">-1</button>
                <input
                  type="number"
                  value={contracts}
                  onChange={(e) => handleContractsChange(Number(e.target.value))}
                  min="1"
                  step="1"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-center focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => handleContractsChange(contracts + 1)} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">+1</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{contracts} contract(s) = {shares} shares</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Implied Volatility (%)</label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={iv}
                  onChange={(e) => setIv(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white font-mono w-14 text-right">{iv}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">MSTR typically 70-120%. Higher IV = higher premiums.</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span>Analysis — {strategies[selectedStrategy as keyof typeof strategies].name}</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                <p className="text-sm text-green-400 mb-1">Max Profit</p>
                <p className="text-2xl font-bold text-green-400">
                  {calc.maxProfit === Infinity ? 'Unlimited' : `$${calc.maxProfit.toFixed(0)}`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedStrategy === 'covered_call' && 'If assigned at strike'}
                  {selectedStrategy === 'cash_secured_put' && 'If expires worthless'}
                  {selectedStrategy === 'protective_put' && 'Unlimited upside'}
                  {selectedStrategy === 'bull_call_spread' && 'At or above short strike'}
                  {selectedStrategy === 'bear_put_spread' && 'At or below short strike'}
                </p>
              </div>

              <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                <p className="text-sm text-red-400 mb-1">Max Loss</p>
                <p className="text-2xl font-bold text-red-400">
                  -${calc.maxLoss.toFixed(0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedStrategy === 'covered_call' && 'If stock goes to $0'}
                  {selectedStrategy === 'cash_secured_put' && 'If stock goes to $0'}
                  {selectedStrategy === 'protective_put' && 'Premium + (entry - strike)'}
                  {selectedStrategy === 'bull_call_spread' && 'Net debit paid'}
                  {selectedStrategy === 'bear_put_spread' && 'Net debit paid'}
                </p>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <p className="text-sm text-blue-400 mb-1">Breakeven</p>
                <p className="text-2xl font-bold text-blue-400">${calc.breakeven.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {calc.breakeven > S ? `${((calc.breakeven / S - 1) * 100).toFixed(1)}% above current` :
                   `${((1 - calc.breakeven / S) * 100).toFixed(1)}% below current`}
                </p>
              </div>

              <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                <p className="text-sm text-yellow-400 mb-1">Total Premium</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ${(calc.premium * shares).toFixed(0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ${calc.premium.toFixed(2)}/share × {shares} shares
                </p>
              </div>
            </div>

            {/* P&L Scenarios */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-300 mb-3">P&L at Expiration</h4>
              <div className="space-y-2 text-sm">
                {[0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2].map(mult => {
                  const price = Math.round(S * mult)
                  let pnl = 0
                  if (selectedStrategy === 'covered_call') {
                    const stockPnl = (price - S) * shares
                    const callPayout = Math.max(0, price - strikePrice) * shares
                    pnl = stockPnl - callPayout + calc.premium * shares
                  } else if (selectedStrategy === 'cash_secured_put') {
                    const putPayout = Math.max(0, strikePrice - price) * shares
                    pnl = calc.premium * shares - putPayout
                  } else if (selectedStrategy === 'protective_put') {
                    const stockPnl = (price - S) * shares
                    const putPayout = Math.max(0, strikePrice - price) * shares
                    pnl = stockPnl + putPayout - calc.premium * shares
                  } else if (selectedStrategy === 'bull_call_spread') {
                    const longCall = Math.max(0, price - strikePrice)
                    const shortCall = Math.max(0, price - strikePrice2)
                    pnl = (longCall - shortCall - calc.premium) * shares
                  } else if (selectedStrategy === 'bear_put_spread') {
                    const longPut = Math.max(0, strikePrice - price)
                    const shortPut = Math.max(0, (strikePrice2 < strikePrice ? strikePrice2 : strikePrice - 20) - price)
                    pnl = (longPut - shortPut - calc.premium) * shares
                  }
                  return (
                    <div key={mult} className="flex items-center justify-between">
                      <span className="text-slate-400 font-mono">${price} ({mult >= 1 ? '+' : ''}{((mult - 1) * 100).toFixed(0)}%)</span>
                      <span className={`font-bold font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Greeks */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-slate-300 mb-3">Greeks</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Call Delta:</span>
                  <span className="ml-2 text-white font-mono">{calc.call.delta.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Put Delta:</span>
                  <span className="ml-2 text-white font-mono">{calc.put.delta.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Call Theta:</span>
                  <span className="ml-2 text-red-400 font-mono">${calc.call.theta.toFixed(4)}/day</span>
                </div>
                <div>
                  <span className="text-slate-400">Put Theta:</span>
                  <span className="ml-2 text-red-400 font-mono">${calc.put.theta.toFixed(4)}/day</span>
                </div>
                <div>
                  <span className="text-slate-400">Call Price:</span>
                  <span className="ml-2 text-green-400 font-mono">${calc.call.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Put Price:</span>
                  <span className="ml-2 text-green-400 font-mono">${calc.put.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Info */}
      <div className="card">
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
            <h4 className="font-semibold text-blue-300">{strategies[selectedStrategy as keyof typeof strategies].name}</h4>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{strategies[selectedStrategy as keyof typeof strategies].riskLevel} Risk</span>
          </div>
          <p className="text-sm text-blue-200">{strategies[selectedStrategy as keyof typeof strategies].description}</p>
          <p className="text-xs text-slate-500 mt-2">
            Pricing uses Black-Scholes model. Real market premiums may differ due to supply/demand, skew, and term structure.
          </p>
        </div>
      </div>
    </div>
  )
}
