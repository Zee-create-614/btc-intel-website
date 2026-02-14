"use client"

import { useState } from 'react'

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function PoliticianPhoto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    const initials = getInitials(alt || '??')
    return (
      <div
        className={className}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#374151', color: '#9CA3AF', fontWeight: 700,
          fontSize: '1.25rem', borderRadius: '9999px',
        }}
        title={alt}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
