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
  code: string
  name: string
  flag: string
}

export interface UserCountry {
  id: string
  user_id: string
  country_code: string
  type: 'lived' | 'visited'
  created_at: string
}

export interface Profile {
  user: User
  lived_countries: Country[]
  visited_countries: Country[]
}