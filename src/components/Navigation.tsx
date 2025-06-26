'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, User, LogOut, Globe } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface NavigationProps {
  user: SupabaseUser | null
  onSignOut?: () => void
}

export default function Navigation({ user, onSignOut }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/discover', icon: Compass, label: 'Discover' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              TravelBio
            </span>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {user ? (
              <button
                onClick={onSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin" className="btn-ghost">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-3 gap-1 p-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}