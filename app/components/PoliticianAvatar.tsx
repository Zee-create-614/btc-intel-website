'use client'
import React, { useState } from 'react'

export default function PoliticianAvatar({ name, party, photoUrl, large = false }: { name: string; party: string; photoUrl?: string; large?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const bgColor = party === 'R' ? 'bg-gradient-to-br from-red-600 to-red-700' : 
                   party === 'D' ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 
                   'bg-gradient-to-br from-purple-600 to-purple-700'
  const size = large ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-base'
  
  if (photoUrl && !imgFailed) {
    return (
      <img 
        src={photoUrl} 
        alt={name}
        className={`${large ? 'w-20 h-20' : 'w-12 h-12'} rounded-full object-cover shadow-lg border-4 border-gray-700`}
        onError={() => setImgFailed(true)}
      />
    )
  }
  
  return (
    <div className={`${size} ${bgColor} rounded-full flex items-center justify-center font-bold text-white shadow-lg border-4 border-gray-700`}>
      {initials}
    </div>
  )
}
