import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/authContext'
import { useRouter } from 'next/router'
import { CITIES_BULGARIA } from '../constants/cities'
import { Role } from '../enums/role.enum'
import InfoMessage from '../components/InfoMessage'
import AdminsTable from '../components/AdminsTable'
import BookingModal from '../components/BookingModal'

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
  };

  const handleBookingSubmit = (bookingData: {
    serviceId: number;
    serviceName: string;
    pricingModel: 'hourly' | 'sq_m';
    city: string;
    address: string;
    hours?: string;
    squareMeters?: string;
    additionalDescription: string;
  }) => {
    // Store booking data in sessionStorage
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

    // Navigate to booking page
    router.push(`/book/${bookingData.serviceId}`);
  };

  const filteredServices = services.filter(
    service => service.category_id === activeCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Зареждане...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>TaskTrust - Домашни услуги</title>
        <meta name="description" content="TaskTrust - Платформа за домашни услуги" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Tasker Bookings Section */}
        {userRole === Role.tasker && (
          <div className="bg-white border-b">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Вашите активни задачи</h2>
                {taskerBookings.length > 0 && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {taskerBookings.length} {taskerBookings.length === 1 ? 'задача' : 'задачи'}
                  </span>
                )}
              </div>

              {loadingBookings ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">Зареждане на задачите...</div>
                </div>
              ) : taskerBookings.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-600 font-medium">Няма активни задачи</p>
                  <p className="text-gray-500 text-sm mt-1">Чакащите и приетите резервации ще се показват тук</p>
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
                          {booking.status === 'pending' ? 'Чакаща' : 'Приета'}
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
                            Откажи
                          </button>
                          <button
                            onClick={() => handleAcceptBooking(booking.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            Приеми
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
                            Свържи се с клиента
                          </button>
                          <button
                            onClick={() => handleCompleteBooking(booking.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          >
                            Маркирай като завършена
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
                    От <span className="font-semibold">${service.base_price}</span>
                  </p>
                )}
              </button>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Все още няма налични услуги в тази категория.</p>
            </div>
          )}
        </div>
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showModal}
        service={selectedService}
        onClose={handleCloseModal}
        onSubmit={handleBookingSubmit}
      />

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
