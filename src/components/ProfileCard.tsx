'use client'

import { Profile } from '@/types'

interface ProfileCardProps {
  profile: Profile
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const { user, lived_countries, visited_countries } = profile

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl text-gray-600">
            {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          @{user.username || user.email?.split('@')[0]}
        </h3>
        {user.full_name && (
          <p className="text-gray-600">{user.full_name}</p>
        )}
        {user.bio && (
          <p className="text-sm text-gray-600 mt-2">{user.bio}</p>
        )}
      </div>

      <div className="space-y-4">
        {lived_countries.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              🏠 Lived in ({lived_countries.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {lived_countries.map(country => (
                <span
                  key={country.code}
                  className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                  title={country.name}
                >
                  {country.flag} {country.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {visited_countries.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              ✈️ Visited ({visited_countries.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {visited_countries.map(country => (
                <span
                  key={country.code}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                  title={country.name}
                >
                  {country.flag} {country.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {lived_countries.length === 0 && visited_countries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No travel data yet</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{lived_countries.length + visited_countries.length} countries total</span>
          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}