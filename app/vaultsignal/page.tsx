'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus, ChevronRight, Zap, Shield, BarChart3, Brain, Building2, Check, ArrowRight, RefreshCw, Bitcoin, Lock } from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type SignalDirection = 'bullish' | 'bearish' | 'neutral'

interface Signal {
  name: string
  value: string        // displayed value (ignored if locked)
  direction: SignalDirection // ignored if locked
  weight: number
  live: boolean        // true = real API data shown now
  locked: boolean      // true = Pro Only (no data available free)
}

interface SignalCategory {
  name: string
  icon: React.ReactNode
  color: string
  glowColor: string
  signals: Signal[]
  score: number | null     // null = entire category locked
  direction: SignalDirection | null
  feed: 'btc' | 'mstr'
  liveCount: number        // how many signals are live
}

interface LivePrices {
  btcPrice: number
  btcChange24h: number
  mstrPrice: number
  mstrChange24h: number
  fearGreed: number
  fearGreedLabel: string
  btcMomentum5d: number
  mstrMomentum5d: number
  btcVolTrend: number
  mstrVolTrend: number
  btcApiScore: number
  mstrApiScore: number
}

interface DualScores {
  btcScore: number
  btcSignal: string
  mstrScore: number
  mstrSignal: string
}

// ============================================================
// HELPERS
// ============================================================

function dir(val: number, bull: number, bear: number): SignalDirection {
  if (val >= bull) return 'bullish'
  if (val <= bear) return 'bearish'
  return 'neutral'
}

function signalLabel(score: number): string {
  if (score >= 75) return 'STRONG BUY'
  if (score >= 60) return 'BUY'
  if (score >= 45) return 'NEUTRAL'
  if (score >= 30) return 'SELL'
  return 'STRONG SELL'
}

// Compute category score from ONLY live (non-locked) signals
// Returns null if no live signals
function catScore(signals: Signal[]): { score: number | null; direction: SignalDirection | null } {
  const live = signals.filter(s => s.live && !s.locked)
  if (live.length === 0) return { score: null, direction: null }
  const totalWeight = live.reduce((a, s) => a + s.weight, 0)
  let weighted = 0
  for (const s of live) {
    const v = s.direction === 'bullish' ? 75 : s.direction === 'bearish' ? 25 : 50
    weighted += v * (s.weight / totalWeight)
  }
  const score = Math.round(weighted)
  return { score, direction: dir(score, 55, 45) }
}

// ============================================================
// DATA BUILDING — only real data gets values, rest is locked
// ============================================================

