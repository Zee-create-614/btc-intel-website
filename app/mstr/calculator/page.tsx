'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { getMSTRData, getMSTROptions, formatCurrency, formatPercent } from '../../lib/data'
import type { MSTRStockData, OptionData } from '../../lib/data'

type Strategy = 'covered_call' | 'cash_secured_put' | 'iron_condor' | 'strangle'

interface CalculationResult {
  premium: number
  maxProfit: number
  maxLoss: number
  breakeven: number
  probability: number
  annualizedReturn: number
  daysToExpiry: number
}

export default function OptionsCalculator() {
  const [mstrData, setMstrData] = useState<MSTRStockData | null>(null)
  const [optionsData, setOptionsData] = useState<OptionData[]>([])
  const [loading, setLoading] = useState(true)
  
  // Calculator inputs
  const [strategy, setStrategy] = useState<Strategy>('covered_call')
  const [selectedStrike, setSelectedStrike] = useState<number>(0)
  const [selectedExpiry, setSelectedExpiry] = useState<string>('')
  const [sharesOwned, setSharesOwned] = useState<number>(100)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  
  // Results
  const [result, setResult] = useState<CalculationResult | null>(null)

  useEffect(() => {
    async function fetchLiveData() {
      try {
        console.log('🔴 OPTIONS CALCULATOR: Fetching LIVE MSTR data...')
        
        // Get live MSTR data from our API
        const mstrResponse = await fetch('/api/v1/live/mstr', { 
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        const mstrLiveData = await mstrResponse.json()
        
        console.log('✅ Live MSTR price for calculator:', mstrLiveData.price)
        
        // Convert to expected format
        const mstrData: MSTRStockData = {
          id: 1,
          timestamp: new Date().toISOString(),
          price: mstrLiveData.price, // LIVE PRICE!
          volume: mstrLiveData.volume,
          change_percent: mstrLiveData.change_percent,
          market_cap: mstrLiveData.market_cap,
          btc_holdings: mstrLiveData.btc_holdings,
          nav_premium: mstrLiveData.nav_premium
        }
        
        // Generate realistic options data based on LIVE current price
        const strikes = []
        const baseStrike = Math.round(mstrLiveData.price / 10) * 10
        for (let i = -4; i <= 4; i++) {
          strikes.push(baseStrike + (i * 10))
        }
        
        const expiries = [
          '2026-03-13', // 30 days
          '2026-04-17', // 60 days  
          '2026-06-19'  // 90 days
        ]
        
        const optionsData: OptionData[] = []
        expiries.forEach(expiry => {
          strikes.forEach(strike => {
            // Generate realistic premiums based on moneyness and LIVE price
            const moneyness = (strike - mstrLiveData.price) / mstrLiveData.price
            const daysToExpiry = Math.floor((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const timeValue = Math.max(1, daysToExpiry * 0.1)
            const intrinsicCall = Math.max(0, mstrLiveData.price - strike)
            const intrinsicPut = Math.max(0, strike - mstrLiveData.price)
            
            // Call option
            optionsData.push({
              id: optionsData.length + 1,
              strike,
              expiry,
              option_type: 'call',
              premium: Math.max(0.1, intrinsicCall + timeValue + (Math.random() * 5)),
              volume: Math.floor(Math.random() * 1000) + 100,
              open_interest: Math.floor(Math.random() * 2000) + 500,
              implied_volatility: 0.8 + (Math.random() * 0.4),
              delta: Math.min(0.99, Math.max(0.01, 0.5 + moneyness)),
              gamma: 0.01 + (Math.random() * 0.02),
              theta: -(0.05 + Math.random() * 0.1),
              vega: 0.1 + (Math.random() * 0.2)
            })
            
            // Put option  
            optionsData.push({
              id: optionsData.length + 1,
              strike,
              expiry,
              option_type: 'put',
              premium: Math.max(0.1, intrinsicPut + timeValue + (Math.random() * 5)),
              volume: Math.floor(Math.random() * 800) + 100,
              open_interest: Math.floor(Math.random() * 1500) + 300,
              implied_volatility: 0.8 + (Math.random() * 0.4),
              delta: Math.max(-0.99, Math.min(-0.01, -0.5 + moneyness)),
              gamma: 0.01 + (Math.random() * 0.02),
              theta: -(0.05 + Math.random() * 0.1),
              vega: 0.1 + (Math.random() * 0.2)
            })
          })
        })
        
        setMstrData(mstrData)
        setOptionsData(optionsData)
        setCurrentPrice(mstrLiveData.price) // LIVE CURRENT PRICE!
        
        // Set defaults based on LIVE price
        const expiriesList = [...new Set(optionsData.map(opt => opt.expiry))].sort()
        if (expiriesList.length > 0) {
          setSelectedExpiry(expiriesList[0])
          
          // Set default strike based on strategy and LIVE price
          const expiryOptions = optionsData.filter(opt => opt.expiry === expiriesList[0])
          if (strategy === 'covered_call') {
            const calls = expiryOptions.filter(opt => opt.option_type === 'call' && opt.strike > mstrLiveData.price)
            if (calls.length > 0) {
              setSelectedStrike(calls[0].strike)
            }
          } else {
            const puts = expiryOptions.filter(opt => opt.option_type === 'put' && opt.strike < mstrLiveData.price)
            if (puts.length > 0) {
              setSelectedStrike(puts[0].strike)
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch live MSTR data for calculator:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()
    
    // Update live data every 15 seconds
    const interval = setInterval(fetchLiveData, 15000)
    return () => clearInterval(interval)
  }, [strategy])

  useEffect(() => {
    calculateStrategy()
  }, [strategy, selectedStrike, selectedExpiry, sharesOwned, currentPrice, optionsData])

  const calculateStrategy = () => {
    if (!mstrData || !selectedStrike || !selectedExpiry) return

    const option = optionsData.find(
      opt => opt.strike === selectedStrike && 
             opt.expiry === selectedExpiry && 
             opt.option_type === (strategy === 'covered_call' ? 'call' : 'put')
    )

    if (!option) return

    const premium = ((option.bid || 0) + (option.ask || 0)) / 2
    const daysToExpiry = Math.max(1, Math.ceil((new Date(selectedExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    
    let maxProfit = 0
    let maxLoss = 0
    let breakeven = 0
    let annualizedReturn = 0

    if (strategy === 'covered_call') {
      // Covered Call: Own 100 shares + Sell 1 call
      const totalPremium = premium * sharesOwned
      maxProfit = (selectedStrike - currentPrice) * sharesOwned + totalPremium
      maxLoss = (currentPrice * sharesOwned) - totalPremium // If stock goes to 0
      breakeven = currentPrice - premium
      annualizedReturn = (totalPremium / (currentPrice * sharesOwned)) * (365 / daysToExpiry) * 100
    } else if (strategy === 'cash_secured_put') {
      // Cash Secured Put: Sell 1 put + hold cash
      const totalPremium = premium * sharesOwned
      maxProfit = totalPremium
      maxLoss = (selectedStrike * sharesOwned) - totalPremium // If stock goes to 0
      breakeven = selectedStrike - premium
      annualizedReturn = (totalPremium / (selectedStrike * sharesOwned)) * (365 / daysToExpiry) * 100
    }

    setResult({
      premium,
      maxProfit,
      maxLoss,
      breakeven,
      probability: Math.abs(option.delta || 0) * 100, // Simplified probability
      annualizedReturn,
      daysToExpiry
    })
  }

  const getAvailableStrikes = () => {
    const expiryOptions = optionsData.filter(opt => opt.expiry === selectedExpiry)
    
    if (strategy === 'covered_call') {
      return expiryOptions
        .filter(opt => opt.option_type === 'call' && opt.strike >= currentPrice)
        .map(opt => opt.strike)
        .sort((a, b) => a - b)
    } else {
      return expiryOptions
        .filter(opt => opt.option_type === 'put' && opt.strike <= currentPrice)
        .map(opt => opt.strike)
        .sort((a, b) => b - a)
    }
  }

  const expiries = [...new Set(optionsData.map(opt => opt.expiry))].sort()
  const availableStrikes = getAvailableStrikes()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mstr-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading calculator...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">MSTR Options Calculator</h1>
        <p className="text-gray-400">
          Calculate potential profits and analyze risk for options strategies
        </p>
      </div>

      {/* Current MSTR Info */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-400">Current MSTR Price</p>
            <p className="text-2xl font-bold text-mstr-500">${mstrData?.price.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">IV Rank (30d)</p>
            <p className="text-2xl font-bold text-yellow-400">{mstrData?.iv_30d?.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Market Cap</p>
            <p className="text-2xl font-bold">{formatCurrency(mstrData?.market_cap || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">NAV Premium</p>
            <p className={`text-2xl font-bold ${(mstrData?.nav_premium || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(mstrData?.nav_premium || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Inputs */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Calculator className="h-6 w-6" />
            <span>Strategy Calculator</span>
          </h3>
          
          <div className="space-y-6">
            {/* Strategy Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as Strategy)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-mstr-500"
              >
                <option value="covered_call">Covered Call</option>
                <option value="cash_secured_put">Cash Secured Put</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {strategy === 'covered_call' 
                  ? 'Own shares + sell call option for income' 
                  : 'Sell put option to potentially buy shares at lower price'
                }
              </p>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium mb-2">Expiration Date</label>
              <select
                value={selectedExpiry}
                onChange={(e) => setSelectedExpiry(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-mstr-500"
              >
                {expiries.map(expiry => (
                  <option key={expiry} value={expiry}>
                    {new Date(expiry).toLocaleDateString()} 
                    ({Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                  </option>
                ))}
              </select>
            </div>

            {/* Strike Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Strike Price</label>
              <select
                value={selectedStrike}
                onChange={(e) => setSelectedStrike(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-mstr-500"
              >
                {availableStrikes.map(strike => {
                  const option = optionsData.find(
                    opt => opt.strike === strike && 
                           opt.expiry === selectedExpiry && 
                           opt.option_type === (strategy === 'covered_call' ? 'call' : 'put')
                  )
                  const premium = option ? ((option.bid || 0) + (option.ask || 0)) / 2 : 0
                  return (
                    <option key={strike} value={strike}>
                      ${strike} (Premium: ${premium.toFixed(2)})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {strategy === 'covered_call' ? 'Shares Owned' : 'Contracts to Sell'}
              </label>
              <input
                type="number"
                value={sharesOwned}
                onChange={(e) => setSharesOwned(Number(e.target.value))}
                min="100"
                step="100"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-mstr-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Each option contract represents 100 shares
              </p>
            </div>

            {/* Current Price Override */}
            <div>
              <label className="block text-sm font-medium mb-2">Current Stock Price</label>
              <input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Number(e.target.value))}
                step="0.01"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-mstr-500"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span>Strategy Analysis</span>
          </h3>
          
          {result ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">Premium Collected</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.premium * sharesOwned)}</p>
                  <p className="text-xs text-gray-400">${result.premium.toFixed(2)} per share</p>
                </div>
                
                <div className="p-4 bg-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-400">Annualized Return</p>
                  <p className="text-2xl font-bold">{result.annualizedReturn.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">If held to expiration</p>
                </div>
                
                <div className="p-4 bg-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-400">Max Profit</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.maxProfit)}</p>
                  <p className="text-xs text-gray-400">
                    {strategy === 'covered_call' ? 'If expires above strike' : 'If expires above strike'}
                  </p>
                </div>
                
                <div className="p-4 bg-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">Max Loss</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.maxLoss)}</p>
                  <p className="text-xs text-gray-400">If stock goes to $0</p>
                </div>
              </div>

              {/* Breakeven and Probability */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">Breakeven Price</p>
                  <p className="text-xl font-bold">${result.breakeven.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {((result.breakeven - currentPrice) / currentPrice * 100).toFixed(1)}% from current
                  </p>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400">Probability of Profit</p>
                  <p className="text-xl font-bold">{result.probability.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Based on delta</p>
                </div>
              </div>

              {/* Time Decay */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Days to Expiration</span>
                  <span className="font-bold">{result.daysToExpiry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Daily Time Decay</span>
                  <span className="font-bold">${(result.premium * sharesOwned / result.daysToExpiry).toFixed(2)}</span>
                </div>
              </div>

              {/* Strategy Description */}
              <div className="p-4 bg-mstr-500/10 rounded-lg border border-mstr-500/30">
                <h4 className="font-semibold mb-2">Strategy Summary</h4>
                <p className="text-sm text-gray-400">
                  {strategy === 'covered_call' ? (
                    <>You own {sharesOwned} shares of MSTR and sell a ${selectedStrike} call option. 
                    You collect ${(result.premium * sharesOwned).toFixed(2)} in premium. 
                    If MSTR stays below ${selectedStrike}, you keep the premium and your shares.</>
                  ) : (
                    <>You sell a ${selectedStrike} put option and collect ${(result.premium * sharesOwned).toFixed(2)} in premium. 
                    If MSTR stays above ${selectedStrike}, you keep the premium. 
                    If it falls below, you'll be assigned shares at ${selectedStrike}.</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select parameters to calculate strategy</p>
            </div>
          )}
        </div>
      </div>

      {/* Educational Notes */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Strategy Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Covered Call Strategy</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Generate income from stock you already own</li>
              <li>• Best in sideways to moderately bullish markets</li>
              <li>• Limited upside if stock rises above strike</li>
              <li>• Reduces cost basis of your position</li>
              <li>• Consider rolling up and out if threatened</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-blue-400 mb-2">Cash Secured Put Strategy</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Get paid while waiting to buy stock</li>
              <li>• Effectively lowers your purchase price</li>
              <li>• Must have cash to buy 100 shares</li>
              <li>• Best when IV is high (good premium)</li>
              <li>• Consider strike price you'd be happy owning at</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}