'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Shuffle, MapPin, Globe, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Profile {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  location_count?: number
  countries_count?: number
}

export default function DiscoverPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [shuffling, setShuffling] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadRandomProfiles()
    }
  }, [loading])

  const loadRandomProfiles = async () => {
    setShuffling(true)
    try {
      // Get random profiles with their location counts
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          bio,
          avatar_url
        `)
        .not('username', 'is', null)
        .limit(50) // Get more than needed for randomization

      if (error) throw error

      if (profilesData && profilesData.length > 0) {
        // Get location counts for each profile
        const profilesWithCounts = await Promise.all(
          profilesData.map(async (profile: any) => {
            const { data: locationsData } = await supabase
              .from('user_locations')
              .select('country_id')
              .eq('user_id', profile.id)

            const locationCount = locationsData?.length || 0
            const countriesCount = locationsData 
              ? new Set(locationsData.map((l: any) => l.country_id)).size 
              : 0

            return {
              ...profile,
              location_count: locationCount,
              countries_count: countriesCount
            }
          })
        )

        // Filter out profiles with no locations and shuffle
        const profilesWithLocations = profilesWithCounts.filter(p => p.location_count > 0)
        const shuffled = profilesWithLocations.sort(() => 0.5 - Math.random())
        setProfiles(shuffled.slice(0, 10))
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setShuffling(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleShuffle = () => {
    loadRandomProfiles()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="relative mx-auto mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <Sparkles className="w-10 h-10 text-white dark:text-slate-900" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-6">
                Discover Travelers
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                Explore travel stories from around the world and get inspired for your next adventure. 
                Connect with fellow explorers and discover hidden gems.
              </p>
              
              <Button
                onClick={handleShuffle}
                disabled={shuffling}
                size="lg"
                className="px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                {shuffling ? 'Finding new travelers...' : 'Discover New Travelers'}
              </Button>
            </div>

            {/* Profiles Grid */}
            {profiles.length === 0 ? (
              <Card className="max-w-md mx-auto p-8 text-center border-dashed">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No travelers found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Be the first to add your travel experiences!
                  </p>
                  {user ? (
                    <Button asChild>
                      <Link href="/profile">Add Your Travels</Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/auth/signup">Join TravelBio</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {profiles.map((profile, index) => (
                  <Card 
                    key={profile.id}
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <Link href={`/${profile.username}`} className="block">
                        <div className="text-center space-y-4">
                          {/* Avatar */}
                          <div className="relative mx-auto w-fit">
                            <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                              <AvatarImage 
                                src={profile.avatar_url || undefined} 
                                alt={profile.username}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 text-lg font-bold">
                                {profile.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          
                          {/* Name & Username */}
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-1">
                              {profile.full_name || profile.username}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                              @{profile.username}
                            </p>
                          </div>
                          
                          {/* Bio */}
                          {profile.bio && (
                            <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2 px-2">
                              {profile.bio}
                            </p>
                          )}
                          
                          {/* Stats */}
                          <div className="flex justify-center gap-3">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {profile.countries_count}
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {profile.location_count}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Bottom CTA */}
            {!user && profiles.length > 0 && (
              <Card className="mt-16 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0">
                <CardContent className="text-center py-12">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Ready to share your story?
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-md mx-auto">
                    Join TravelBio and create your own travel profile to connect with fellow explorers.
                  </p>
                  <Button asChild size="lg" className="px-8 py-3 text-lg">
                    <Link href="/auth/signup">
                      <Globe className="w-5 h-5 mr-2" />
                      Start Your Journey
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  )
}