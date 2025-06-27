'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2, User, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface SearchResult {
  type: 'user' | 'country'
  id: string
  name: string
  subtitle?: string
  avatar?: string
  flag?: string
  url: string
}

interface SearchProps {
  className?: string
  placeholder?: string
}

export default function SearchComponent({ className = '', placeholder = 'Ülke veya kullanıcı ara...' }: SearchProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true)
      try {
        // Search users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(5)

        // Search countries
        const { data: countriesData } = await supabase
          .from('countries')
          .select('id, code, name, flag')
          .ilike('name', `%${query}%`)
          .limit(5)

        const searchResults: SearchResult[] = []

        // Format user results
        if (usersData) {
          usersData.forEach((user: any) => {
            searchResults.push({
              type: 'user',
              id: user.id,
              name: user.full_name || user.username,
              subtitle: user.full_name ? `@${user.username}` : undefined,
              avatar: user.avatar_url || undefined,
              url: `/${user.username}`
            })
          })
        }

        // Format country results
        if (countriesData) {
          countriesData.forEach((country: any) => {
            searchResults.push({
              type: 'country',
              id: country.id.toString(),
              name: country.name,
              flag: country.flag,
              url: `/country/${country.code.toLowerCase()}`
            })
          })
        }

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      handleClose()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-10 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {query && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search Results */}
      {isOpen && (query || loading) && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto shadow-lg z-50">
          <CardContent className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : results.length === 0 && query ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                "{query}" için sonuç bulunamadı
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.url}
                    onClick={handleClose}
                    className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {result.type === 'user' ? (
                        <>
                          {result.avatar ? (
                            <img
                              src={result.avatar}
                              alt={result.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-full flex items-center justify-center text-white dark:text-slate-900 font-bold">
                              {result.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {result.name}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Kullanıcı
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl">{result.flag}</span>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {result.name}
                            </div>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Ülke
                          </Badge>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}