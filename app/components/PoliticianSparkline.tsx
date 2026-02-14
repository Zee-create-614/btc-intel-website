'use client'

import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Trade {
  transaction_date: string
  return_pct: number | null
  [key: string]: any
}

interface Props {
  trades: Trade[]
  width?: number
  height?: number
}

export default function PoliticianSparkline({ trades, width = 80, height = 30 }: Props) {
  const data = useMemo(() => {
    const sorted = [...trades]
      .filter(t => t.transaction_date)
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))

    let cumulative = 0
    return sorted.map(t => {
      cumulative += t.return_pct ?? 0
      return { v: Math.round(cumulative * 10) / 10 }
    })
  }, [trades])

  if (data.length < 2) return null

  const lastVal = data[data.length - 1].v
  const color = lastVal >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
