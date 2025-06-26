'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, MapPin, Save, Plus, X, Share2, ExternalLink, Edit3, Camera, FileText, Upload, Image as ImageIcon } from 'lucide-react'

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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
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
          // If upload failed, don't proceed
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
        // Update local state
        setProfile(prev => prev ? {
          ...prev,
          full_name: editFullName.trim() || undefined,
          bio: editBio.trim() || undefined,
          avatar_url: finalAvatarUrl.trim() || undefined
        } : null)
        
        // Clean up
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
            <div className="relative inline-block mb-4">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                  {profile?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {profile?.full_name || profile?.username || 'Your Profile'}
            </h1>
            {profile?.full_name && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                @{profile?.username}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {profile?.email}
            </p>
            {profile?.bio && (
              <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto mb-4">
                {profile.bio}
              </p>
            )}
            <div className="flex justify-center space-x-3 mb-4">
              <button
                onClick={() => setShowEditProfile(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </button>
              {profile?.username && (
                <a
                  href={`/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public
                </a>
              )}
            </div>
          </div>

          {/* Edit Profile Modal */}
          {showEditProfile && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                  <button
                    onClick={() => setShowEditProfile(false)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                      <Camera className="w-4 h-4 inline mr-2" />
                      Profile Photo
                    </label>
                    
                    {/* Current/Preview Avatar */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        {editAvatarUrl ? (
                          <img 
                            src={editAvatarUrl} 
                            alt="Avatar preview"
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                            {editFullName?.charAt(0) || profile?.username?.charAt(0) || '?'}
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
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
                          className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload Photo'}
                        </label>
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          JPG, PNG or GIF (max 5MB)
                        </p>
                      </div>
                    </div>

                    {/* Or URL Input */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or use URL</span>
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
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                      placeholder="https://example.com/your-photo.jpg"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                      <UserIcon className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Your full name"
                      maxLength={100}
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Bio
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                      placeholder="Tell the world about your travel passion..."
                      maxLength={500}
                    />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {editBio.length}/500 characters
                    </p>
                  </div>

                  {/* Preview */}
                  {(editAvatarUrl || editFullName || editBio) && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview:</p>
                      <div className="text-center">
                        {editAvatarUrl ? (
                          <img 
                            src={editAvatarUrl} 
                            alt="Preview"
                            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-2">
                            {editFullName?.charAt(0) || profile?.username?.charAt(0) || '?'}
                          </div>
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {editFullName || profile?.username}
                        </h3>
                        {editBio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {editBio}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowEditProfile(false)}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center">
                          <div className="spinner mr-2"></div>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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