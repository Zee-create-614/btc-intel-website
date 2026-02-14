import { Bitcoin, TrendingUp, DollarSign, Activity } from 'lucide-react'
import Link from 'next/link'
import LiveMSTRAnalytics from './components/LiveMSTRAnalytics'
import LiveDashboard from './components/LiveDashboard'

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
      
      {/* 100% LIVE DATA - Real-time metrics from APIs */}
      <LiveDashboard />
      
      {/* Live MSTR Analytics with real-time updates */}
      <LiveMSTRAnalytics />

      {/* LIVE Corporate Holdings from bitcointreasuries.net API */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Live Corporate Bitcoin Holdings</h3>
          <span className="text-xs text-slate-400">Real-time from bitcointreasuries.net</span>
        </div>
        <BitcoinTreasuriesTable />
      </div>

      {/* Bottom Action Cards */}
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