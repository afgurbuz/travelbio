'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, MapPin, Save, Plus, X, Share2, ExternalLink, Edit3, Camera, Upload, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/discover')
        return
      }
      setUser(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        setEditFullName(profileData.full_name || '')
        setEditBio(profileData.bio || '')
        setEditAvatarUrl(profileData.avatar_url || '')
      }

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

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null

    try {
      setUploading(true)
      
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error uploading image. Please try again.')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      alert('Image size must be less than 1MB')
      return
    }

    setAvatarFile(file)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setEditAvatarUrl(previewUrl)
  }

  const handleUpdateProfile = async () => {
    if (!user || !profile) return
    
    setSaving(true)
    try {
      let finalAvatarUrl = editAvatarUrl

      // Upload new avatar if file is selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl
        } else {
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim() || null,
          bio: editBio.trim() || null,
          avatar_url: finalAvatarUrl.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (!error) {
        setProfile(prev => prev ? {
          ...prev,
          full_name: editFullName.trim() || undefined,
          bio: editBio.trim() || undefined,
          avatar_url: finalAvatarUrl.trim() || undefined
        } : null)
        
        setAvatarFile(null)
        if (editAvatarUrl.startsWith('blob:')) {
          URL.revokeObjectURL(editAvatarUrl)
        }
        
        setShowEditProfile(false)
        alert('Profile updated successfully!')
      } else {
        alert('Error updating profile: ' + error.message)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile')
    } finally {
      setSaving(false)
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
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header */}
            <Card className="mb-8">
              <CardContent className="pt-8">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                      <AvatarImage 
                        src={profile?.avatar_url || undefined} 
                        alt={profile?.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 text-2xl font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {profile?.full_name || profile?.username || 'Your Profile'}
                  </h1>
                  
                  {profile?.full_name && (
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      @{profile?.username}
                    </p>
                  )}
                  
                  <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">
                    {profile?.email}
                  </p>
                  
                  {profile?.bio && (
                    <p className="text-slate-700 dark:text-slate-300 max-w-md mx-auto mb-6">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={() => setShowEditProfile(true)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    {profile?.username && (
                      <Button
                        asChild
                        variant="ghost"
                        className="flex items-center gap-2"
                      >
                        <a
                          href={`/${profile.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Public
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Modal */}
            {showEditProfile && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="card w-full max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
                    <button
                      onClick={() => setShowEditProfile(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Profile Photo
                      </label>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          {editAvatarUrl ? (
                            <img 
                              src={editAvatarUrl} 
                              alt="Avatar preview"
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center text-white dark:text-slate-900 text-xl font-bold">
                              {editFullName?.charAt(0) || profile?.username?.charAt(0) || '?'}
                            </div>
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                              <div className="spinner"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="avatar-upload"
                            disabled={uploading}
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="btn-secondary cursor-pointer"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </label>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            JPG, PNG or GIF (max 1MB)
                          </p>
                        </div>
                      </div>

                      <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">or use URL</span>
                        </div>
                      </div>
                      
                      <input
                        type="url"
                        value={avatarFile ? '' : editAvatarUrl}
                        onChange={(e) => {
                          setAvatarFile(null)
                          setEditAvatarUrl(e.target.value)
                        }}
                        disabled={!!avatarFile}
                        className="input"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="input"
                        placeholder="Your full name"
                        maxLength={100}
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={3}
                        className="input resize-none"
                        placeholder="Tell others about your travel passion..."
                        maxLength={500}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {editBio.length}/500 characters
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => setShowEditProfile(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="btn-primary flex-1"
                      >
                        {saving ? (
                          <span className="flex items-center justify-center">
                            <div className="spinner mr-2"></div>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Locations Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Travel Locations
                  </CardTitle>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </Button>
                </div>
              </CardHeader>
              <CardContent>

                {/* Add Location Form */}
                {showAddForm && (
                  <Card className="mb-6">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Type
                          </label>
                          <select
                            value={locationType}
                            onChange={(e) => setLocationType(e.target.value as 'lived' | 'visited')}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                          >
                            <option value="visited">Visited</option>
                            <option value="lived">Lived</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Country
                          </label>
                          <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                          >
                            <option value="">Select country</option>
                            {countries.map(country => (
                              <option key={country.id} value={country.id}>
                                {country.flag} {country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            City (Optional)
                          </label>
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedCountry}
                            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 disabled:opacity-50"
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
                          <Button
                            onClick={handleAddLocation}
                            disabled={!selectedCountry || saving}
                            className="flex-1"
                          >
                            {saving ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowAddForm(false)
                              setSelectedCountry('')
                              setSelectedCity('')
                            }}
                            variant="secondary"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Locations List */}
                {userLocations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      No locations added yet. Start by adding places you've visited or lived in!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {userLocations.map(location => (
                      <Card key={location.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{location.country.flag}</span>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {location.city ? location.city.name + ', ' : ''}{location.country.name}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {location.type}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleRemoveLocation(location.id)}
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}