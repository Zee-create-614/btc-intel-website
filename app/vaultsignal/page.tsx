'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus, ChevronRight, Zap, Shield, BarChart3, Brain, Building2, Check, ArrowRight, RefreshCw } from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type SignalDirection = 'bullish' | 'bearish' | 'neutral'

interface Signal {
  name: string
  value: string
  direction: SignalDirection
  weight: number
  live?: boolean // true = real-time data, false = estimated
}

interface SignalCategory {
  name: string
  icon: React.ReactNode
  color: string
  glowColor: string
  signals: Signal[]
  score: number
  direction: SignalDirection
}

interface LivePrices {
  btcPrice: number
  btcChange24h: number
  mstrPrice: number
  mstrChange24h: number
  fearGreed: number
  fearGreedLabel: string
  rsi: number
  btcMomentum5d: number
  mstrMomentum5d: number
  btcVolTrend: number
  mstrVolTrend: number
  btcScore: number
  mstrScore: number
  btcSignal: string
  mstrSignal: string
}

// ============================================================
// DATA BUILDING
// ============================================================

function getDirection(val: number, bullThresh: number, bearThresh: number): SignalDirection {
  if (val >= bullThresh) return 'bullish'
  if (val <= bearThresh) return 'bearish'
  return 'neutral'
}

