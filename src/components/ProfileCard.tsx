'use client'

import { Profile } from '@/types'

interface ProfileCardProps {
  profile: Profile
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const { user, locations } = profile

  const livedLocations = locations.filter(loc => loc.type === 'lived')
  const visitedLocations = locations.filter(loc => loc.type === 'visited')

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 max-w-md hover-scale">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          @{user.username || user.email?.split('@')[0]}
        </h3>
        {user.full_name && (
          <p className="text-gray-600 dark:text-gray-400">{user.full_name}</p>
        )}
        {user.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{user.bio}</p>
        )}
      </div>

      <div className="space-y-4">
        {livedLocations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <span className="mr-2">🏠</span>
              Lived in ({livedLocations.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {livedLocations.map(location => (
                <span
                  key={location.id}
                  className="inline-flex items-center bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium"
                  title={`${location.city?.name || ''} ${location.country?.name || ''}`}
                >
                  {location.country?.flag} {location.city?.name || location.country?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {visitedLocations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <span className="mr-2">✈️</span>
              Visited ({visitedLocations.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {visitedLocations.map(location => (
                <span
                  key={location.id}
                  className="inline-flex items-center bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium"
                  title={`${location.city?.name || ''} ${location.country?.name || ''}`}
                >
                  {location.country?.flag} {location.city?.name || location.country?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {locations.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No travel data yet</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{locations.length} locations total</span>
          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}