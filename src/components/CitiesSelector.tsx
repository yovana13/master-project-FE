import { useState } from 'react';
import { CITIES_BULGARIA } from '../constants/cities';

interface CitiesSelectorProps {
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  label?: string;
  description?: string;
  showSelectedCities?: boolean;
}

export default function CitiesSelector({
  selectedCities,
  onCitiesChange,
  label = 'Изберете градове',
  description = 'Изберете градовете, в които сте готови да работите',
  showSelectedCities = true
}: CitiesSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleCity = (cityKey: string) => {
    if (selectedCities.includes(cityKey)) {
      onCitiesChange(selectedCities.filter(c => c !== cityKey));
    } else {
      onCitiesChange([...selectedCities, cityKey]);
    }
  };

  const handleRemoveCity = (city: string) => {
    onCitiesChange(selectedCities.filter(c => c !== city));
  };

  const getFilteredCities = () => {
    return Object.entries(CITIES_BULGARIA).filter(([key, value]) =>
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div>
      {/* Selected Cities Display */}
      {showSelectedCities && selectedCities.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Избрани градове ({selectedCities.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedCities.map((city) => (
              <div
                key={city}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200"
              >
                <span className="text-sm font-medium">{city}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCity(city)}
                  className="text-indigo-600 hover:text-indigo-800"
                  title="Премахни град"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cities Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <p className="text-xs text-gray-500 mb-2">{description}</p>
        
        <input
          type="text"
          placeholder="Търсене на градове..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2"
        />
        
        <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
          {getFilteredCities().map(([key, value]) => (
            <label
              key={key}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCities.includes(key)}
                onChange={() => handleToggleCity(key)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">
                {key} ({value})
              </span>
            </label>
          ))}
        </div>
        
        {selectedCities.length > 0 && (
          <p className="mt-2 text-xs text-gray-600">
            Избрани {selectedCities.length} {selectedCities.length === 1 ? 'град' : 'града'}
          </p>
        )}
      </div>
    </div>
  );
}