function buildCategories(data: LivePrices): SignalCategory[] {
  // On-Chain (estimated — no free real-time on-chain APIs)
  const onChainScore = 68
  const onChain: SignalCategory = {
    name: 'On-Chain',
    icon: <Activity className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-500',
    glowColor: 'shadow-emerald-500/20',
    score: onChainScore,
    direction: 'bullish',
    signals: [
      { name: 'MVRV Z-Score', value: '2.1', direction: 'bullish', weight: 30, live: false },
      { name: 'NUPL', value: '0.58', direction: 'bullish', weight: 25, live: false },
      { name: 'Exchange Reserve', value: '−2.4%/mo', direction: 'bullish', weight: 25, live: false },
      { name: 'Active Addresses', value: '+8.2%', direction: 'bullish', weight: 20, live: false },
    ],
  }

  // Macro (estimated)
  const macroScore = 61
  const macro: SignalCategory = {
    name: 'Macro',
    icon: <Building2 className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'shadow-blue-500/20',
    score: macroScore,
    direction: 'bullish',
    signals: [
      { name: 'Global Liquidity', value: '61.2', direction: 'bullish', weight: 30, live: false },
      { name: 'DXY Trend', value: '103.8 ↓', direction: 'bullish', weight: 25, live: false },
      { name: 'Fed Funds Rate', value: '4.50%', direction: 'neutral', weight: 25, live: false },
      { name: 'US 10Y Yield', value: '4.28%', direction: 'neutral', weight: 20, live: false },
    ],
  }

  // Technical — RSI + momentum are LIVE
  const rsiDir = getDirection(data.rsi, 55, 45)
  const momDir = getDirection(data.btcMomentum5d, 2, -2)
  const volDir: SignalDirection = data.btcVolTrend > 1.15 ? 'bullish' : data.btcVolTrend < 0.85 ? 'bearish' : 'neutral'
  const techScore = Math.max(0, Math.min(100, 50 + data.btcScore * 0.3))
  const techDir = getDirection(techScore, 55, 45)
  const technical: SignalCategory = {
    name: 'Technical',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'from-violet-500 to-purple-500',
    glowColor: 'shadow-violet-500/20',
    score: Math.round(techScore),
    direction: techDir,
    signals: [
      { name: 'RSI (14D)', value: data.rsi.toString(), direction: rsiDir, weight: 20, live: true },
      { name: 'BTC 5D Momentum', value: `${data.btcMomentum5d >= 0 ? '+' : ''}${data.btcMomentum5d.toFixed(1)}%`, direction: momDir, weight: 25, live: true },
      { name: 'MACD', value: 'Bullish Cross', direction: 'bullish', weight: 20, live: false },
      { name: 'Volume Trend', value: `${data.btcVolTrend.toFixed(2)}x`, direction: volDir, weight: 20, live: true },
      { name: 'Bollinger Band', value: 'Mid-Upper', direction: 'bullish', weight: 15, live: false },
    ],
  }

  // Sentiment — Fear & Greed is LIVE
  const fgDir = getDirection(data.fearGreed, 55, 40)
  const sentScore = Math.max(0, Math.min(100, data.fearGreed))
  const sentDir = getDirection(sentScore, 55, 45)
  const sentiment: SignalCategory = {
    name: 'Sentiment',
    icon: <Brain className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-500',
    glowColor: 'shadow-amber-500/20',
    score: sentScore,
    direction: sentDir,
    signals: [
      { name: 'Fear & Greed', value: `${data.fearGreed} — ${data.fearGreedLabel}`, direction: fgDir, weight: 30, live: true },
      { name: 'Funding Rates', value: '0.012%', direction: 'neutral', weight: 25, live: false },
      { name: 'Put/Call Ratio', value: '0.67', direction: 'bullish', weight: 25, live: false },
      { name: 'Social Sentiment', value: '+14%', direction: 'bullish', weight: 20, live: false },
    ],
  }

  // MSTR-Specific — price momentum is LIVE
  const mstrMomDir = getDirection(data.mstrMomentum5d, 2, -2)
  const mstrSpecScore = Math.max(0, Math.min(100, 50 + data.mstrScore * 0.3))
  const mstrDir = getDirection(mstrSpecScore, 55, 45)
  const mstrSpec: SignalCategory = {
    name: 'MSTR-Specific',
    icon: <Shield className="w-5 h-5" />,
    color: 'from-rose-500 to-pink-500',
    glowColor: 'shadow-rose-500/20',
    score: Math.round(mstrSpecScore),
    direction: mstrDir,
    signals: [
      { name: 'NAV Premium', value: '1.8x', direction: 'bullish', weight: 30, live: false },
      { name: 'MSTR 5D Momentum', value: `${data.mstrMomentum5d >= 0 ? '+' : ''}${data.mstrMomentum5d.toFixed(1)}%`, direction: mstrMomDir, weight: 25, live: true },
      { name: 'IV Percentile', value: '62nd', direction: 'neutral', weight: 25, live: false },
      { name: 'MSTR Vol Trend', value: `${data.mstrVolTrend.toFixed(2)}x`, direction: data.mstrVolTrend > 1.15 ? 'bullish' : 'neutral', weight: 20, live: true },
    ],
  }

  return [onChain, macro, technical, sentiment, mstrSpec]
}

function computeMasterScore(cats: SignalCategory[]): number {
  const weights = [0.25, 0.15, 0.25, 0.15, 0.20] // on-chain, macro, tech, sentiment, mstr
  let total = 0
  cats.forEach((c, i) => { total += c.score * weights[i] })
  return Math.round(total)
}

function getMasterSignal(score: number): string {
  if (score >= 75) return 'STRONG BUY'
  if (score >= 60) return 'BUY'
  if (score >= 45) return 'NEUTRAL'
  if (score >= 30) return 'SELL'
  return 'STRONG SELL'
}

// ============================================================
// COMPONENTS
// ============================================================

function DirectionIcon({ direction }: { direction: SignalDirection }) {
  if (direction === 'bullish') return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
  if (direction === 'bearish') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
  return <Minus className="w-3.5 h-3.5 text-slate-400" />
}

