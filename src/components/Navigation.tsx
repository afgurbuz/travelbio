'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, User, LogOut, Globe, Trophy, Map } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/discover" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Globe className="w-6 h-6 text-white dark:text-slate-900" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              TravelBio
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname === '/' && item.href === '/discover')
              const Icon = item.icon
              
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="h-9"
                >
                  <Link href={item.href} className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Button
                onClick={onSignOut}
                variant="ghost"
                size="sm"
                className="h-9"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50">
          <div className={`grid gap-1 p-3 ${user ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname === '/' && item.href === '/discover')
              const Icon = item.icon
              
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className="h-12 flex-col space-y-1"
                >
                  <Link href={item.href}>
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}