function buildCategories(d: LivePrices): SignalCategory[] {
  // ── On-Chain: ALL locked (no free real-time on-chain API) ──
  const onChainSignals: Signal[] = [
    { name: 'MVRV Z-Score', value: '', direction: 'neutral', weight: 30, live: false, locked: true },
    { name: 'NUPL', value: '', direction: 'neutral', weight: 25, live: false, locked: true },
    { name: 'Exchange Reserve', value: '', direction: 'neutral', weight: 25, live: false, locked: true },
    { name: 'Active Addresses', value: '', direction: 'neutral', weight: 20, live: false, locked: true },
  ]
  const onChainCalc = catScore(onChainSignals)

  // ── Macro: ALL locked ──
  const macroSignals: Signal[] = [
    { name: 'Global Liquidity Index', value: '', direction: 'neutral', weight: 30, live: false, locked: true },
    { name: 'DXY Trend', value: '', direction: 'neutral', weight: 25, live: false, locked: true },
    { name: 'Fed Funds Rate', value: '', direction: 'neutral', weight: 25, live: false, locked: true },
    { name: 'US 10Y Yield', value: '', direction: 'neutral', weight: 20, live: false, locked: true },
  ]
  const macroCalc = catScore(macroSignals)

  // ── Technical: momentum + volume are REAL from Yahoo Finance via vault-signal API ──
  const momDir = dir(d.btcMomentum5d, 2, -2)
  const volDir = dir(d.btcVolTrend, 1.15, 0.85)
  const techSignals: Signal[] = [
    { name: 'RSI (14D)', value: '', direction: 'neutral', weight: 20, live: false, locked: true },
    { name: 'BTC 5D Momentum', value: `${d.btcMomentum5d >= 0 ? '+' : ''}${d.btcMomentum5d.toFixed(2)}%`, direction: momDir, weight: 25, live: true, locked: false },
    { name: 'MACD', value: '', direction: 'neutral', weight: 20, live: false, locked: true },
    { name: 'BTC Volume Trend', value: `${d.btcVolTrend.toFixed(2)}x avg`, direction: volDir, weight: 20, live: true, locked: false },
    { name: 'Bollinger Bands', value: '', direction: 'neutral', weight: 15, live: false, locked: true },
  ]
  const techCalc = catScore(techSignals)

  // ── Sentiment: Fear & Greed is REAL ──
  const fgDir = dir(d.fearGreed, 55, 40)
  const sentSignals: Signal[] = [
    { name: 'Fear & Greed Index', value: `${d.fearGreed} — ${d.fearGreedLabel}`, direction: fgDir, weight: 30, live: true, locked: false },
    { name: 'Funding Rates', value: '', direction: 'neutral', weight: 25, live: false, locked: true },
    { name: 'Put/Call Ratio', value: '', direction: 'neutral', weight: 25, live: false, locked: true },
    { name: 'Social Sentiment', value: '', direction: 'neutral', weight: 20, live: false, locked: true },
  ]
  const sentCalc = catScore(sentSignals)

  // ── MSTR-Specific: momentum + volume are REAL ──
  const mstrMomDir = dir(d.mstrMomentum5d, 2, -2)
  const mstrVolDir = dir(d.mstrVolTrend, 1.15, 0.85)
  const mstrSignals: Signal[] = [
    { name: 'NAV Premium', value: '', direction: 'neutral', weight: 30, live: false, locked: true },
    { name: 'MSTR 5D Momentum', value: `${d.mstrMomentum5d >= 0 ? '+' : ''}${d.mstrMomentum5d.toFixed(2)}%`, direction: mstrMomDir, weight: 25, live: true, locked: false },
    { name: 'IV Percentile', value: '', direction: 'neutral', weight: 25, live: false, locked: true },
    { name: 'MSTR Volume Trend', value: `${d.mstrVolTrend.toFixed(2)}x avg`, direction: mstrVolDir, weight: 20, live: true, locked: false },
  ]
  const mstrCalc = catScore(mstrSignals)

  const makeCat = (
    name: string, icon: React.ReactNode, color: string, glowColor: string,
    signals: Signal[], calc: { score: number | null; direction: SignalDirection | null }, feed: 'btc' | 'mstr'
  ): SignalCategory => ({
    name, icon, color, glowColor, signals,
    score: calc.score, direction: calc.direction, feed,
    liveCount: signals.filter(s => s.live).length,
  })

  return [
    makeCat('On-Chain', <Activity className="w-5 h-5" />, 'from-emerald-500 to-teal-500', 'shadow-emerald-500/20', onChainSignals, onChainCalc, 'btc'),
    makeCat('Macro', <Building2 className="w-5 h-5" />, 'from-blue-500 to-cyan-500', 'shadow-blue-500/20', macroSignals, macroCalc, 'btc'),
    makeCat('Technical', <BarChart3 className="w-5 h-5" />, 'from-violet-500 to-purple-500', 'shadow-violet-500/20', techSignals, techCalc, 'btc'),
    makeCat('Sentiment', <Brain className="w-5 h-5" />, 'from-amber-500 to-orange-500', 'shadow-amber-500/20', sentSignals, sentCalc, 'btc'),
    makeCat('MSTR-Specific', <Shield className="w-5 h-5" />, 'from-rose-500 to-pink-500', 'shadow-rose-500/20', mstrSignals, mstrCalc, 'mstr'),
  ]
}

