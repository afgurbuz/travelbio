'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, MapPin, Save, Plus, X, Share2, ExternalLink } from 'lucide-react'

interface Profile {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  avatar_url?: string
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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [locationType, setLocationType] = useState<'lived' | 'visited'>('visited')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) setProfile(profileData)

      // Load countries
      const { data: countriesData } = await supabase
        .from('countries')
        .select('*')
        .order('name')
      
      if (countriesData) setCountries(countriesData)

      // Load user locations
      const { data: locationsData } = await supabase
        .from('user_locations')
        .select(`
          *,
          country:countries(*),
          city:cities(*)
        `)
        .eq('user_id', user.id)
      
      if (locationsData) setUserLocations(locationsData as UserLocation[])
      
      setLoading(false)
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (selectedCountry) {
      const loadCities = async () => {
        const { data: citiesData } = await supabase
          .from('cities')
          .select('*')
          .eq('country_id', selectedCountry)
          .order('name')
        
        if (citiesData) setCities(citiesData)
      }
      loadCities()
    } else {
      setCities([])
    }
  }, [selectedCountry])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleShare = async () => {
    if (!profile?.username) return
    
    const profileUrl = `${window.location.origin}/${profile.username}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.username}'s Travel Profile`,
          text: `Check out my travel experiences on TravelBio`,
          url: profileUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(profileUrl)
      alert('Profile link copied to clipboard!')
    }
  }

  const handleAddLocation = async () => {
    if (!selectedCountry || !user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: user.id,
          country_id: parseInt(selectedCountry),
          city_id: selectedCity ? parseInt(selectedCity) : null,
          type: locationType
        })
      
      if (!error) {
        // Reload locations
        const { data: locationsData } = await supabase
          .from('user_locations')
          .select(`
            *,
            country:countries(*),
            city:cities(*)
          `)
          .eq('user_id', user.id)
        
        if (locationsData) setUserLocations(locationsData as UserLocation[])
        
        setShowAddForm(false)
        setSelectedCountry('')
        setSelectedCity('')
      }
    } catch (error) {
      console.error('Error adding location:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', locationId)
      
      if (!error) {
        setUserLocations(prev => prev.filter(loc => loc.id !== locationId))
      }
    } catch (error) {
      console.error('Error removing location:', error)
    }
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-sky-100 dark:bg-sky-900/20 rounded-2xl">
              <UserIcon className="w-8 h-8 text-sky-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {profile?.username || 'Your Profile'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {profile?.email}
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </button>
              {profile?.username && (
                <a
                  href={`/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public
                </a>
              )}
            </div>
          </div>

          {/* Locations Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Travel Map
              </h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </button>
            </div>

            {/* Add Location Form */}
            {showAddForm && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={locationType}
                      onChange={(e) => setLocationType(e.target.value as 'lived' | 'visited')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="visited">Visited</option>
                      <option value="lived">Lived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select country</option>
                      
                      {/* Popular Countries */}
                      <optgroup label="🌟 Popular">
                        {countries.filter(c => ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU', 'CA', 'TR'].includes(c.code))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(country => (
                            <option key={country.id} value={country.id}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* Europe */}
                      <optgroup label="🇪🇺 Europe">
                        {countries.filter(c => ['AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'GR', 'HU', 'IE', 'IS', 'LV', 'LT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE', 'CH'].includes(c.code))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(country => (
                            <option key={country.id} value={country.id}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* Asia */}
                      <optgroup label="🌏 Asia">
                        {countries.filter(c => ['CN', 'IN', 'KR', 'TH', 'SG', 'MY', 'VN', 'PH', 'ID', 'AE'].includes(c.code))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(country => (
                            <option key={country.id} value={country.id}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* Americas */}
                      <optgroup label="🌎 Americas">
                        {countries.filter(c => ['BR', 'MX', 'AR'].includes(c.code))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(country => (
                            <option key={country.id} value={country.id}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* Africa & Others */}
                      <optgroup label="🌍 Africa & Others">
                        {countries.filter(c => ['ZA', 'EG', 'NZ', 'RU'].includes(c.code))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(country => (
                            <option key={country.id} value={country.id}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* All Countries (Alphabetical) */}
                      <optgroup label="🔤 All Countries">
                        {countries
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(country => (
                            <option key={`all-${country.id}`} value={country.id}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City (Optional)
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={!selectedCountry}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">Select city</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={handleAddLocation}
                      disabled={!selectedCountry || saving}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setSelectedCountry('')
                        setSelectedCity('')
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Locations List */}
            {userLocations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No locations added yet. Start by adding places you've visited or lived in!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userLocations.map(location => (
                  <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{location.country.flag}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {location.city ? location.city.name + ', ' : ''}{location.country.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {location.type}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLocation(location.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}