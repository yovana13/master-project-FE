import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/authContext'
import { useRouter } from 'next/router'
import { CITIES_BULGARIA } from '../constants/cities'
import { Role } from '../enums/role.enum'
import InfoMessage from '../components/InfoMessage'
import AdminsTable from '../components/AdminsTable'
import BookingModal from '../components/BookingModal'
import TaskerBookingCard from '../components/TaskerBookingCard'

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
  createdAt: string;
  updatedAt: string;
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

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:3007/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh the bookings list
      await fetchTaskerBookings();
      setInfoMessage({ text: 'Booking cancelled successfully!', type: 'success' });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setInfoMessage({ text: 'Failed to cancel booking. Please try again.', type: 'error' });
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
        {/* Hero Section - Only for non-tasker and non-admin users */}
        {userRole !== Role.tasker && userRole !== Role.admin && userRole !== Role.client && (
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
            <div className="px-4 sm:px-6 lg:px-8 py-16 md:py-24">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-xl md:text-xl lg:text-xl font-bold mb-6">
                  Намерете перфектния професионалист за всяка задача
                </h1>
                <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                  Свържете се с проверени и квалифицирани специалисти за почистване, ремонт, монтаж и много повече
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a
                    href="#services"
                    className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold text-base hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    Резервирайте сега
                  </a>
                  <a
                    href="/signup"
                    className="px-6 py-3 bg-indigo-500 bg-opacity-30 text-white rounded-lg font-semibold text-base hover:bg-opacity-40 transition-colors border-2 border-white border-opacity-30"
                  >
                    Станете професионалист
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        {userRole !== Role.tasker && userRole !== Role.admin && (
          <div id="services" className="bg-gray-50 py-16">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Разгледайте нашите услуги
                </h2>
                <p className="text-lg text-gray-600">
                  Изберете категория и намерете професионалиста, от който се нуждаете
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
                {categories.map((category) => {
                  // Category icon mapping
                  const getCategoryIcon = (name: string) => {
                    switch (name.toLowerCase()) {
                      case 'почистване':
                        return (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        );
                      case 'строителни и ремонтни дейности':
                        return (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        );
                      case 'настилки и облицовки':
                        return (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                        );
                      case 'монтаж и сглобяване':
                        return (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        );
                      case 'градинарски услуги':
                        return (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v6m0 0l3-3m-3 3L9 5" />
                          </svg>
                        );
                      default:
                        return (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        );
                    }
                  };

                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all transform hover:scale-105 ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                      }`}
                    >
                      <div className={`w-16 h-16 flex items-center justify-center rounded-full ${
                        activeCategory === category.id 
                          ? 'bg-white bg-opacity-20' 
                          : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'
                      }`}>
                        {getCategoryIcon(category.name)}
                      </div>
                      <span className={`text-sm font-semibold text-center ${
                        activeCategory === category.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Services */}
        {userRole !== Role.tasker && userRole !== Role.admin && (
          <div className="bg-white py-16">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                {categories.find(c => c.id === activeCategory)?.name || 'Услуги'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="group bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-indigo-500 hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                        <svg className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {service.base_price && (
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">от</span>
                          <span className="text-xl font-bold text-indigo-600">${service.base_price}</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg group-hover:text-indigo-600 transition-colors">
                      {service.name}
                    </h3>
                    
                    {service.description && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex items-center text-indigo-600 font-medium text-sm">
                      <span>Резервирай сега</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">Все още няма налични услуги в тази категория</p>
                  <p className="text-gray-500 text-sm mt-2">Моля, проверете отново скоро или изберете друга категория</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {userRole !== Role.tasker && userRole !== Role.admin && (
          <div className="bg-white py-16 md:py-20">
            <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Защо да изберете TaskTrust?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Ние свързваме клиенти с най-добрите професионалисти за домашни услуги
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Проверени професионалисти
                  </h3>
                  <p className="text-gray-600">
                    Всички наши специалисти преминават през строга проверка и верификация за вашата безопасност
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Прозрачни цени
                  </h3>
                  <p className="text-gray-600">
                    Никакви скрити такси. Виждате точната цена преди да потвърдите резервацията си
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Бързо и лесно резервиране
                  </h3>
                  <p className="text-gray-600">
                    Резервирайте услуга за минути. Изберете дата, час и адрес - толкова е просто
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Оценки и отзиви
                  </h3>
                  <p className="text-gray-600">
                    Прочетете реални отзиви от клиенти и изберете най-добрия специалист за вашата задача
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Поддръжка 24/7
                  </h3>
                  <p className="text-gray-600">
                    Нашият екип е на разположение винаги, когато имате нужда от помощ или съвет
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Голяма мрежа от специалисти
                  </h3>
                  <p className="text-gray-600">
                    Хиляди професионалисти в цяла България, готови да ви помогнат с всякаква задача
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {taskerBookings.map((booking) => (
                    <TaskerBookingCard
                      key={booking.id}
                      booking={booking}
                      onAccept={handleAcceptBooking}
                      onDecline={handleDeclineBooking}
                      onCancel={handleCancelBooking}
                      onComplete={handleCompleteBooking}
                      showActions={true}
                    />
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
