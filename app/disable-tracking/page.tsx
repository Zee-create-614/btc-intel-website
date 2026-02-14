"use client"

import { useEffect, useState } from 'react'

export default function DisableTracking() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    localStorage.setItem('disable_analytics', 'true')
    setDone(true)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {done ? (
          <>
            <p className="text-3xl mb-4">✅</p>
            <p className="text-xl text-green-400 font-bold">Analytics disabled for this device</p>
            <p className="text-slate-400 mt-2">Your visits won't be tracked anymore.</p>
          </>
        ) : (
          <p className="text-slate-400">Setting up...</p>
        )}
      </div>
    </div>
  )
}