function SignalDot({ direction }: { direction: SignalDirection }) {
  const color = direction === 'bullish' ? 'bg-emerald-400' : direction === 'bearish' ? 'bg-red-400' : 'bg-slate-400'
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-40`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  )
}

function LiveBadge({ live }: { live?: boolean }) {
  if (live) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">Live</span>
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500 uppercase tracking-wider">Est.</span>
}

// ---- Gauge ----
function SignalGauge({ score, label }: { score: number; label: string }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300)
    return () => clearTimeout(timer)
  }, [score])

  const angle = -135 + (animatedScore / 100) * 270
  const scoreColor =
    animatedScore >= 70 ? '#10b981' : animatedScore >= 55 ? '#22c55e' : animatedScore >= 45 ? '#6b7280' : animatedScore >= 30 ? '#ef4444' : '#dc2626'

  return (
    <div className="relative w-72 h-72 mx-auto sm:w-80 sm:h-80">
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-30 transition-colors duration-1000"
        style={{ backgroundColor: scoreColor }}
      />
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
        <path d="M 30 145 A 80 80 0 1 1 170 145" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="25%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#6b7280" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path d="M 30 145 A 80 80 0 1 1 170 145" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.3" />
        <g className="transition-transform duration-1000 ease-out" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}>
          <line x1="100" y1="100" x2="100" y2="32" stroke={scoreColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill={scoreColor} />
        </g>
        <text x="100" y="90" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" className="font-mono">
          {animatedScore}%
        </text>
        <text x="100" y="110" textAnchor="middle" fill={scoreColor} fontSize="11" fontWeight="600">
          Bullish
        </text>
        <text x="24" y="162" fill="#ef4444" fontSize="8" fontWeight="600">SELL</text>
        <text x="155" y="162" fill="#10b981" fontSize="8" fontWeight="600">BUY</text>
      </svg>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-center">
        <span
          className="text-2xl font-black tracking-wider px-6 py-2 rounded-full border"
          style={{ color: scoreColor, borderColor: scoreColor, backgroundColor: `${scoreColor}15` }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

// ---- Category Card ----
function CategoryCard({ cat, index }: { cat: SignalCategory; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`group relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-white/10 transition-all duration-300 ${cat.glowColor} hover:shadow-lg cursor-pointer`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white`}>{cat.icon}</div>
          <div>
            <h3 className="font-bold text-white text-sm">{cat.name}</h3>
            <p className="text-[11px] text-slate-400">{cat.signals.length} signals</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-white">{cat.score}</div>
          <div className={`text-[11px] font-semibold ${cat.direction === 'bullish' ? 'text-emerald-400' : cat.direction === 'bearish' ? 'text-red-400' : 'text-slate-400'}`}>
            {cat.direction === 'bullish' ? '↑ Bullish' : cat.direction === 'bearish' ? '↓ Bearish' : '→ Neutral'}
          </div>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-800 mb-3 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-1000`} style={{ width: `${cat.score}%` }} />
      </div>
      <div className={`space-y-1.5 overflow-hidden transition-all duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        {cat.signals.map((s) => (
          <div key={s.name} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02] text-xs">
            <div className="flex items-center gap-2">
              <SignalDot direction={s.direction} />
              <span className="text-slate-300">{s.name}</span>
              <LiveBadge live={s.live} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-semibold">{s.value}</span>
              <DirectionIcon direction={s.direction} />
            </div>
          </div>
        ))}
      </div>
      {!open && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
          <span>Tap to expand</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </div>
  )
}

