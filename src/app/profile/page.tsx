'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, MapPin, Save, Plus, X, Share2, ExternalLink, Edit3, Camera, Upload, Settings, Clock, Globe2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import StarRating from '@/components/StarRating'

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
  transportation_rating?: number
  accommodation_rating?: number
  food_rating?: number
  safety_rating?: number
  activities_rating?: number
  value_rating?: number
  overall_rating?: number
  comment?: string
  visit_date?: string
  created_at?: string
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [locationType, setLocationType] = useState<'lived' | 'visited'>('visited')
  const [modalStep, setModalStep] = useState<'location' | 'rating'>('location')
  const [ratings, setRatings] = useState({
    transportation: 0,
    accommodation: 0,
    food: 0,
    safety: 0,
    activities: 0,
    value: 0,
    overall: 0,
    comment: ''
  })
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'countries' | 'timeline'>('countries')
  const [visitDate, setVisitDate] = useState('')

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
        .order('created_at', { ascending: false })
      
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
      // TODO: Replace with proper toast notification
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
      // TODO: Replace with proper toast notification
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
      // TODO: Replace with proper toast notification
      alert('Please select an image file')
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      // TODO: Replace with proper toast notification
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
        // TODO: Replace with proper toast notification
        alert('Profile updated successfully!')
      } else {
        // TODO: Replace with proper toast notification
        alert('Error updating profile: ' + error.message)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      // TODO: Replace with proper toast notification
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleProceedToRating = () => {
    if (!selectedCountry) return
    setModalStep('rating')
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
          type: locationType,
          visit_date: visitDate || null,
          transportation_rating: ratings.transportation || null,
          accommodation_rating: ratings.accommodation || null,
          food_rating: ratings.food || null,
          safety_rating: ratings.safety || null,
          activities_rating: ratings.activities || null,
          value_rating: ratings.value || null,
          overall_rating: ratings.overall || null,
          comment: ratings.comment || null
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
          .order('created_at', { ascending: false })
        
        if (locationsData) setUserLocations(locationsData as UserLocation[])
        
        // Reset all forms
        setShowAddModal(false)
        setModalStep('location')
        setSelectedCountry('')
        setSelectedCity('')
        setVisitDate('')
        setRatings({
          transportation: 0,
          accommodation: 0,
          food: 0,
          safety: 0,
          activities: 0,
          value: 0,
          overall: 0,
          comment: ''
        })
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

            {/* Travel Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    My Travels
                  </CardTitle>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </Button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab('countries')}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                      activeTab === 'countries'
                        ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Globe2 className="w-4 h-4" />
                    Countries
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                      activeTab === 'timeline'
                        ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Timeline
                  </button>
                </div>
              </CardHeader>
              <CardContent>


                {/* Tab Content */}
                {userLocations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      No locations added yet. Start by adding places you've visited or lived in!
                    </p>
                  </div>
                ) : activeTab === 'countries' ? (
                  /* Countries Tab */
                  <div className="space-y-6">
                    {/* Group locations by country */}
                    {Object.entries(
                      userLocations.reduce((acc, location) => {
                        const countryKey = `${location.country.id}-${location.country.name}`
                        if (!acc[countryKey]) {
                          acc[countryKey] = {
                            country: location.country,
                            locations: []
                          }
                        }
                        acc[countryKey].locations.push(location)
                        return acc
                      }, {} as Record<string, { country: Country; locations: UserLocation[] }>)
                    ).map(([countryKey, { country, locations }]) => (
                      <Card key={countryKey} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{country.flag}</span>
                              <div>
                                <Link 
                                  href={`/country/${country.code.toLowerCase()}`}
                                  className="text-xl font-bold text-slate-900 dark:text-white hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  {country.name}
                                </Link>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {locations.length} {locations.length === 1 ? 'trip' : 'trips'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {locations.map(location => (
                              <div key={location.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant={location.type === 'lived' ? 'default' : 'secondary'}>
                                        {location.type === 'lived' ? '🏠 Lived' : '✈️ Visited'}
                                      </Badge>
                                      {location.city && (
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          {location.city.name}
                                        </span>
                                      )}
                                      {location.visit_date && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                          {new Date(location.visit_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Show ratings if available */}
                                    {location.overall_rating && (
                                      <div className="mb-2">
                                        <StarRating value={location.overall_rating} readonly showValue size="sm" />
                                      </div>
                                    )}
                                    
                                    {/* Show comment if available */}
                                    {location.comment && (
                                      <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-3">
                                        "{location.comment}"
                                      </p>
                                    )}
                                    
                                    {/* Show detailed ratings if available */}
                                    {(location.transportation_rating || location.accommodation_rating || location.food_rating || location.safety_rating || location.activities_rating || location.value_rating) && (
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                        {location.transportation_rating && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-500 dark:text-slate-400">Transport:</span>
                                            <StarRating value={location.transportation_rating} readonly size="sm" />
                                          </div>
                                        )}
                                        {location.accommodation_rating && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-500 dark:text-slate-400">Stay:</span>
                                            <StarRating value={location.accommodation_rating} readonly size="sm" />
                                          </div>
                                        )}
                                        {location.food_rating && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-500 dark:text-slate-400">Food:</span>
                                            <StarRating value={location.food_rating} readonly size="sm" />
                                          </div>
                                        )}
                                        {location.safety_rating && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-500 dark:text-slate-400">Safety:</span>
                                            <StarRating value={location.safety_rating} readonly size="sm" />
                                          </div>
                                        )}
                                        {location.activities_rating && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-500 dark:text-slate-400">Activities:</span>
                                            <StarRating value={location.activities_rating} readonly size="sm" />
                                          </div>
                                        )}
                                        {location.value_rating && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-500 dark:text-slate-400">Value:</span>
                                            <StarRating value={location.value_rating} readonly size="sm" />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Button
                                    onClick={() => handleRemoveLocation(location.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-red-500 ml-2"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Timeline Tab */
                  <div className="space-y-4">
                    {userLocations.map(location => (
                      <Card key={location.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{location.country.flag}</span>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {location.city ? location.city.name + ', ' : ''}
                                  <Link 
                                    href={`/country/${location.country.code.toLowerCase()}`}
                                    className="hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                                  >
                                    {location.country.name}
                                  </Link>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={location.type === 'lived' ? 'default' : 'secondary'} className="text-xs">
                                    {location.type === 'lived' ? '🏠 Lived' : '✈️ Visited'}
                                  </Badge>
                                  {location.visit_date && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(location.visit_date).toLocaleDateString()}
                                    </span>
                                  )}
                                  {location.overall_rating && (
                                    <StarRating value={location.overall_rating} readonly size="sm" showValue />
                                  )}
                                </div>
                                {location.comment && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-2">
                                    "{location.comment}"
                                  </p>
                                )}
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

            {/* Add Location Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {modalStep === 'location' ? 'Add New Location' : 'Rate Your Experience'}
                      </CardTitle>
                      <Button
                        onClick={() => {
                          setShowAddModal(false)
                          setModalStep('location')
                          setSelectedCountry('')
                          setSelectedCity('')
                          setVisitDate('')
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {modalStep === 'rating' && (
                      <p className="text-slate-600 dark:text-slate-400">
                        {countries.find(c => c.id === parseInt(selectedCountry))?.flag} {countries.find(c => c.id === parseInt(selectedCountry))?.name}
                        {selectedCity && (
                          <span> - {cities.find(c => c.id === parseInt(selectedCity))?.name}</span>
                        )}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {modalStep === 'location' ? (
                      // Location Selection Step
                      <div className="space-y-6">
                        <div>
                          <Label className="text-base font-medium mb-3 block">Type</Label>
                          <select
                            value={locationType}
                            onChange={(e) => setLocationType(e.target.value as 'lived' | 'visited')}
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="visited">✈️ Visited</option>
                            <option value="lived">🏠 Lived</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label className="text-base font-medium mb-3 block">Country</Label>
                          <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                          <Label className="text-base font-medium mb-3 block">City (Optional)</Label>
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedCountry}
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Select city</option>
                            {cities.map(city => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <Label className="text-base font-medium mb-3 block">Visit Date (Optional)</Label>
                          <Input
                            type="date"
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => {
                              setShowAddModal(false)
                              setModalStep('location')
                              setSelectedCountry('')
                              setSelectedCity('')
                              setVisitDate('')
                            }}
                            variant="secondary"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleProceedToRating}
                            disabled={!selectedCountry}
                            className="flex-1"
                          >
                            Continue to Rating
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Rating Step
                      <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-base font-medium mb-3 block">Transportation</Label>
                        <StarRating
                          value={ratings.transportation}
                          onChange={(value) => setRatings(prev => ({...prev, transportation: value}))}
                          size="lg"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-base font-medium mb-3 block">Accommodation</Label>
                        <StarRating
                          value={ratings.accommodation}
                          onChange={(value) => setRatings(prev => ({...prev, accommodation: value}))}
                          size="lg"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-base font-medium mb-3 block">Food & Dining</Label>
                        <StarRating
                          value={ratings.food}
                          onChange={(value) => setRatings(prev => ({...prev, food: value}))}
                          size="lg"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-base font-medium mb-3 block">Safety</Label>
                        <StarRating
                          value={ratings.safety}
                          onChange={(value) => setRatings(prev => ({...prev, safety: value}))}
                          size="lg"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-base font-medium mb-3 block">Activities & Attractions</Label>
                        <StarRating
                          value={ratings.activities}
                          onChange={(value) => setRatings(prev => ({...prev, activities: value}))}
                          size="lg"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-base font-medium mb-3 block">Value for Money</Label>
                        <StarRating
                          value={ratings.value}
                          onChange={(value) => setRatings(prev => ({...prev, value: value}))}
                          size="lg"
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-base font-medium mb-3 block">Overall Rating</Label>
                      <StarRating
                        value={ratings.overall}
                        onChange={(value) => setRatings(prev => ({...prev, overall: value}))}
                        size="lg"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="comment" className="text-base font-medium mb-3 block">
                        Your Experience (Optional)
                      </Label>
                      <Textarea
                        id="comment"
                        value={ratings.comment}
                        onChange={(e) => setRatings(prev => ({...prev, comment: e.target.value}))}
                        placeholder="Share your thoughts about this destination..."
                        rows={4}
                        maxLength={500}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {ratings.comment.length}/500 characters
                      </p>
                    </div>
                    
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => setModalStep('location')}
                          variant="secondary"
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleAddLocation}
                          disabled={saving}
                          className="flex-1"
                        >
                          {saving ? 'Adding Location...' : 'Add Location'}
                        </Button>
                      </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}