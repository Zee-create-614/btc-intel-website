'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useState, useCallback } from 'react'

const PARTIES = [
  { label: 'All', value: '' },
  { label: 'Republican', value: 'R' },
  { label: 'Democrat', value: 'D' },
  { label: 'Independent', value: 'I' },
]

const SORTS = [
  { label: 'Most Trades', value: 'most_trades' },
  { label: 'Best Return', value: 'best_return' },
  { label: 'Worst Return', value: 'worst_return' },
  { label: 'Alphabetical', value: 'alpha' },
]

export default function PoliticianFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const party = searchParams.get('party') || ''
  const sort = searchParams.get('sort') || 'most_trades'

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    params.set('page', '1')
    router.push(`/politicians?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') updateParams({ q: search }) }}
          onBlur={() => updateParams({ q: search })}
          placeholder="Search by politician name..."
          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-bitcoin-500 focus:ring-1 focus:ring-bitcoin-500 transition-colors"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Party filter */}
        <div className="flex flex-wrap gap-2">
          {PARTIES.map(p => (
            <button
              key={p.value}
              onClick={() => updateParams({ party: p.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                party === p.value
                  ? 'bg-bitcoin-500 text-black'
                  : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-bitcoin-500/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <select
            value={sort}
            onChange={e => updateParams({ sort: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-bitcoin-500"
          >
            {SORTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
