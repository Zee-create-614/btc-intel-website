'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface Politician {
  name: string
  party: string
  chamber: string
  state: string
  photo_url?: string
}

interface Props {
  politicians: Politician[]
}

function partyColor(p: string) {
  return p === 'R' ? 'text-red-400' : p === 'D' ? 'text-blue-400' : 'text-purple-400'
}
function partyLabel(p: string) {
  return p === 'R' ? 'R' : p === 'D' ? 'D' : p || '?'
}

export default function PoliticianSearch({ politicians }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.length >= 1
    ? politicians.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setActiveIdx(-1) }, [query])

  function navigate(name: string) {
    setOpen(false)
    setQuery('')
    router.push(`/politicians/${encodeURIComponent(name)}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); navigate(results[activeIdx].name) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search politicians..."
          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-bitcoin-500 focus:ring-1 focus:ring-bitcoin-500 transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {results.map((pol, i) => (
            <button
              key={pol.name}
              onClick={() => navigate(pol.name)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === activeIdx ? 'bg-gray-800' : 'hover:bg-gray-800/50'
              }`}
            >
              {pol.photo_url ? (
                <img src={pol.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                  {pol.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{pol.name}</p>
                <p className="text-xs text-gray-500">
                  <span className={partyColor(pol.party)}>{partyLabel(pol.party)}</span>
                  {' · '}{pol.chamber}{pol.state ? ` · ${pol.state}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 1 && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 text-center text-gray-500 text-sm">
          No politicians found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
