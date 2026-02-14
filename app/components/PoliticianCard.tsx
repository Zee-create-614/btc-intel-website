'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, User, MapPin, Building } from 'lucide-react'

function PoliticianImg({ src, alt, initials, party }: { src: string; alt: string; initials: string; party: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg border-2 border-gray-600 ${
        party === 'R' ? 'bg-red-600' : party === 'D' ? 'bg-blue-600' : 'bg-purple-600'
      }`}>{initials}</div>
    )
  }
  return <img src={src} alt={alt} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" onError={() => setFailed(true)} />
}

interface PoliticianCardProps {
  politician: {
    name: string
    party: 'R' | 'D' | 'I'
    chamber: string
    state: string
    total_trades: number
    avg_return_pct: number | null
    best_trade_pct: number | null
    top_tickers: string[]
    photoUrl?: string
  }
}

export default function PoliticianCard({ politician }: PoliticianCardProps) {
  const partyColors = {
    R: 'from-red-500/20 to-red-600/10 border-red-500/30',
    D: 'from-blue-500/20 to-blue-600/10 border-blue-500/30', 
    I: 'from-purple-500/20 to-purple-600/10 border-purple-500/30'
  }
  
  const partyTextColors = {
    R: 'text-red-400',
    D: 'text-blue-400',
    I: 'text-purple-400'
  }

  const getReturnColor = (returnPct: number | null) => {
    if (!returnPct) return 'text-gray-400'
    if (returnPct > 20) return 'text-green-400'
    if (returnPct > 0) return 'text-green-300'
    if (returnPct < -10) return 'text-red-400'
    return 'text-red-300'
  }

  const formatReturn = (returnPct: number | null) => {
    if (!returnPct) return 'N/A'
    return `${returnPct > 0 ? '+' : ''}${returnPct.toFixed(1)}%`
  }

  // Generate avatar if no photo
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const Avatar = () => {
    if (politician.photoUrl) {
      return (
        <PoliticianImg src={politician.photoUrl} alt={politician.name} initials={getInitials(politician.name)} party={politician.party} />
      )
    }
    
    return (
      <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg ${
        politician.party === 'R' ? 'bg-red-600' : 
        politician.party === 'D' ? 'bg-blue-600' : 
        'bg-purple-600'
      }`}>
        {getInitials(politician.name)}
      </div>
    )
  }

  return (
    <Link href={`/politicians/${encodeURIComponent(politician.name)}`}>
      <div className={`bg-gradient-to-br ${partyColors[politician.party]} border rounded-lg p-6 hover:bg-gray-800/50 transition-all duration-200 hover:scale-105 cursor-pointer h-full`}>
        {/* Header with Photo and Basic Info */}
        <div className="flex items-start space-x-4 mb-4">
          <Avatar />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-white truncate">{politician.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span className={`font-bold ${partyTextColors[politician.party]}`}>
                {politician.party === 'R' ? 'Republican' : politician.party === 'D' ? 'Democrat' : 'Independent'}
              </span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Building className="h-3 w-3" />
                <span>{politician.chamber}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-400 mt-1">
              <MapPin className="h-3 w-3" />
              <span>{politician.state}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{politician.total_trades}</p>
            <p className="text-xs text-gray-400">Total Trades</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${getReturnColor(politician.avg_return_pct)}`}>
              {formatReturn(politician.avg_return_pct)}
            </p>
            <p className="text-xs text-gray-400">Avg Return</p>
          </div>
        </div>

        {/* Best Trade Highlight */}
        {politician.best_trade_pct && (
          <div className="bg-green-500/10 border border-green-500/20 rounded p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Best Trade</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="font-bold text-green-400">
                  {formatReturn(politician.best_trade_pct)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Holdings Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">Top Holdings</p>
          <div className="flex flex-wrap gap-1">
            {politician.top_tickers?.slice(0, 3).map((ticker, index) => (
              <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                {ticker}
              </span>
            ))}
            {politician.top_tickers?.length > 3 && (
              <span className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-400">
                +{politician.top_tickers.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Performance</span>
            <div className="flex items-center space-x-1">
              {politician.avg_return_pct && politician.avg_return_pct > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-medium">Outperforming</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-medium">Underperforming</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}