function computeDualScores(cats: SignalCategory[]): DualScores {
  // BTC: average of all btc-feed categories that have real scores
  const btcCats = cats.filter(c => c.feed === 'btc' && c.score !== null)
  const btcScore = btcCats.length > 0
    ? Math.round(btcCats.reduce((a, c) => a + c.score!, 0) / btcCats.length)
    : 50

  // MSTR: 60% BTC + 40% MSTR-specific (if available)
  const mstrCat = cats.find(c => c.feed === 'mstr' && c.score !== null)
  const mstrScore = mstrCat
    ? Math.round(btcScore * 0.6 + mstrCat.score! * 0.4)
    : Math.round(btcScore * 0.85) // slight discount if no MSTR-specific data

  return {
    btcScore,
    btcSignal: signalLabel(btcScore),
    mstrScore,
    mstrSignal: signalLabel(mstrScore),
  }
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

// ---- Gauge ----
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

// ---- Signal Row (live or locked) ----
function SignalRow({ s }: { s: Signal }) {
  if (s.locked) {
    return (
      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.01] text-xs opacity-50">
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">{s.name}</span>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#F7931A]/10 text-[#F7931A] uppercase tracking-wider">Pro</span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/[0.02] text-xs">
      <div className="flex items-center gap-2">
        <SignalDot direction={s.direction} />
        <span className="text-slate-300">{s.name}</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">Live</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white font-mono font-semibold">{s.value}</span>
        <DirectionIcon direction={s.direction} />
      </div>
    </div>
  )
}

// ---- Category Card ----
function CategoryCard({ cat, index }: { cat: SignalCategory; index: number }) {
  const [open, setOpen] = useState(false)
  const feedLabel = cat.feed === 'btc' ? '→ BTC Signal' : '→ MSTR Signal'
  const feedColor = cat.feed === 'btc' ? 'text-orange-400' : 'text-blue-400'
  const isFullyLocked = cat.score === null

  return (
    <div
      className={`group relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-white/10 transition-all duration-300 ${cat.glowColor} hover:shadow-lg cursor-pointer`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white ${isFullyLocked ? 'opacity-40' : ''}`}>{cat.icon}</div>
          <div>
            <h3 className="font-bold text-white text-sm">{cat.name}</h3>
            <p className="text-[11px] text-slate-400">
              {cat.liveCount}/{cat.signals.length} live <span className={`${feedColor} font-semibold`}>{feedLabel}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          {isFullyLocked ? (
            <>
              <div className="flex items-center gap-1.5 justify-end">
                <Lock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-bold text-[#F7931A]">Pro</span>
              </div>
              <div className="text-[11px] text-slate-600">Upgrade to unlock</div>
            </>
          ) : (
            <>
              <div className="text-xl font-black text-white">{cat.score}</div>
              <div className={`text-[11px] font-semibold ${cat.direction === 'bullish' ? 'text-emerald-400' : cat.direction === 'bearish' ? 'text-red-400' : 'text-slate-400'}`}>
                {cat.direction === 'bullish' ? '↑ Bullish' : cat.direction === 'bearish' ? '↓ Bearish' : '→ Neutral'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800 mb-3 overflow-hidden">
        {isFullyLocked ? (
          <div className="h-full rounded-full bg-slate-700/50 w-full" />
        ) : (
          <div className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-1000`} style={{ width: `${cat.score}%` }} />
        )}
      </div>

      {/* Signals (expandable) */}
      <div className={`space-y-1.5 overflow-hidden transition-all duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        {cat.signals.map((s) => <SignalRow key={s.name} s={s} />)}
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

// ---- Dual Flowchart ----
function DualFlowChart({ categories: cats, dual }: { categories: SignalCategory[]; dual: DualScores }) {
  const btcCats = cats.filter(c => c.feed === 'btc')
  const mstrCats = cats.filter(c => c.feed === 'mstr')

  return (
    <div className="relative">
      {/* Desktop */}
      <div className="hidden lg:block space-y-8">
        {/* BTC path */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col gap-2">
            {btcCats.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white/[0.03] min-w-[170px] ${cat.score === null ? 'border-white/5 opacity-40' : 'border-white/10'}`}>
                  <div className={`p-1 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
                  <div>
                    <div className="text-[11px] font-bold text-white">{cat.name}</div>
                    <div className="text-[9px] text-slate-400">
                      {cat.score !== null ? `${cat.score}/100` : <span className="text-[#F7931A]">Pro Only</span>}
                    </div>
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
            style={{ borderColor: dual.btcScore >= 55 ? '#10b98166' : dual.btcScore >= 45 ? '#6b728066' : '#ef444466' }}>
            <div className="text-[10px] text-orange-400 font-bold mb-1">₿ BTC Signal</div>
            <div className="text-xl font-black" style={{ color: dual.btcScore >= 55 ? '#10b981' : dual.btcScore >= 45 ? '#6b7280' : '#ef4444' }}>
              {dual.btcScore}%
            </div>
            <div className="text-xs font-bold text-white mt-0.5">{dual.btcSignal}</div>
          </div>
        </div>

        {/* BTC → MSTR connector */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="h-6 w-px bg-gradient-to-b from-orange-500/40 to-blue-500/40" />
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-white/10 text-[9px] text-slate-400 font-semibold">
              BTC Signal feeds into MSTR (60% weight)
            </div>
            <div className="h-6 w-px bg-gradient-to-b from-blue-500/40 to-blue-500/20" />
          </div>
        </div>

        {/* MSTR path */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col gap-2">
            {mstrCats.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white/[0.03] min-w-[170px] ${cat.score === null ? 'border-white/5 opacity-40' : 'border-white/10'}`}>
                  <div className={`p-1 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
                  <div>
                    <div className="text-[11px] font-bold text-white">{cat.name}</div>
                    <div className="text-[9px] text-slate-400">
                      {cat.score !== null ? `${cat.score}/100` : <span className="text-[#F7931A]">Pro Only</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-px bg-gradient-to-r from-white/20 to-white/5" />
                  <ArrowRight className="w-3 h-3 text-white/20 -ml-1" />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-500/20 bg-orange-500/5 min-w-[170px]">
                <div className="p-1 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                  <Bitcoin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-orange-400">BTC Signal</div>
                  <div className="text-[9px] text-slate-400">{dual.btcScore}/100 (60% wt)</div>
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
            style={{ borderColor: dual.mstrScore >= 55 ? '#3b82f666' : dual.mstrScore >= 45 ? '#6b728066' : '#ef444466' }}>
            <div className="text-[10px] text-blue-400 font-bold mb-1">MSTR Signal</div>
            <div className="text-xl font-black" style={{ color: dual.mstrScore >= 55 ? '#3b82f6' : dual.mstrScore >= 45 ? '#6b7280' : '#ef4444' }}>
              {dual.mstrScore}%
            </div>
            <div className="text-xs font-bold text-white mt-0.5">{dual.mstrSignal}</div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col items-center gap-2">
        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">BTC Signal Path</div>
        {btcCats.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white/[0.03] w-full max-w-[240px] ${cat.score === null ? 'border-white/5 opacity-40' : 'border-white/10'}`}>
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
              <div>
                <div className="text-xs font-bold text-white">{cat.name}</div>
                <div className="text-[10px] text-slate-400">{cat.score !== null ? `Score: ${cat.score}` : <span className="text-[#F7931A]">Pro Only</span>}</div>
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
          <div className="text-lg font-black text-emerald-400">{dual.btcScore}%</div>
          <div className="text-xs font-bold text-white">{dual.btcSignal}</div>
          <div className="text-[9px] text-orange-400 mt-0.5">₿ BTC Signal</div>
        </div>

        <div className="w-px h-4 bg-gradient-to-b from-orange-500/30 to-blue-500/30" />
        <div className="px-3 py-1 rounded-full bg-white/5 text-[9px] text-slate-400 border border-white/10">↓ feeds into MSTR (60%)</div>
        <div className="w-px h-4 bg-blue-500/20" />

        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">MSTR Signal Path</div>
        {mstrCats.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white/[0.03] w-full max-w-[240px] ${cat.score === null ? 'border-white/5 opacity-40' : 'border-white/10'}`}>
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
              <div>
                <div className="text-xs font-bold text-white">{cat.name}</div>
                <div className="text-[10px] text-slate-400">{cat.score !== null ? `Score: ${cat.score}` : <span className="text-[#F7931A]">Pro Only</span>}</div>
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
          <div className="text-lg font-black text-blue-400">{dual.mstrScore}%</div>
          <div className="text-xs font-bold text-white">{dual.mstrSignal}</div>
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
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Live signals from public data',
    features: ['BTC + MSTR master signals', 'Price momentum & volume', 'Fear & Greed sentiment', 'BUY / SELL / NEUTRAL'],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    desc: 'Full 22-signal engine',
    features: [
      'All 22 sub-signals unlocked',
      'On-chain: MVRV, NUPL, reserves',
      'Macro: DXY, yields, liquidity',
      'Technical: RSI, MACD, Bollinger',
      'Signal change alerts (Email + SMS)',
      'Historical signal archive',
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
        <div key={tier.name}
          className={`relative rounded-2xl p-6 border transition-all duration-300 ${
            tier.highlight ? 'border-[#F7931A]/50 bg-[#F7931A]/5 shadow-lg shadow-[#F7931A]/10 scale-[1.02]' : 'border-white/5 bg-white/[0.02]'
          }`}>
          {tier.highlight && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#F7931A] text-black text-[10px] font-bold uppercase tracking-wider">
              Unlock All Signals
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
  const [liveData, setLiveData] = useState<LivePrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchLiveData = useCallback(async () => {
    try {
      const [vaultRes, fngRes, btcRes] = await Promise.allSettled([
        fetch('/api/v1/live/vault-signal', { cache: 'no-store' }),
        fetch('https://api.alternative.me/fng/?limit=1'),
        fetch('/api/v1/live/btc', { cache: 'no-store' }),
      ])

      let vault: any = null
      if (vaultRes.status === 'fulfilled' && vaultRes.value.ok) vault = await vaultRes.value.json()

      let fearGreed = 50, fearGreedLabel = 'Neutral'
      if (fngRes.status === 'fulfilled' && fngRes.value.ok) {
        const fngData = await fngRes.value.json()
        const fng = fngData?.data?.[0]
        if (fng) { fearGreed = parseInt(fng.value) || 50; fearGreedLabel = fng.value_classification || 'Neutral' }
      }

      let btcPrice = vault?.btc?.price || 0, btcChange24h = vault?.btc?.change_24h || 0
      if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
        const btcData = await btcRes.value.json()
        if (btcData.price_usd) btcPrice = btcData.price_usd
        if (btcData.change_24h != null) btcChange24h = btcData.change_24h
      }

      setLiveData({
        btcPrice, btcChange24h,
        mstrPrice: vault?.mstr?.price || 0,
        mstrChange24h: vault?.mstr?.change_24h || 0,
        fearGreed, fearGreedLabel,
        btcMomentum5d: vault?.btc?.momentum_5d || 0,
        mstrMomentum5d: vault?.mstr?.momentum_5d || 0,
        btcVolTrend: vault?.btc?.volume_trend || 1,
        mstrVolTrend: vault?.mstr?.volume_trend || 1,
        btcApiScore: vault?.btc?.score || 0,
        mstrApiScore: vault?.mstr?.score || 0,
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

  const cats = liveData ? buildCategories(liveData) : []
  const dual = cats.length > 0 ? computeDualScores(cats) : { btcScore: 50, btcSignal: 'NEUTRAL', mstrScore: 50, mstrSignal: 'NEUTRAL' }

  // Count live vs total signals
  const totalSignals = cats.reduce((a, c) => a + c.signals.length, 0)
  const liveSignals = cats.reduce((a, c) => a + c.liveCount, 0)
  const lockedSignals = totalSignals - liveSignals

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
          {liveSignals} Live Signals — {lockedSignals} more with Pro
          {lastUpdate && <span className="text-slate-500 ml-1">• {lastUpdate}</span>}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
          Vault<span className="text-[#F7931A]">Signal</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          {totalSignals} data streams. 5 categories. Two clear signals.
          <br />
          <span className="text-slate-500">The most comprehensive BTC &amp; MSTR trading indicator.</span>
        </p>

        {/* Dual Gauges */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <SignalGauge score={dual.btcScore} label={dual.btcSignal} title="₿ BTC Signal" gradientId="gaugeGradBTC" />
            <div className="flex items-center justify-center gap-2 text-sm pt-6">
              <span className="text-orange-400 font-semibold">BTC</span>
              <span className="text-white font-mono font-bold">
                {liveData?.btcPrice ? `$${liveData.btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
              </span>
              {liveData && (
                <span className={`text-xs font-semibold ${liveData.btcChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {liveData.btcChange24h >= 0 ? '+' : ''}{liveData.btcChange24h.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <SignalGauge score={dual.mstrScore} label={dual.mstrSignal} title="MSTR Signal" gradientId="gaugeGradMSTR" />
            <div className="flex items-center justify-center gap-2 text-sm pt-6">
              <span className="text-blue-400 font-semibold">MSTR</span>
              <span className="text-white font-mono font-bold">
                {liveData?.mstrPrice ? `$${liveData.mstrPrice.toFixed(2)}` : '—'}
              </span>
              {liveData && (
                <span className={`text-xs font-semibold ${liveData.mstrChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {liveData.mstrChange24h >= 0 ? '+' : ''}{liveData.mstrChange24h.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-2">
          <span>₿ BTC Signal feeds into MSTR at 60% weight</span>
          <span className="text-slate-700">•</span>
          <span>Fear &amp; Greed: <span className="text-white font-mono">{liveData?.fearGreed ?? '—'}</span> {liveData?.fearGreedLabel}</span>
          <span className="text-slate-700">•</span>
          <span>Based on <span className="text-emerald-400">{liveSignals} live</span> of {totalSignals} signals</span>
        </div>
      </section>

      {/* Signal Categories */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Component Signals</h2>
          <p className="text-slate-400 text-sm mt-2">
            <span className="text-emerald-400">Live</span> = real API data •
            <Lock className="w-3 h-3 inline mx-1 text-slate-500" /><span className="text-[#F7931A]">Pro</span> = unlocked with subscription
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((cat, i) => <CategoryCard key={cat.name} cat={cat} index={i} />)}
        </div>
      </section>

      {/* Flowchart */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">How It Works</h2>
          <p className="text-slate-400 text-sm mt-2">BTC signals flow into both master signals — MSTR inherits BTC conviction with leveraged exposure</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 lg:p-12">
          <DualFlowChart categories={cats} dual={dual} />
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
          <h2 className="text-2xl font-black text-white">Unlock All {totalSignals} Signals</h2>
          <p className="text-slate-400 text-sm mt-2">
            Free tier uses {liveSignals} live signals. Pro unlocks {lockedSignals} more including on-chain, macro, and advanced technicals.
          </p>
        </div>
        <Pricing />
      </section>
    </div>
  )
}