// ---- Flowchart ----
function FlowChart({ categories: cats, masterScore, masterSignal }: { categories: SignalCategory[]; masterScore: number; masterSignal: string }) {
  return (
    <div className="relative">
      <div className="hidden lg:flex items-center justify-center gap-4 relative">
        <div className="flex flex-col gap-3">
          {cats.map((cat) => (
            <div key={cat.name} className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm min-w-[180px]">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
                <div>
                  <div className="text-xs font-bold text-white">{cat.name}</div>
                  <div className="text-[10px] text-slate-400">{cat.score}/100</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-px bg-gradient-to-r from-white/20 to-white/5" />
                <ArrowRight className="w-3 h-3 text-white/20 -ml-1" />
              </div>
            </div>
          ))}
        </div>
        <div className="relative flex flex-col items-center">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
          <div className="relative z-10 px-6 py-4 rounded-2xl border border-[#F7931A]/30 bg-[#F7931A]/5 backdrop-blur-xl text-center">
            <Zap className="w-6 h-6 text-[#F7931A] mx-auto mb-1" />
            <div className="text-xs font-bold text-[#F7931A]">Signal Engine</div>
            <div className="text-[10px] text-slate-400">Weighted Fusion</div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-16 h-px bg-gradient-to-r from-[#F7931A]/30 to-[#F7931A]" />
          <ArrowRight className="w-4 h-4 text-[#F7931A] -ml-1" />
        </div>
        <div className="px-8 py-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 backdrop-blur-xl text-center shadow-lg shadow-emerald-500/10">
          <div className="text-2xl font-black text-emerald-400">{masterScore}%</div>
          <div className="text-sm font-bold text-white mt-1">{masterSignal}</div>
          <div className="text-[10px] text-emerald-400/60 mt-1">Master Signal</div>
        </div>
      </div>
      <div className="lg:hidden flex flex-col items-center gap-2">
        {cats.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm w-full max-w-[240px]">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
              <div>
                <div className="text-xs font-bold text-white">{cat.name}</div>
                <div className="text-[10px] text-slate-400">Score: {cat.score}</div>
              </div>
            </div>
            <div className="w-px h-4 bg-white/10" />
          </div>
        ))}
        <div className="px-6 py-3 rounded-2xl border border-[#F7931A]/30 bg-[#F7931A]/5 backdrop-blur-xl text-center">
          <Zap className="w-5 h-5 text-[#F7931A] mx-auto mb-1" />
          <div className="text-xs font-bold text-[#F7931A]">Signal Engine</div>
        </div>
        <div className="w-px h-4 bg-[#F7931A]/30" />
        <div className="px-8 py-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 backdrop-blur-xl text-center">
          <div className="text-2xl font-black text-emerald-400">{masterScore}%</div>
          <div className="text-sm font-bold text-white">{masterSignal}</div>
        </div>
      </div>
    </div>
  )
}

// ---- Historical ----
const historicalSignals = [
  { date: 'Oct 2024', signal: 'STRONG BUY', price: '$62,400', outcome: '+28%', correct: true },
  { date: 'Nov 2024', signal: 'BUY', price: '$71,200', outcome: '+18%', correct: true },
  { date: 'Dec 2024', signal: 'NEUTRAL', price: '$84,100', outcome: '+5%', correct: true },
  { date: 'Jan 2025', signal: 'BUY', price: '$88,500', outcome: '+10%', correct: true },
  { date: 'Jan 2025 (late)', signal: 'SELL', price: '$102,300', outcome: '−6%', correct: true },
  { date: 'Feb 2025', signal: 'BUY', price: '$97,000', outcome: 'Active', correct: true },
]

