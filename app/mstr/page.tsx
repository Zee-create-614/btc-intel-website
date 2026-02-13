'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Calculator, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { getMSTRData, getMSTROptions, getBTCPrice, getTreasuryHoldings, formatCurrency, formatNumber, formatPercent } from '../lib/data'
import type { MSTRStockData, OptionData, BTCPriceData, TreasuryHolding } from '../lib/data'

export default function MSTRPage() {
  const [mstrData, setMstrData] = useState<MSTRStockData | null>(null)
  const [optionsData, setOptionsData] = useState<OptionData[]>([])
  const [btcPrice, setBtcPrice] = useState<BTCPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedExpiry, setSelectedExpiry] = useState<string>('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [mstr, options, btc, holdings] = await Promise.all([
          getMSTRData(),
          getMSTROptions(),
          getBTCPrice(),
          getTreasuryHoldings()
        ])
        
        setMstrData(mstr)
        setOptionsData(options)
        setBtcPrice(btc)
        
        // Set default expiry to the first available
        const expiries = [...new Set(options.map(opt => opt.expiry))].sort()
        if (expiries.length > 0) {
          setSelectedExpiry(expiries[0])
        }
      } catch (error) {
        console.error('Error fetching MSTR data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const expiries = [...new Set(optionsData.map(opt => opt.expiry))].sort()
  const filteredOptions = optionsData.filter(opt => opt.expiry === selectedExpiry)
  const calls = filteredOptions.filter(opt => opt.option_type === 'call').sort((a, b) => a.strike - b.strike)
  const puts = filteredOptions.filter(opt => opt.option_type === 'put').sort((a, b) => a.strike - b.strike)

  const getIVColor = (iv?: number) => {
    if (!iv) return 'text-gray-400'
    if (iv > 1.0) return 'text-red-400'
    if (iv > 0.8) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getDeltaColor = (delta?: number) => {
    if (!delta) return 'text-gray-400'
    const absDelta = Math.abs(delta)
    if (absDelta > 0.7) return 'text-red-400'
    if (absDelta > 0.3) return 'text-yellow-400'
    return 'text-green-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mstr-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading MSTR data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-mstr-500">MSTR Analytics Dashboard</h1>
          <p className="text-gray-400">
            MicroStrategy options analytics, volatility, and NAV tracking
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            href="/mstr/calculator"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Calculator className="h-4 w-4" />
            <span>Options Calculator</span>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card glow-mstr">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">MSTR Price</p>
              <p className="text-3xl font-bold text-mstr-500">
                ${mstrData?.price?.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-gray-400">
                Market Cap: {formatCurrency(mstrData?.market_cap || 0)}
              </p>
            </div>
            <Activity className="h-12 w-12 text-mstr-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">30D IV Percentile</p>
              <p className={`text-3xl font-bold ${getIVColor((mstrData?.iv_30d || 0) / 100)}`}>
                {mstrData?.iv_30d?.toFixed(1) || "0.0"}%
              </p>
              <p className="text-sm text-gray-400">
                90D: {mstrData?.iv_90d?.toFixed(1) || "0.0"}%
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">NAV Premium</p>
              <p className={`text-3xl font-bold ${(mstrData?.nav_premium || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(mstrData?.nav_premium || 0)}
              </p>
              <p className="text-sm text-gray-400">vs BTC holdings</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-400" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">BTC Correlation</p>
              <p className="text-3xl font-bold text-bitcoin-500">
                {btcPrice && formatCurrency(btcPrice.price_usd)}
              </p>
              <p className={`text-sm ${(btcPrice?.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(btcPrice?.change_24h || 0)} 24h
              </p>
            </div>
            <Activity className="h-12 w-12 text-bitcoin-500" />
          </div>
        </div>
      </div>

      {/* IV Percentiles Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold mb-6">Implied Volatility Percentiles</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span>30 Days</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-mstr-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((mstrData?.iv_30d || 0), 100)}%` }}
                  ></div>
                </div>
                <span className={`font-bold ${getIVColor((mstrData?.iv_30d || 0) / 100)}`}>
                  {mstrData?.iv_30d?.toFixed(1) || "0.0"}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span>60 Days</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-mstr-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((mstrData?.iv_60d || 0), 100)}%` }}
                  ></div>
                </div>
                <span className={`font-bold ${getIVColor((mstrData?.iv_60d || 0) / 100)}`}>
                  {mstrData?.iv_60d?.toFixed(1) || "0.0"}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span>90 Days</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-mstr-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((mstrData?.iv_90d || 0), 100)}%` }}
                  ></div>
                </div>
                <span className={`font-bold ${getIVColor((mstrData?.iv_90d || 0) / 100)}`}>
                  {mstrData?.iv_90d?.toFixed(1) || "0.0"}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <span>252 Days (1Y)</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-mstr-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((mstrData?.iv_252d || 0), 100)}%` }}
                  ></div>
                </div>
                <span className={`font-bold ${getIVColor((mstrData?.iv_252d || 0) / 100)}`}>
                  {mstrData?.iv_252d?.toFixed(1) || "0.0"}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-6">NAV Analysis</h3>
          <div className="space-y-4">
            <div className="text-center p-6 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Current Premium/Discount</p>
              <p className={`text-4xl font-bold ${(mstrData?.nav_premium || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(mstrData?.nav_premium || 0)}
              </p>
              <p className="text-gray-500 mt-2">
                {(mstrData?.nav_premium || 0) >= 0 ? 'Premium to NAV' : 'Discount to NAV'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400">MSTR Market Cap</p>
                <p className="font-bold">{formatCurrency(mstrData?.market_cap || 0)}</p>
              </div>
              <div className="p-4 bg-gray-800 rounded">
                <p className="text-sm text-gray-400">BTC Holdings Value</p>
                <p className="font-bold">
                  {btcPrice && formatCurrency(190000 * btcPrice.price_usd)}
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-800 rounded">
              <p className="text-sm text-gray-400 mb-2">Premium/Discount History</p>
              <p className="text-xs text-gray-500">
                Historical tracking shows MSTR typically trades at 10-30% premium during bull markets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Options Chain */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Options Chain</h3>
          <select
            value={selectedExpiry}
            onChange={(e) => setSelectedExpiry(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-mstr-500"
          >
            {expiries.map(expiry => (
              <option key={expiry} value={expiry}>
                {new Date(expiry).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calls */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-green-400">Calls</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2 text-xs text-gray-400 font-medium">
                <span>Strike</span>
                <span>Bid</span>
                <span>Ask</span>
                <span>Vol</span>
                <span>OI</span>
                <span>IV</span>
                <span>Delta</span>
              </div>
              {calls.map((call, index) => {
                const isATM = mstrData && Math.abs(call.strike - mstrData.price) < 5
                return (
                  <div 
                    key={index}
                    className={`grid grid-cols-7 gap-2 text-sm p-2 rounded ${
                      isATM ? 'bg-mstr-500/20' : 'bg-gray-800/50'
                    }`}
                  >
                    <span className="font-bold">${call.strike}</span>
                    <span>{call.bid?.toFixed(2) || '-'}</span>
                    <span>{call.ask?.toFixed(2) || '-'}</span>
                    <span>{call.volume || 0}</span>
                    <span>{call.open_interest || 0}</span>
                    <span className={getIVColor(call.implied_volatility)}>
                      {call.implied_volatility ? `${(call.implied_volatility * 100).toFixed(0)}%` : '-'}
                    </span>
                    <span className={getDeltaColor(call.delta)}>
                      {call.delta?.toFixed(2) || '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Puts */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-red-400">Puts</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2 text-xs text-gray-400 font-medium">
                <span>Strike</span>
                <span>Bid</span>
                <span>Ask</span>
                <span>Vol</span>
                <span>OI</span>
                <span>IV</span>
                <span>Delta</span>
              </div>
              {puts.map((put, index) => {
                const isATM = mstrData && Math.abs(put.strike - mstrData.price) < 5
                return (
                  <div 
                    key={index}
                    className={`grid grid-cols-7 gap-2 text-sm p-2 rounded ${
                      isATM ? 'bg-mstr-500/20' : 'bg-gray-800/50'
                    }`}
                  >
                    <span className="font-bold">${put.strike}</span>
                    <span>{put.bid?.toFixed(2) || '-'}</span>
                    <span>{put.ask?.toFixed(2) || '-'}</span>
                    <span>{put.volume || 0}</span>
                    <span>{put.open_interest || 0}</span>
                    <span className={getIVColor(put.implied_volatility)}>
                      {put.implied_volatility ? `${(put.implied_volatility * 100).toFixed(0)}%` : '-'}
                    </span>
                    <span className={getDeltaColor(put.delta)}>
                      {put.delta?.toFixed(2) || '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Greeks Summary */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6">Options Greeks Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-400 mb-2">Avg Call Delta</p>
            <p className="text-2xl font-bold text-green-400">
              {calls.length > 0 
                ? (calls.reduce((sum, call) => sum + (call.delta || 0), 0) / calls.length).toFixed(2)
                : '0.00'
              }
            </p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-400 mb-2">Avg Put Delta</p>
            <p className="text-2xl font-bold text-red-400">
              {puts.length > 0 
                ? (puts.reduce((sum, put) => sum + (put.delta || 0), 0) / puts.length).toFixed(2)
                : '0.00'
              }
            </p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-400 mb-2">Total Call Volume</p>
            <p className="text-2xl font-bold">
              {calls.reduce((sum, call) => sum + (call.volume || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded">
            <p className="text-sm text-gray-400 mb-2">Total Put Volume</p>
            <p className="text-2xl font-bold">
              {puts.reduce((sum, put) => sum + (put.volume || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}