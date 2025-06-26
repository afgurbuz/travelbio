'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Globe, Heart, Share2, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
}

interface Country {
  id: number
  code: string
  name: string
  flag: string
}

interface City {
  id: number
  name: string
  country_id: number
}

interface UserLocation {
  id: string
  country_id: number
  city_id?: number
  type: 'lived' | 'visited'
  country: Country
  city?: City
}

interface PageProps {
  params: { username: string }
}

export default function PublicProfilePage({ params }: PageProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [notFoundProfile, setNotFoundProfile] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Load profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', params.username)
          .single()
        
        if (profileError || !profileData) {
          setNotFoundProfile(true)
          setLoading(false)
          return
        }
        
        setProfile(profileData)

        // Load user locations
        const { data: locationsData } = await supabase
          .from('user_locations')
          .select(`
            *,
            country:countries(*),
            city:cities(*)
          `)
          .eq('user_id', profileData.id)
        
        if (locationsData) {
          setUserLocations(locationsData as UserLocation[])
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading profile:', error)
        setNotFoundProfile(true)
        setLoading(false)
      }
    }

    loadProfile()
  }, [params.username])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.username}'s Travel Profile`,
          text: `Check out ${profile?.username}'s travel experiences on TravelBio`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-sky-950">
        <div className="flex justify-center items-center min-h-screen">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (notFoundProfile || !profile) {
    notFound()
  }

  const livedLocations = userLocations.filter(loc => loc.type === 'lived')
  const visitedLocations = userLocations.filter(loc => loc.type === 'visited')
  const totalCountries = new Set(userLocations.map(loc => loc.country_id)).size
  const totalCities = userLocations.filter(loc => loc.city).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-sky-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Globe className="w-8 h-8 text-sky-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">TravelBio</span>
            </Link>
            <button
              onClick={handleShare}
              className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-gray-800 shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-4">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
                {profile.bio}
              </p>
            )}
            <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
              <Calendar className="w-5 h-5" />
              <span className="text-lg">Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-sky-500">{totalCountries}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-500">{totalCities}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cities</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-500">{livedLocations.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lived</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-orange-500">{visitedLocations.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Visited</div>
            </div>
          </div>

          {userLocations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No travel history yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {profile.username} hasn't added any travel experiences yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Lived Locations */}
              {livedLocations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Heart className="w-6 h-6 text-red-500 mr-3" />
                    Places I've Lived
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {livedLocations.map(location => (
                      <div key={location.id} className="flex items-center space-x-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-3xl">{location.country.flag}</span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {location.city ? location.city.name : location.country.name}
                          </div>
                          {location.city && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {location.country.name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visited Locations */}
              {visitedLocations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MapPin className="w-6 h-6 text-sky-500 mr-3" />
                    Places I've Visited
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visitedLocations.map(location => (
                      <div key={location.id} className="flex items-center space-x-3 p-3 bg-sky-50 dark:bg-sky-900/10 rounded-lg border border-sky-200 dark:border-sky-800">
                        <span className="text-2xl">{location.country.flag}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {location.city ? location.city.name : location.country.name}
                          </div>
                          {location.city && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {location.country.name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Want to create your own travel profile?
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-6 py-3 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
            >
              <Globe className="w-5 h-5 mr-2" />
              Join TravelBio
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}