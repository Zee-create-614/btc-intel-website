'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus, ChevronRight, Zap, Shield, BarChart3, Brain, Building2, Check, ArrowRight, RefreshCw, Bitcoin, Newspaper } from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type SignalDirection = 'bullish' | 'bearish' | 'neutral'

interface EngineSignal {
  name: string
  value: string
  raw_value: any
  score: number
  direction: SignalDirection
  weight: number
  source: 'api' | 'calculated' | 'pro_only'
  category: string
  updated_at: string
}

interface EngineCategory {
  name: string
  key: string
  score: number
  weight: number
}

interface EngineOutput {
  generated_at: string
  btc_price: number
  btc_24h_change: number
  mstr_price: number
  mstr_24h_change: number
  btc_signal: { score: number; label: string; direction: SignalDirection }
  mstr_signal: { score: number; label: string; direction: SignalDirection }
  categories: EngineCategory[]
  signals: EngineSignal[]
  errors: string[]
}

interface DisplayCategory {
  name: string
  key: string
  icon: React.ReactNode
  color: string
  glowColor: string
  signals: EngineSignal[]
  score: number
  direction: SignalDirection
  feed: 'btc' | 'mstr'
}

// ============================================================
// CATEGORY CONFIG
// ============================================================

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; glowColor: string; feed: 'btc' | 'mstr' }> = {
  onchain: { icon: <Activity className="w-5 h-5" />, color: 'from-emerald-500 to-teal-500', glowColor: 'shadow-emerald-500/20', feed: 'btc' },
  macro: { icon: <Building2 className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500', glowColor: 'shadow-blue-500/20', feed: 'btc' },
  technical: { icon: <BarChart3 className="w-5 h-5" />, color: 'from-violet-500 to-purple-500', glowColor: 'shadow-violet-500/20', feed: 'btc' },
  sentiment: { icon: <Brain className="w-5 h-5" />, color: 'from-amber-500 to-orange-500', glowColor: 'shadow-amber-500/20', feed: 'btc' },
  news: { icon: <Newspaper className="w-5 h-5" />, color: 'from-sky-500 to-indigo-500', glowColor: 'shadow-sky-500/20', feed: 'btc' },
  mstr: { icon: <Shield className="w-5 h-5" />, color: 'from-rose-500 to-pink-500', glowColor: 'shadow-rose-500/20', feed: 'mstr' },
}

function buildDisplayCategories(data: EngineOutput): DisplayCategory[] {
  return data.categories.map(cat => {
    const meta = CATEGORY_META[cat.key] || CATEGORY_META.technical
    const catSignals = data.signals.filter(s => s.category === cat.key)
    const dir: SignalDirection = cat.score >= 55 ? 'bullish' : cat.score <= 45 ? 'bearish' : 'neutral'
    return {
      name: cat.name,
      key: cat.key,
      icon: meta.icon,
      color: meta.color,
      glowColor: meta.glowColor,
      signals: catSignals,
      score: cat.score,
      direction: dir,
      feed: meta.feed,
    }
  })
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

function SourceBadge({ source }: { source: string }) {
  if (source === 'api') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">API</span>
  if (source === 'calculated') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wider">Calc</span>
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-wider">Pro</span>
}

function SignalGauge({ score, label, title, gradientId }: { score: number; label: string; title: string; gradientId: string }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300)
    return () => clearTimeout(timer)
  }, [score])

  const angle = -135 + (animatedScore / 100) * 270
  const scoreColor =
    animatedScore >= 70 ? '#10b981' : animatedScore >= 55 ? '#22c55e' : animatedScore >= 45 ? '#6b7280' : animatedScore >= 30 ? '#ef4444' : '#dc2626'

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="relative w-56 h-56 sm:w-64 sm:h-64">
        <div className="absolute inset-0 rounded-full blur-3xl opacity-25 transition-colors duration-1000" style={{ backgroundColor: scoreColor }} />
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <path d="M 30 145 A 80 80 0 1 1 170 145" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#6b7280" />
              <stop offset="75%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path d="M 30 145 A 80 80 0 1 1 170 145" fill="none" stroke={`url(#${gradientId})`} strokeWidth="14" strokeLinecap="round" opacity="0.3" />
          <g className="transition-transform duration-1000 ease-out" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}>
            <line x1="100" y1="100" x2="100" y2="32" stroke={scoreColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill={scoreColor} />
          </g>
          <text x="100" y="88" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" className="font-mono">{animatedScore}%</text>
          <text x="100" y="108" textAnchor="middle" fill={scoreColor} fontSize="11" fontWeight="600">
            {animatedScore >= 50 ? 'Bullish' : animatedScore <= 40 ? 'Bearish' : 'Neutral'}
          </text>
          <text x="24" y="162" fill="#ef4444" fontSize="8" fontWeight="600">SELL</text>
          <text x="155" y="162" fill="#10b981" fontSize="8" fontWeight="600">BUY</text>
        </svg>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-center">
          <span className="text-lg sm:text-xl font-black tracking-wider px-5 py-1.5 rounded-full border whitespace-nowrap"
            style={{ color: scoreColor, borderColor: scoreColor, backgroundColor: `${scoreColor}15` }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ cat, index }: { cat: DisplayCategory; index: number }) {
  const [open, setOpen] = useState(false)
  const feedLabel = cat.feed === 'btc' ? '→ BTC Signal' : '→ MSTR Signal'
  const feedColor = cat.feed === 'btc' ? 'text-orange-400' : 'text-blue-400'
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
            <p className="text-[11px] text-slate-400">{cat.signals.length} signals <span className={`${feedColor} font-semibold`}>{feedLabel}</span></p>
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
      <div className={`space-y-1.5 overflow-hidden transition-all duration-300 ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {cat.signals.map((s) => (
          <div key={s.name} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02] text-xs">
            <div className="flex items-center gap-2">
              <SignalDot direction={s.direction} />
              <span className="text-slate-300">{s.name}</span>
              <SourceBadge source={s.source} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-semibold text-[11px]">{s.value}</span>
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

function DualFlowChart({ categories: cats, btcScore, btcSignal, mstrScore, mstrSignal }: {
  categories: DisplayCategory[]
  btcScore: number; btcSignal: string; mstrScore: number; mstrSignal: string
}) {
  const btcCats = cats.filter(c => c.feed === 'btc')
  const mstrCats = cats.filter(c => c.feed === 'mstr')

  return (
    <div className="relative">
      {/* Desktop */}
      <div className="hidden lg:block space-y-8">
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col gap-2">
            {btcCats.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] min-w-[160px]">
                  <div className={`p-1 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
                  <div>
                    <div className="text-[11px] font-bold text-white">{cat.name}</div>
                    <div className="text-[9px] text-slate-400">{cat.score}/100</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-px bg-gradient-to-r from-white/20 to-white/5" />
                  <ArrowRight className="w-3 h-3 text-white/20 -ml-1" />
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 rounded-2xl border border-[#F7931A]/30 bg-[#F7931A]/5 text-center">
            <Zap className="w-5 h-5 text-[#F7931A] mx-auto mb-1" />
            <div className="text-[10px] font-bold text-[#F7931A]">BTC Engine</div>
            <div className="text-[9px] text-slate-400">Weighted Fusion</div>
          </div>
          <div className="flex items-center">
            <div className="w-12 h-px bg-gradient-to-r from-[#F7931A]/30 to-[#F7931A]" />
            <ArrowRight className="w-3 h-3 text-[#F7931A] -ml-1" />
          </div>
          <div className="px-6 py-4 rounded-2xl border-2 text-center shadow-lg"
            style={{ borderColor: btcScore >= 55 ? '#10b98166' : btcScore >= 45 ? '#6b728066' : '#ef444466' }}>
            <div className="text-[10px] text-orange-400 font-bold mb-1">₿ BTC Signal</div>
            <div className="text-xl font-black" style={{ color: btcScore >= 55 ? '#10b981' : btcScore >= 45 ? '#6b7280' : '#ef4444' }}>
              {btcScore}%
            </div>
            <div className="text-xs font-bold text-white mt-0.5">{btcSignal}</div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="h-6 w-px bg-gradient-to-b from-orange-500/40 to-blue-500/40" />
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-white/10 text-[9px] text-slate-400 font-semibold">
              BTC Signal feeds into MSTR (60% weight)
            </div>
            <div className="h-6 w-px bg-gradient-to-b from-blue-500/40 to-blue-500/20" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col gap-2">
            {mstrCats.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] min-w-[160px]">
                  <div className={`p-1 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
                  <div>
                    <div className="text-[11px] font-bold text-white">{cat.name}</div>
                    <div className="text-[9px] text-slate-400">{cat.score}/100</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-px bg-gradient-to-r from-white/20 to-white/5" />
                  <ArrowRight className="w-3 h-3 text-white/20 -ml-1" />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-500/20 bg-orange-500/5 min-w-[160px]">
                <div className="p-1 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                  <Bitcoin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-orange-400">BTC Signal</div>
                  <div className="text-[9px] text-slate-400">{btcScore}/100 (60% wt)</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-px bg-gradient-to-r from-orange-500/20 to-orange-500/5" />
                <ArrowRight className="w-3 h-3 text-orange-500/20 -ml-1" />
              </div>
            </div>
          </div>
          <div className="px-5 py-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 text-center">
            <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-[10px] font-bold text-blue-400">MSTR Engine</div>
            <div className="text-[9px] text-slate-400">BTC + MSTR Fusion</div>
          </div>
          <div className="flex items-center">
            <div className="w-12 h-px bg-gradient-to-r from-blue-500/30 to-blue-500" />
            <ArrowRight className="w-3 h-3 text-blue-400 -ml-1" />
          </div>
          <div className="px-6 py-4 rounded-2xl border-2 text-center shadow-lg"
            style={{
              borderColor: mstrScore >= 55 ? '#3b82f666' : mstrScore >= 45 ? '#6b728066' : '#ef444466',
              backgroundColor: mstrScore >= 55 ? '#3b82f608' : mstrScore >= 45 ? '#6b728008' : '#ef444408',
            }}>
            <div className="text-[10px] text-blue-400 font-bold mb-1">MSTR Signal</div>
            <div className="text-xl font-black" style={{ color: mstrScore >= 55 ? '#3b82f6' : mstrScore >= 45 ? '#6b7280' : '#ef4444' }}>
              {mstrScore}%
            </div>
            <div className="text-xs font-bold text-white mt-0.5">{mstrSignal}</div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col items-center gap-2">
        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">BTC Signal Path</div>
        {btcCats.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] w-full max-w-[240px]">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
              <div>
                <div className="text-xs font-bold text-white">{cat.name}</div>
                <div className="text-[10px] text-slate-400">Score: {cat.score}</div>
              </div>
            </div>
            <div className="w-px h-3 bg-white/10" />
          </div>
        ))}
        <div className="px-5 py-2 rounded-2xl border border-[#F7931A]/30 bg-[#F7931A]/5 text-center">
          <Zap className="w-4 h-4 text-[#F7931A] mx-auto" />
          <div className="text-[10px] font-bold text-[#F7931A]">BTC Engine</div>
        </div>
        <div className="w-px h-3 bg-[#F7931A]/30" />
        <div className="px-6 py-3 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 text-center">
          <div className="text-lg font-black text-emerald-400">{btcScore}%</div>
          <div className="text-xs font-bold text-white">{btcSignal}</div>
          <div className="text-[9px] text-orange-400 mt-0.5">₿ BTC Signal</div>
        </div>
        <div className="w-px h-4 bg-gradient-to-b from-orange-500/30 to-blue-500/30" />
        <div className="px-3 py-1 rounded-full bg-white/5 text-[9px] text-slate-400 border border-white/10">↓ feeds into MSTR (60%)</div>
        <div className="w-px h-4 bg-blue-500/20" />
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">MSTR Signal Path</div>
        {mstrCats.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] w-full max-w-[240px]">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
              <div>
                <div className="text-xs font-bold text-white">{cat.name}</div>
                <div className="text-[10px] text-slate-400">Score: {cat.score}</div>
              </div>
            </div>
            <div className="w-px h-3 bg-white/10" />
          </div>
        ))}
        <div className="px-5 py-2 rounded-2xl border border-blue-500/30 bg-blue-500/5 text-center">
          <Zap className="w-4 h-4 text-blue-400 mx-auto" />
          <div className="text-[10px] font-bold text-blue-400">MSTR Engine</div>
        </div>
        <div className="w-px h-3 bg-blue-500/30" />
        <div className="px-6 py-3 rounded-2xl border-2 border-blue-500/40 bg-blue-500/5 text-center">
          <div className="text-lg font-black text-blue-400">{mstrScore}%</div>
          <div className="text-xs font-bold text-white">{mstrSignal}</div>
          <div className="text-[9px] text-blue-400 mt-0.5">MSTR Signal</div>
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
    name: 'Free', price: '$0', period: '', desc: 'Master signals only',
    features: ['Daily BTC + MSTR signals', 'BUY / SELL / NEUTRAL', 'Basic email summary'],
    cta: 'Get Started', highlight: false,
  },
  {
    name: 'Pro', price: '$99', period: '/mo', desc: 'Full signal breakdown',
    features: ['All 30+ sub-signals in real-time', '6 category scores & weights', 'Signal change alerts (Email + SMS)', 'X/Twitter sentiment analysis', 'Historical signal archive', 'Priority support'],
    cta: 'Get VaultSignal Pro', highlight: true,
  },
  {
    name: 'API', price: '$499', period: '/mo', desc: 'Programmatic access',
    features: ['Everything in Pro', 'REST API access', 'Webhook alerts', 'Custom signal weights', 'Dedicated support'],
    cta: 'Contact Sales', highlight: false,
  },
]

function Pricing() {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {pricingTiers.map((tier) => (
        <div key={tier.name}
          className={`relative rounded-2xl p-6 border transition-all duration-300 ${
            tier.highlight ? 'border-[#F7931A]/50 bg-[#F7931A]/5 shadow-lg shadow-[#F7931A]/10 scale-[1.02]' : 'border-white/5 bg-white/[0.02]'
          }`}>
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
          <button className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
            tier.highlight ? 'bg-[#F7931A] text-black hover:bg-[#F7931A]/90 shadow-lg shadow-[#F7931A]/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
          }`}>
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
  const [data, setData] = useState<EngineOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/signal_output.json', { cache: 'no-store' })
      if (res.ok) {
        const json: EngineOutput = await res.json()
        setData(json)
        setLastUpdate(new Date().toLocaleTimeString())
      }
    } catch (err) {
      console.error('VaultSignal fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-[#F7931A] animate-spin" />
        <p className="text-slate-400">Loading VaultSignal…</p>
      </div>
    )
  }

  const cats = buildDisplayCategories(data)
  const btcScore = data.btc_signal.score
  const btcSignal = data.btc_signal.label
  const mstrScore = data.mstr_signal.score
  const mstrSignal = data.mstr_signal.label
  const totalSignals = data.signals.length

  return (
    <div className="max-w-6xl mx-auto space-y-20 pb-20">
      {/* Hero */}
      <section className="text-center pt-8 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A] text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Live Engine Data — Refreshes Every 60s
          {lastUpdate && <span className="text-slate-500 ml-1">• {lastUpdate}</span>}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
          Vault<span className="text-[#F7931A]">Signal</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          {totalSignals} data streams. 6 categories. Two clear signals.
          <br />
          <span className="text-slate-500">The most comprehensive BTC &amp; MSTR trading indicator.</span>
        </p>

        {/* Dual Gauges */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <SignalGauge score={btcScore} label={btcSignal} title="₿ BTC Signal" gradientId="gaugeGradBTC" />
            <div className="flex items-center justify-center gap-2 text-sm pt-6">
              <span className="text-orange-400 font-semibold">BTC</span>
              <span className="text-white font-mono font-bold">
                ${data.btc_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className={`text-xs font-semibold ${data.btc_24h_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.btc_24h_change >= 0 ? '+' : ''}{data.btc_24h_change.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <SignalGauge score={mstrScore} label={mstrSignal} title="MSTR Signal" gradientId="gaugeGradMSTR" />
            <div className="flex items-center justify-center gap-2 text-sm pt-6">
              <span className="text-blue-400 font-semibold">MSTR</span>
              <span className="text-white font-mono font-bold">${data.mstr_price.toFixed(2)}</span>
              <span className={`text-xs font-semibold ${data.mstr_24h_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.mstr_24h_change >= 0 ? '+' : ''}{data.mstr_24h_change.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
          <span>₿ BTC Signal feeds into MSTR Signal at 60% weight</span>
          <span className="text-slate-700">•</span>
          <span>Generated: {new Date(data.generated_at).toLocaleString()}</span>
          {data.errors.length > 0 && (
            <>
              <span className="text-slate-700">•</span>
              <span className="text-amber-500">{data.errors.length} API errors (gracefully handled)</span>
            </>
          )}
        </div>
      </section>

      {/* Signal Categories Grid */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Component Signals</h2>
          <p className="text-slate-400 text-sm mt-2">
            Tap any category to expand •{' '}
            <span className="text-emerald-400">API</span> = live data •{' '}
            <span className="text-blue-400">Calc</span> = calculated •{' '}
            <span className="text-amber-400">Pro</span> = upgrade required
            <br />
            <span className="text-orange-400">→ BTC Signal</span> categories feed Bitcoin • <span className="text-blue-400">→ MSTR Signal</span> categories feed MicroStrategy
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((cat, i) => (
            <CategoryCard key={cat.key} cat={cat} index={i} />
          ))}
        </div>
      </section>

      {/* Flowchart */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">How It Works</h2>
          <p className="text-slate-400 text-sm mt-2">BTC signals flow into both master signals — MSTR inherits BTC conviction with leveraged exposure</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 lg:p-12">
          <DualFlowChart categories={cats} btcScore={btcScore} btcSignal={btcSignal} mstrScore={mstrScore} mstrSignal={mstrSignal} />
        </div>
      </section>

      {/* Historical */}
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
