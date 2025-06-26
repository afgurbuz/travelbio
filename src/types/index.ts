export interface User {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  bio?: string
  created_at: string
}

export interface Country {
  id: number
  code: string
  name: string
  flag: string
}

export interface City {
  id: number
  name: string
  country_id: number
  latitude?: number
  longitude?: number
}

export interface UserLocation {
  id: string
  user_id: string
  country_id: number
  city_id?: number
  type: 'lived' | 'visited'
  created_at: string
  country?: Country
  city?: City
}

export interface Profile {
  user: User
  locations: UserLocation[]
}