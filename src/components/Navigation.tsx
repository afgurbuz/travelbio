'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, User, LogOut, Globe, Trophy, Map, Search } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import SearchComponent from '@/components/Search'
import { useState } from 'react'

interface NavigationProps {
  user: SupabaseUser | null
  onSignOut?: () => void
}

export default function Navigation({ user, onSignOut }: NavigationProps) {
  const pathname = usePathname()

  const publicNavItems = [
    { href: '/discover', icon: Compass, label: 'Discover' },
    { href: '/countries', icon: Map, label: 'Countries' },
    { href: '/top-charts', icon: Trophy, label: 'Top Charts' },
  ]

  const userNavItems = [
    { href: '/discover', icon: Compass, label: 'Discover' },
    { href: '/countries', icon: Map, label: 'Countries' },
    { href: '/top-charts', icon: Trophy, label: 'Top Charts' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  const navItems = user ? userNavItems : publicNavItems

  const [showMobileSearch, setShowMobileSearch] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/discover" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              TravelBio
            </span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative">
              <SearchComponent />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname === '/' && item.href === '/discover')
              const Icon = item.icon
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item relative px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Button */}
            <Button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              variant="ghost"
              size="sm"
              className="md:hidden h-9"
            >
              <Search className="w-4 h-4" />
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={onSignOut}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-facebook"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden pb-4 px-4">
            <SearchComponent placeholder="Ara..." />
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className={`grid gap-1 p-2 ${user ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/discover')
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}