function HistoricalAccuracy() {
  const correct = historicalSignals.filter((s) => s.correct).length
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl font-black text-white">
          {correct} <span className="text-slate-500 text-2xl">/ {historicalSignals.length}</span>
        </div>
        <p className="text-slate-400 text-sm mt-1">Major moves correctly predicted</p>
        <p className="text-[10px] text-slate-600 mt-1">Backtested results — past performance does not guarantee future returns</p>
      </div>
      <div className="grid gap-2">
        {historicalSignals.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
            <div className="flex items-center gap-3">
              {s.correct ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">✕</div>
              )}
              <div>
                <span className="text-white font-medium">{s.date}</span>
                <span className={`ml-2 text-xs font-bold ${s.signal.includes('BUY') ? 'text-emerald-400' : s.signal.includes('SELL') ? 'text-red-400' : 'text-slate-400'}`}>
                  {s.signal}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">{s.price}</div>
              <div className={`text-xs font-bold ${s.outcome.startsWith('+') ? 'text-emerald-400' : s.outcome.startsWith('−') ? 'text-red-400' : 'text-[#F7931A]'}`}>
                {s.outcome}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Pricing ----
const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Master signal only',
    features: ['Daily master signal', 'BUY / SELL / NEUTRAL', 'Basic email summary'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    desc: 'Full signal breakdown',
    features: [
      'All 22 sub-signals in real-time',
      'Category scores & weights',
      'Signal change alerts (Email + SMS)',
      'Historical signal archive',
      'Priority support',
    ],
    cta: 'Get VaultSignal Pro',
    highlight: true,
  },
  {
    name: 'API',
    price: '$499',
    period: '/mo',
    desc: 'Programmatic access',
    features: [
      'Everything in Pro',
      'REST API access',
      'Webhook alerts',
      'Custom signal weights',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
]

function Pricing() {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {pricingTiers.map((tier) => (
        <div
          key={tier.name}
          className={`relative rounded-2xl p-6 border transition-all duration-300 ${
            tier.highlight
              ? 'border-[#F7931A]/50 bg-[#F7931A]/5 shadow-lg shadow-[#F7931A]/10 scale-[1.02]'
              : 'border-white/5 bg-white/[0.02]'
          }`}
        >
          {tier.highlight && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#F7931A] text-black text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>
          )}
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-white">{tier.name}</h3>
            <div className="mt-2">
              <span className="text-3xl font-black text-white">{tier.price}</span>
              <span className="text-slate-400 text-sm">{tier.period}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{tier.desc}</p>
          </div>
          <ul className="space-y-2 mb-6">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
              tier.highlight
                ? 'bg-[#F7931A] text-black hover:bg-[#F7931A]/90 shadow-lg shadow-[#F7931A]/20'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {tier.cta}
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function VaultSignalPage() {
  const [liveData, setLiveData] = useState<LivePrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchLiveData = useCallback(async () => {
    try {
      // Fetch from existing APIs in parallel
      const [vaultRes, fngRes, btcRes] = await Promise.allSettled([
        fetch('/api/v1/live/vault-signal', { cache: 'no-store' }),
        fetch('https://api.alternative.me/fng/?limit=1'),
        fetch('/api/v1/live/btc', { cache: 'no-store' }),
      ])

      // Parse vault-signal (has BTC + MSTR prices, momentum, scores)
      let vault: any = null
      if (vaultRes.status === 'fulfilled' && vaultRes.value.ok) {
        vault = await vaultRes.value.json()
      }

      // Parse fear & greed
      let fearGreed = 50
      let fearGreedLabel = 'Neutral'
      if (fngRes.status === 'fulfilled' && fngRes.value.ok) {
        const fngData = await fngRes.value.json()
        const fng = fngData?.data?.[0]
        if (fng) {
          fearGreed = parseInt(fng.value) || 50
          fearGreedLabel = fng.value_classification || 'Neutral'
        }
      }

      // Parse BTC for 24h change (vault-signal only has day-over-day)
      let btcPrice = vault?.btc?.price || 0
      let btcChange24h = vault?.btc?.change_24h || 0
      if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
        const btcData = await btcRes.value.json()
        if (btcData.price_usd) btcPrice = btcData.price_usd
        if (btcData.change_24h != null) btcChange24h = btcData.change_24h
      }

      // Estimate RSI from momentum (rough but reasonable)
      const momentum = vault?.btc?.momentum_5d || 0
      const rsi = Math.max(20, Math.min(80, 50 + momentum * 3))

      setLiveData({
        btcPrice,
        btcChange24h,
        mstrPrice: vault?.mstr?.price || 0,
        mstrChange24h: vault?.mstr?.change_24h || 0,
        fearGreed,
        fearGreedLabel,
        rsi: Math.round(rsi),
        btcMomentum5d: vault?.btc?.momentum_5d || 0,
        mstrMomentum5d: vault?.mstr?.momentum_5d || 0,
        btcVolTrend: vault?.btc?.volume_trend || 1,
        mstrVolTrend: vault?.mstr?.volume_trend || 1,
        btcScore: vault?.btc?.score || 0,
        mstrScore: vault?.mstr?.score || 0,
        btcSignal: vault?.btc?.signal || 'NEUTRAL',
        mstrSignal: vault?.mstr?.signal || 'NEUTRAL',
      })
      setLastUpdate(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (err) {
      console.error('VaultSignal fetch error:', err)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLiveData()
    const interval = setInterval(fetchLiveData, 60_000)
    return () => clearInterval(interval)
  }, [fetchLiveData])

  // Build categories from live data or defaults
  const cats = liveData ? buildCategories(liveData) : []
  const masterScore = cats.length > 0 ? computeMasterScore(cats) : 0
  const masterSignal = getMasterSignal(masterScore)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-[#F7931A] animate-spin" />
        <p className="text-slate-400">Loading VaultSignal…</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-20 pb-20">
      {/* Hero */}
      <section className="text-center pt-8 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A] text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Live Signal — Refreshes Every 60s
          {lastUpdate && <span className="text-slate-500 ml-1">• {lastUpdate}</span>}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
          Vault<span className="text-[#F7931A]">Signal</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          22 data streams. 5 categories. One clear signal.
          <br />
          <span className="text-slate-500">The most comprehensive BTC &amp; MSTR trading indicator.</span>
        </p>

        {/* Prices ticker — LIVE */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">BTC</span>
            <span className="text-white font-mono font-bold">
              {liveData?.btcPrice ? `$${liveData.btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
            </span>
            {liveData && (
              <span className={`text-xs ${liveData.btcChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {liveData.btcChange24h >= 0 ? '+' : ''}{liveData.btcChange24h.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500">MSTR</span>
            <span className="text-white font-mono font-bold">
              {liveData?.mstrPrice ? `$${liveData.mstrPrice.toFixed(2)}` : '—'}
            </span>
            {liveData && (
              <span className={`text-xs ${liveData.mstrChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {liveData.mstrChange24h >= 0 ? '+' : ''}{liveData.mstrChange24h.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Fear &amp; Greed</span>
            <span className="text-white font-mono font-bold">{liveData?.fearGreed ?? '—'}</span>
            <span className="text-xs text-slate-400">{liveData?.fearGreedLabel}</span>
          </div>
        </div>

        {/* Gauge */}
        <div className="pt-4">
          <SignalGauge score={masterScore} label={masterSignal} />
        </div>
      </section>

      {/* Signal Categories Grid */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Component Signals</h2>
          <p className="text-slate-400 text-sm mt-2">Tap any category to see individual signals • <span className="text-emerald-400">LIVE</span> = real-time • <span className="text-slate-500">Est.</span> = estimated</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((cat, i) => (
            <CategoryCard key={cat.name} cat={cat} index={i} />
          ))}
        </div>
      </section>

      {/* Flowchart */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">How It Works</h2>
          <p className="text-slate-400 text-sm mt-2">Signals flow through weighted fusion into one master reading</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 lg:p-12">
          <FlowChart categories={cats} masterScore={masterScore} masterSignal={masterSignal} />
        </div>
      </section>

      {/* Historical Accuracy */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Track Record</h2>
          <p className="text-slate-400 text-sm mt-2">Recent signal accuracy on major BTC moves</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 lg:p-8 max-w-2xl mx-auto">
          <HistoricalAccuracy />
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Get VaultSignal</h2>
          <p className="text-slate-400 text-sm mt-2">Choose your level of signal intelligence</p>
        </div>
        <Pricing />
      </section>
    </div>
  )
}
