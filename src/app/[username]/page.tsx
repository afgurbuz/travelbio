'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Globe, Share2, Calendar, ArrowLeft } from 'lucide-react'
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
      navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white dark:text-slate-900" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">TravelBio</span>
            </Link>
            <button
              onClick={handleShare}
              className="btn-primary"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-32 h-32 rounded-3xl object-cover border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-900 dark:bg-slate-100 rounded-3xl flex items-center justify-center text-white dark:text-slate-900 text-4xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              {profile.full_name || profile.username}
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
              @{profile.username}
            </p>
            
            {profile.bio && (
              <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
                {profile.bio}
              </p>
            )}
            
            <div className="flex items-center justify-center space-x-2 text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="card text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{totalCountries}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Countries</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{totalCities}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Cities</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{livedLocations.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Lived</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{visitedLocations.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Visited</div>
            </div>
          </div>

          {userLocations.length === 0 ? (
            <div className="card text-center py-16">
              <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No travel history yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {profile.username} hasn't added any travel experiences yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Lived Locations */}
              {livedLocations.length > 0 && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                    <div className="w-6 h-6 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white dark:text-slate-900 text-sm">🏠</span>
                    </div>
                    Places I've Lived
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {livedLocations.map(location => (
                      <div key={location.id} className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-3xl">{location.country.flag}</span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {location.city ? location.city.name : location.country.name}
                          </div>
                          {location.city && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
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
                <div className="card">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                    <div className="w-6 h-6 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white dark:text-slate-900 text-sm">✈️</span>
                    </div>
                    Places I've Visited
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visitedLocations.map(location => (
                      <div key={location.id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-2xl">{location.country.flag}</span>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {location.city ? location.city.name : location.country.name}
                          </div>
                          {location.city && (
                            <div className="text-xs text-slate-600 dark:text-slate-400">
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
          <div className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Want to create your own travel profile?
            </p>
            <Link href="/auth/signup" className="btn-primary px-8 py-3 text-lg">
              <Globe className="w-5 h-5 mr-2" />
              Join TravelBio
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}