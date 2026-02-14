'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu, Bitcoin, TrendingUp, Calculator, Bell, Users, BarChart3 } from 'lucide-react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: Bitcoin },
    { href: '/treasuries', label: 'Treasuries', icon: TrendingUp },
    { href: '/corporate', label: 'Corporate Holdings', icon: Users },
    { href: '/politicians', label: 'Politicians', icon: Users },
    { href: '/mstr', label: 'MSTR Analytics', icon: TrendingUp },
    { href: '/mstr/calculator', label: 'Options Calculator', icon: Calculator },
    { href: '/alerts', label: 'Alerts', icon: Bell },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900 border-l border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
          
          {/* User Section */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="space-y-1">
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
              >
                <Users className="h-5 w-5" />
                <span>Sign In</span>
              </Link>
              
              <Link
                href="/register"
                onClick={onClose}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
              >
                <Users className="h-5 w-5" />
                <span>Sign Up Free</span>
              </Link>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700 text-xs text-slate-500">
            <p>© 2026 BTCIntelVault</p>
            <p>Bitcoin Treasury Intelligence</p>
          </div>
        </nav>
      </div>
    </div>
  )
}

export function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}