import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/authContext'
import { useRouter } from 'next/router'
import { CITIES_BULGARIA } from '../constants/cities'

interface Category {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
}

interface Service {
  id: number;
  category_id: number;
  name: string;
  description: string;
  base_price: number;
  pricing_model: 'hourly' | 'sq_m';
}

export default function Home() {
  const { userId, userRole } = useContext(AuthContext);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Modal form states
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [squareMeters, setSquareMeters] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3007/categories');
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setActiveCategory(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3007/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedService(null);
    setCity('');
    setCitySearch('');
    setIsCityDropdownOpen(false);
    setAddress('');
    setHours('');
    setSquareMeters('');
    setAdditionalDescription('');
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) return;

    // Store booking data in sessionStorage
    const bookingData = {
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      pricingModel: selectedService.pricing_model,
      city,
      address,
      hours: selectedService.pricing_model === 'hourly' ? hours : undefined,
      squareMeters: selectedService.pricing_model === 'sq_m' ? squareMeters : undefined,
      additionalDescription,
    };

    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

    // Navigate to booking page
    router.push(`/book/${selectedService.id}`);
  };

  const filteredServices = services.filter(
    service => service.category_id === activeCategory
  );

  const filteredCities = Object.entries(CITIES_BULGARIA).filter(([key, value]) =>
    key.toLowerCase().includes(citySearch.toLowerCase()) ||
    value.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCitySelect = (cityKey: string) => {
    setCity(cityKey);
    setCitySearch(cityKey);
    setIsCityDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Master Project - Home Services</title>
        <meta name="description" content="Master project frontend" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">TaskRabbit Clone</h1>
              {userId ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-medium">{userId}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <a
                    href="/login"
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Login
                  </a>
                  <a
                    href="/signup"
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Sign Up
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

      <main className="min-h-screen bg-gray-50">
        {/* Categories */}
        <div className="bg-white border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-8 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex flex-col items-center gap-2 min-w-fit px-4 py-2 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                    activeCategory === category.id ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {/* Icon placeholder - you can add actual icons here */}
                    <span className="text-2xl">
                      {!['Moving', 'Cleaning', 'Assembly', 'Mounting', 'Outdoor Help', 'Home Repairs', 'Painting'].includes(category.name) && '⚡'}
                    </span>
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap ${
                    activeCategory === category.id ? 'font-semibold' : ''
                  }`}>
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className="bg-white border border-gray-200 rounded-lg px-6 py-4 text-left hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
                )}
                {service.base_price && (
                  <p className="text-sm text-gray-600 mt-2">
                    From <span className="font-semibold">${service.base_price}</span>
                  </p>
                )}
              </button>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No services available in this category yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {showModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Book {selectedService.name}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="relative">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
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
                  placeholder="Search for a city..."
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
                  Address *
                </label>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your address"
                />
              </div>

              {selectedService.pricing_model === 'hourly' && (
                <div>
                  <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                    How many hours do you need? *
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
                    placeholder="e.g., 2"
                  />
                </div>
              )}

              {selectedService.pricing_model === 'sq_m' && (
                <div>
                  <label htmlFor="squareMeters" className="block text-sm font-medium text-gray-700 mb-1">
                    How many square meters? *
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
                    placeholder="e.g., 50"
                  />
                </div>
              )}

              <div>
                <label htmlFor="additionalDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Description
                </label>
                <textarea
                  id="additionalDescription"
                  rows={4}
                  value={additionalDescription}
                  onChange={(e) => setAdditionalDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Any additional details that would help the tasker..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
