import { useState } from 'react';
import { CITIES_BULGARIA } from '../constants/cities';

interface Service {
  id: number;
  name: string;
  pricing_model: 'hourly' | 'sq_m';
}

interface BookingModalProps {
  isOpen: boolean;
  service: Service | null;
  onClose: () => void;
  onSubmit: (bookingData: {
    serviceId: number;
    serviceName: string;
    pricingModel: 'hourly' | 'sq_m';
    city: string;
    address: string;
    hours?: string;
    squareMeters?: string;
    additionalDescription: string;
  }) => void;
}

export default function BookingModal({ isOpen, service, onClose, onSubmit }: BookingModalProps) {
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [squareMeters, setSquareMeters] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');

  const filteredCities = Object.entries(CITIES_BULGARIA).filter(([key, value]) =>
    key.toLowerCase().includes(citySearch.toLowerCase()) ||
    value.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCitySelect = (cityKey: string) => {
    const cyrillicName = CITIES_BULGARIA[cityKey];
    setCity(cityKey);
    setCitySearch(`${cityKey} (${cyrillicName})`);
    setIsCityDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service) return;

    const bookingData = {
      serviceId: service.id,
      serviceName: service.name,
      pricingModel: service.pricing_model,
      city,
      address,
      hours: service.pricing_model === 'hourly' ? hours : undefined,
      squareMeters: service.pricing_model === 'sq_m' ? squareMeters : undefined,
      additionalDescription,
    };

    onSubmit(bookingData);
    
    // Reset form
    setCity('');
    setCitySearch('');
    setAddress('');
    setHours('');
    setSquareMeters('');
    setAdditionalDescription('');
  };

  const handleClose = () => {
    setCity('');
    setCitySearch('');
    setIsCityDropdownOpen(false);
    setAddress('');
    setHours('');
    setSquareMeters('');
    setAdditionalDescription('');
    onClose();
  };

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Резервирай {service.name}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Град *
            </label>
            <input
              id="city"
              type="text"
              required
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setIsCityDropdownOpen(true);
                if (!e.target.value) setCity('');
              }}
              onFocus={() => setIsCityDropdownOpen(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Търсене на град..."
              autoComplete="off"
            />
            {isCityDropdownOpen && filteredCities.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCitySelect(key)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    {key} ({value})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Адрес *
            </label>
            <input
              id="address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Въведете вашия адрес"
            />
          </div>

          {service.pricing_model === 'hourly' && (
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                Колко часа ви трябват? *
              </label>
              <input
                id="hours"
                type="number"
                min="1"
                step="0.5"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="напр. 2"
              />
            </div>
          )}

          {service.pricing_model === 'sq_m' && (
            <div>
              <label htmlFor="squareMeters" className="block text-sm font-medium text-gray-700 mb-1">
                Колко квадратни метра? *
              </label>
              <input
                id="squareMeters"
                type="number"
                min="1"
                step="0.1"
                required
                value={squareMeters}
                onChange={(e) => setSquareMeters(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="напр. 50"
              />
            </div>
          )}

          <div>
            <label htmlFor="additionalDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Допълнително описание
            </label>
            <textarea
              id="additionalDescription"
              rows={4}
              value={additionalDescription}
              onChange={(e) => setAdditionalDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Допълнителни детайли, които биха помогнали на изпълнителя..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Продължи
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
