import { Bitcoin, TrendingUp, DollarSign, Activity } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-bitcoin-500 to-mstr-500 bg-clip-text text-transparent">
          Bitcoin Treasury & MSTR Intelligence
        </h1>
        <p className="text-xl text-slate-400">
          Real-time tracking of institutional Bitcoin holdings and MSTR options analytics
        </p>
      </div>
      
      {/* BETA MODE Banner */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-blue-400 font-semibold text-lg">BETA MODE</span>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-slate-400 text-sm mt-1">Platform in active development • Data feeds stabilizing • More features coming soon</p>
      </div>
      
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card glow-bitcoin">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Bitcoin Price</p>
              <div className="text-3xl font-bold text-orange-400">$66,923</div>
              <div className="text-sm text-green-400">+4.39% 24h</div>
            </div>
            <Bitcoin className="h-12 w-12 text-orange-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Institutional BTC</p>
              <div className="text-3xl font-bold text-white">1,138,075</div>
              <p className="text-sm text-slate-400">
                $76.16B total value
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">MSTR Price</p>
              <div className="text-3xl font-bold text-blue-400">$123.00</div>
              <p className="text-sm text-slate-400">
                vs BTC correlation
              </p>
            </div>
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">MSTR NAV Premium</p>
              <div className="text-3xl font-bold text-green-400">-84.00%</div>
              <p className="text-sm text-slate-400">vs BTC holdings</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* Data Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Corporate Holdings</h3>
            <span className="text-orange-400 font-mono text-sm">₿ 714,644</span>
          </div>
          <div>
            <p className="text-slate-400">BTC held by companies</p>
            <p className="text-sm text-slate-500 mt-2">
              MicroStrategy dominates with 714,644 BTC
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">ETF Holdings</h3>
            <span className="text-blue-400 font-mono text-sm">₿ 0</span>
          </div>
          <div>
            <p className="text-slate-400">BTC held by ETFs</p>
            <p className="text-sm text-slate-500 mt-2">
              ETF data coming soon
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Total Value</h3>
            <span className="text-green-400 font-mono text-sm">$76.16B</span>
          </div>
          <div>
            <p className="text-slate-400">Total institutional value</p>
            <p className="text-sm text-slate-500 mt-2">
              Combined treasury holdings
            </p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/politicians" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Politician Trading</h3>
            <div className="text-2xl font-bold text-orange-400 mb-2">96+</div>
            <p className="text-slate-400">Live trades tracked</p>
            <p className="text-sm text-slate-500 mt-2">
              Congressional stock trades with real-time alerts
            </p>
          </div>
        </Link>

        <Link href="/treasuries" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Treasury Dashboard</h3>
            <p className="text-slate-400 text-sm">
              Complete Bitcoin treasury tracking and analytics
            </p>
          </div>
        </Link>

        <Link href="/mstr" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">MSTR Analytics</h3>
            <p className="text-slate-400 text-sm">
              Advanced MicroStrategy options and NAV analysis
            </p>
          </div>
        </Link>

        <Link href="/mstr/calculator" className="card hover:bg-slate-800 transition-colors">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Options Calculator</h3>
            <p className="text-slate-400 text-sm">
              MSTR covered calls and put strategies
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}