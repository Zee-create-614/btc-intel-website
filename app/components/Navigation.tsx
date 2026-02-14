'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bitcoin, TrendingUp, Calculator, Bell, Users, Target } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: Bitcoin },
    { href: '/treasuries', label: 'Treasuries', icon: TrendingUp },
    { href: '/politicians', label: 'Politicians', icon: Users },
    { href: '/mstr', label: 'MSTR Analytics', icon: TrendingUp },
    // { href: '/halving', label: 'Halving Tracker', icon: Clock },
    { href: '/mstr/calculator', label: 'Options Calculator', icon: Calculator },
    { href: '/alerts', label: 'Alerts', icon: Bell },
  ]

  return (
    <nav className="bg-bitcoin-900 border-b border-bitcoin-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/Bitcoin Intel Vault.png" 
              alt="BTCIntelVault" 
              width={40} 
              height={40} 
              className="h-10 w-10"
            />
            <span className="text-xl font-bold">BTCIntelVault</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-bitcoin-500 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}