import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/authContext'
import { useRouter } from 'next/router'
import { CITIES_BULGARIA } from '../constants/cities'
import { Role } from '../enums/role.enum'
import InfoMessage from '../components/InfoMessage'
import AdminsTable from '../components/AdminsTable'

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

interface TaskerBooking {
  id: string;
  userId: string;
  taskerId: string;
  serviceId: string;
  city: string;
  address: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  status: 'pending' | 'accepted';
  details: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    description?: string;
  };
}

export default function Home() {
  const { userId } = useContext(AuthContext);
  const router = useRouter();
  
  // Initialize userRole from localStorage directly
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'client') return Role.client;
      if (storedRole === 'tasker') return Role.tasker;
      if (storedRole === 'admin') return Role.admin;
    }
    return Role.unauthorised;
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Tasker bookings state
  const [taskerBookings, setTaskerBookings] = useState<TaskerBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // Modal form states
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [squareMeters, setSquareMeters] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  
  // Info message state
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Update userRole when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'client') setUserRole(Role.client);
      else if (storedRole === 'tasker') setUserRole(Role.tasker);
      else if (storedRole === 'admin') setUserRole(Role.admin);
      else setUserRole(Role.unauthorised);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchServices();
    
    // Fetch tasker bookings if user is a tasker
    if (userId && userRole === Role.tasker) {
      fetchTaskerBookings();
    }
  }, [userId, userRole]);

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

  const fetchTaskerBookings = async () => {
    if (!userId) return;
    
    try {
      setLoadingBookings(true);
      const response = await fetch(`http://localhost:3007/bookings/pending-accepted/tasker/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasker bookings');
      }
      
      const data = await response.json();
      setTaskerBookings(data);
    } catch (error) {
      console.error('Failed to fetch tasker bookings:', error);
      setTaskerBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:3007/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept booking');
      }

      // Refresh the bookings list
      await fetchTaskerBookings();
      setInfoMessage({ text: 'Booking accepted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error accepting booking:', error);
      setInfoMessage({ text: 'Failed to accept booking. Please try again.', type: 'error' });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:3007/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'declined' }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline booking');
      }

      // Refresh the bookings list
      await fetchTaskerBookings();
      setInfoMessage({ text: 'Booking declined successfully!', type: 'success' });
    } catch (error) {
      console.error('Error declining booking:', error);
      setInfoMessage({ text: 'Failed to decline booking. Please try again.', type: 'error' });
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:3007/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to complete booking');
      }

      // Refresh the bookings list
      await fetchTaskerBookings();
      setInfoMessage({ text: 'Booking marked as complete!', type: 'success' });
    } catch (error) {
      console.error('Error completing booking:', error);
      setInfoMessage({ text: 'Failed to complete booking. Please try again.', type: 'error' });
    }
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
              {!userId && (
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
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-yellow-900">Debug:</span>
              <span className="text-yellow-800">
                State Role: <strong>{userRole || 'null'}</strong>
              </span>
              <span className="text-yellow-800">
                LocalStorage: <strong>{typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'N/A'}</strong>
              </span>
              <span className="text-yellow-800">
                User ID: <strong>{userId || 'null'}</strong>
              </span>
              <span className="text-yellow-800">
                Match: <strong>{userRole === Role.tasker ? 'YES' : 'NO'}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Tasker Bookings Section */}
        {userRole === Role.tasker && (
          <div className="bg-white border-b">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Active Tasks</h2>
                {taskerBookings.length > 0 && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {taskerBookings.length} {taskerBookings.length === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>

              {loadingBookings ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">Loading your tasks...</div>
                </div>
              ) : taskerBookings.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-600 font-medium">No active tasks</p>
                  <p className="text-gray-500 text-sm mt-1">Pending and accepted bookings will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskerBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {booking.status === 'pending' ? 'Pending' : 'Accepted'}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ${(booking.priceCents / 100).toFixed(2)}
                        </span>
                      </div>

                      {/* Service Name */}
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {booking.service.name}
                      </h3>

                      {/* Client Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-gray-600">{booking.user.name}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="text-sm text-gray-600">
                          <div>{booking.address}</div>
                          <div className="text-gray-500">{booking.city}</div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {new Date(booking.startsAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {' at '}
                          {new Date(booking.startsAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {booking.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeclineBooking(booking.id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptBooking(booking.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (booking.user.phone) {
                                window.location.href = `tel:${booking.user.phone}`;
                              } else if (booking.user.email) {
                                window.location.href = `mailto:${booking.user.email}`;
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Contact Client
                          </button>
                          <button
                            onClick={() => handleCompleteBooking(booking.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            Mark as Complete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Table Section */}
        {userRole === Role.admin && (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <AdminsTable />
          </div>
        )}

        {/* Categories */}
        {userRole !== Role.tasker && userRole !== Role.admin && (
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
        )}

        {/* Services */}
        {userRole !== Role.tasker && userRole !== Role.admin && (
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
        )}
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

      {/* Info Message */}
      {infoMessage && (
        <InfoMessage
          message={infoMessage.text}
          type={infoMessage.type}
          onClose={() => setInfoMessage(null)}
        />
      )}
    </div>
  )
}
