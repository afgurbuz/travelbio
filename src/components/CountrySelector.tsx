'use client'

import { useState } from 'react'
import { countries } from '@/lib/countries'
import { Country } from '@/types'

interface CountrySelectorProps {
  title: string
  selectedCountries: Country[]
  onCountriesChange: (countries: Country[]) => void
  maxSelection?: number
}

export default function CountrySelector({
  title,
  selectedCountries,
  onCountriesChange,
  maxSelection
}: CountrySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCountryToggle = (country: Country) => {
    const isSelected = selectedCountries.some(c => c.code === country.code)
    
    if (isSelected) {
      onCountriesChange(selectedCountries.filter(c => c.code !== country.code))
    } else {
      if (maxSelection && selectedCountries.length >= maxSelection) {
        return
      }
      onCountriesChange([...selectedCountries, country])
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
      
      {/* Selected Countries */}
      {selectedCountries.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {selectedCountries.map(country => (
              <span
                key={country.code}
                className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <span className="mr-1">{country.flag}</span>
                {country.name}
                <button
                  onClick={() => handleCountryToggle(country)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Country List */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {filteredCountries.map(country => {
          const isSelected = selectedCountries.some(c => c.code === country.code)
          const isDisabled = maxSelection && selectedCountries.length >= maxSelection && !isSelected
          
          return (
            <button
              key={country.code}
              onClick={() => handleCountryToggle(country)}
              disabled={isDisabled}
              className={`flex items-center p-2 rounded-md text-left transition-colors ${
                isSelected
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : isDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2 text-lg">{country.flag}</span>
              <span className="text-sm">{country.name}</span>
            </button>
          )
        })}
      </div>
      
      {maxSelection && (
        <p className="text-xs text-gray-500 mt-2">
          Maximum {maxSelection} countries can be selected
        </p>
      )}
    </div>
  )
}