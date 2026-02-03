import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '../../context/authContext'
import BookingCalendar from '../../components/BookingCalendar'
import TaskerReviewsModal from '../../components/TaskerReviewsModal'
import ReportUserModal from '../../components/ReportUserModal'
import { CITIES_BULGARIA } from '../../constants/cities'

interface BookingData {
  serviceId: number;
  serviceName: string;
  pricingModel: 'hourly' | 'sq_m';
  city: string;
  address: string;
  hours?: string;
  squareMeters?: string;
  additionalDescription: string;
}

interface Tasker {
  id: number;
  display_name: string;
  bio?: string;
  profile_image_url?: string;
  rating_avg?: number;
  rating_count?: number;
  price_hourly?: number;  // in cents
  price_per_sq_m?: number;  // in cents
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
}

export default function BookService() {
  const router = useRouter();
  const { serviceId } = router.query;
  const { userId } = useContext(AuthContext);
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasker, setSelectedTasker] = useState<Tasker | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);
  const [calculatingTime, setCalculatingTime] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsTasker, setReviewsTasker] = useState<Tasker | null>(null);

  const [showReportUserModal, setShowReportUserModal] = useState(false);
  const [reportedUser, setReportedUser] = useState<{ id: string; name: string } | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<{
    taskerName: string;
    startTime: string;
    endTime: string;
    price: string;
  } | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    // Retrieve booking data from sessionStorage
    const storedData = sessionStorage.getItem('bookingData');
    if (!storedData) {
      setError('No booking data found. Please start from the home page.');
      setLoading(false);
      return;
    }

    const data: BookingData = JSON.parse(storedData);
    setBookingData(data);

    // Fetch available taskers
    fetchAvailableTaskers(serviceId as string, data.city);
  }, [serviceId]);

  const fetchAvailableTaskers = async (serviceId: string, city: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3007/services/${serviceId}/available-taskers?city=${encodeURIComponent(city)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available taskers');
      }

      const data = await response.json();
      setTaskers(data);
    } catch (err) {
      console.error('Error fetching taskers:', err);
      setError('Failed to load available taskers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskerSelect = async (taskerId: number) => {
    const tasker = taskers.find(t => t.id === taskerId);
    if (!tasker) return;

    setSelectedTasker(tasker);

    // For sq_m pricing model, calculate the time first
    if (bookingData?.pricingModel === 'sq_m' && bookingData.squareMeters) {
      try {
        setCalculatingTime(true);
        const response = await fetch(
          `http://localhost:3007/bookings/calculate-time/${taskerId}/${serviceId}?sqMeters=${bookingData.squareMeters}`
        );

        if (!response.ok) {
          throw new Error('Failed to calculate time');
        }

        const data = await response.json();
        setCalculatedHours(data.hourlyEquivalent);
        setShowCalendar(true);
      } catch (err) {
        console.error('Error calculating time:', err);
        alert('Failed to calculate booking time. Please try again.');
      } finally {
        setCalculatingTime(false);
      }
    } else {
      // For hourly pricing, use the hours from bookingData
      setCalculatedHours(null);
      setShowCalendar(true);
    }
  };

  const handleBookingConfirm = async (taskerId: number, selectedSlot: { start: string; end: string }) => {
    if (!bookingData) {
      alert('Липсват данни за резервацията. Моля, започнете отново от началната страница.');
      return;
    }
    
    if (!selectedTasker) {
      alert('Изпълнителят не е избран правилно. Моля, опитайте отново.');
      return;
    }
    
    if (!userId) {
      setShowCalendar(false);
      setShowAuthModal(true);
      return;
    }

    try {
      // Calculate price based on pricing model
      let priceCents = 0;
      
      if (bookingData.pricingModel === 'hourly') {
        const hours = parseFloat(bookingData.hours || '1');
        const hourlyRate = selectedTasker.price_hourly || 0;  // already in cents
        priceCents = Math.round(hourlyRate * hours);
      } else if (bookingData.pricingModel === 'sq_m') {
        const sqMeters = parseFloat(bookingData.squareMeters || '0');
        const sqMRate = selectedTasker.price_per_sq_m || 0;  // already in cents
        priceCents = Math.round(sqMRate * sqMeters);
      }

      if (priceCents === 0) {
        console.error('Price calculation resulted in 0:', {
          pricingModel: bookingData.pricingModel,
          price_hourly: selectedTasker.price_hourly,
          price_per_sq_m: selectedTasker.price_per_sq_m,
          hours: bookingData.hours,
          squareMeters: bookingData.squareMeters,
          selectedTasker
        });
        alert('Warning: Price calculated as $0. Please check tasker rates.');
      }

      const bookingRequest = {
        userId: userId,
        taskerId: taskerId,
        serviceId: bookingData.serviceId,
        city: bookingData.city,
        address: bookingData.address,
        startsAt: selectedSlot.start,
        endsAt: selectedSlot.end,
        priceCents: priceCents,
        details: bookingData.additionalDescription || ''
      };

      const response = await fetch('http://localhost:3007/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create booking' }));
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const booking = await response.json();
      
      // Clear booking data from sessionStorage
      sessionStorage.removeItem('bookingData');
      
      // Close calendar and show success modal
      setShowCalendar(false);
      setBookingConfirmation({
        taskerName: selectedTasker.display_name,
        startTime: new Date(selectedSlot.start).toLocaleString('bg-BG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        endTime: new Date(selectedSlot.end).toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        price: `$${(priceCents / 100).toFixed(2)}`
      });
      setShowBookingSuccess(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      alert(err instanceof Error ? err.message : 'Failed to create booking. Please try again.');
    }
  };

  const handleCloseCalendar = () => {
    setShowCalendar(false);
    setSelectedTasker(null);
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleViewReviews = (tasker: Tasker) => {
    setReviewsTasker(tasker);
    setShowReviewsModal(true);
  };

  const handleCloseReviewsModal = () => {
    setShowReviewsModal(false);
    setReviewsTasker(null);
  };

  const handleReportUser = (taskerId: number, taskerName: string) => {
    setReportedUser({ id: taskerId.toString(), name: taskerName });
    setShowReportUserModal(true);
  };

  const handleReportSuccess = () => {
    setReportSuccess('Report submitted successfully. Thank you for helping keep our community safe.');
    setShowReportUserModal(false);
    setReportedUser(null);
    setTimeout(() => setReportSuccess(null), 5000);
  };

  const handleReportError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Зареждане на налични изпълнители...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Обратно към началото
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Резервирай {bookingData?.serviceName} - Налични изпълнители</title>
        <meta name="description" content="Изберете изпълнител за вашата услуга" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Налични изпълнители</h1>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          {reportSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600">{reportSuccess}</p>
            </div>
          )}

          {/* Booking Summary */}
          {bookingData && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Детайли на резервацията</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Услуга</p>
                  <p className="font-medium text-gray-900">{bookingData.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Град</p>
                  <p className="font-medium text-gray-900">
                    {bookingData.city} ({CITIES_BULGARIA[bookingData.city]})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Адрес</p>
                  <p className="font-medium text-gray-900">{bookingData.address}</p>
                </div>
                {bookingData.hours && (
                  <div>
                    <p className="text-sm text-gray-600">Продължителност</p>
                    <p className="font-medium text-gray-900">{bookingData.hours} часа</p>
                  </div>
                )}
                {bookingData.squareMeters && (
                  <div>
                    <p className="text-sm text-gray-600">Площ</p>
                    <p className="font-medium text-gray-900">{bookingData.squareMeters} m²</p>
                  </div>
                )}
              </div>
              {bookingData.additionalDescription && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Допълнителни детайли</p>
                  <p className="text-gray-900">{bookingData.additionalDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* Taskers List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Налични изпълнители ({taskers.length})
            </h2>

            {taskers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">
                  В момента няма налични изпълнители в {bookingData?.city} за тази услуга.
                </p>
                <button
                  onClick={handleBack}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Опитайте друга услуга
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {taskers.map((tasker) => (
                  <div
                    key={tasker.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <button
                        onClick={() => handleViewReviews(tasker)}
                        className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                      >
                        {tasker.profile_image_url ? (
                          <img
                            src={tasker.profile_image_url}
                            alt={tasker.display_name}
                            className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                            <span className="text-2xl text-gray-500">
                              {tasker.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {tasker.display_name}
                          </h3>
                          {tasker.verification_status === 'verified' && (
                            <span className="inline-flex items-center text-blue-600" title="Потвърден изпълнител">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        
                        {/* Rating */}
                        <button
                          onClick={() => handleViewReviews(tasker)}
                          className="flex items-center gap-1 mb-2 hover:opacity-80 transition-opacity"
                        >
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">
                            {tasker.rating_avg ? Number(tasker.rating_avg).toFixed(1) : '0.0'}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({tasker.rating_count || 0} отзива)
                          </span>
                        </button>

                        {/* Price */}
                        <div className="text-sm">
                          {bookingData?.pricingModel === 'hourly' && tasker.price_hourly && (
                            <span className="font-semibold text-indigo-600">
                              ${(tasker.price_hourly / 100).toFixed(2)}/ч
                            </span>
                          )}
                          {bookingData?.pricingModel === 'sq_m' && tasker.price_per_sq_m && (
                            <span className="font-semibold text-indigo-600">
                              ${(tasker.price_per_sq_m / 100).toFixed(2)}/m²
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {tasker.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{tasker.bio}</p>
                    )}

                    <div className="space-y-2">
                      <button
                        onClick={() => handleTaskerSelect(tasker.id)}
                        disabled={calculatingTime && selectedTasker?.id === tasker.id}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {calculatingTime && selectedTasker?.id === tasker.id ? 'Изчисляване...' : 'Избери изпълнител'}
                      </button>
                      <button
                        onClick={() => handleReportUser(tasker.id, tasker.display_name)}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Докладвай изпълнител
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Booking Calendar Modal */}
      {selectedTasker && bookingData && (
        <BookingCalendar
          isOpen={showCalendar}
          onClose={handleCloseCalendar}
          taskerId={selectedTasker.id}
          taskerName={selectedTasker.display_name}
          bookingHours={calculatedHours || parseFloat(bookingData.hours || '1')}
          pricingModel={bookingData.pricingModel}
          squareMeters={bookingData.squareMeters}
          onBookingConfirm={handleBookingConfirm}
        />
      )}

      {/* Tasker Reviews Modal */}
      {reviewsTasker && (
        <TaskerReviewsModal
          isOpen={showReviewsModal}
          taskerId={reviewsTasker.id}
          taskerName={reviewsTasker.display_name}
          taskerImage={reviewsTasker.profile_image_url}
          averageRating={reviewsTasker.average_rating}
          totalReviews={reviewsTasker.total_reviews}
          verificationStatus={reviewsTasker.verification_status}
          onClose={handleCloseReviewsModal}
        />
      )}

      {/* Report User Modal */}
      {reportedUser && (
        <ReportUserModal
          isOpen={showReportUserModal}
          reporterId={userId}
          reportedUserId={reportedUser.id}
          reportedUserName={reportedUser.name}
          onClose={() => {
            setShowReportUserModal(false);
            setReportedUser(null);
          }}
          onSuccess={handleReportSuccess}
          onError={handleReportError}
        />
      )}

      {/* Authentication Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowAuthModal(false)}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Изисква се вход
                </h3>
                <p className="text-gray-600">
                  Трябва да влезете в профила си, за да направите резервация.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    router.push('/login');
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Влизане
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    router.push('/signup');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
                >
                  Регистрация
                </button>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                >
                  Отказ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {showBookingSuccess && bookingConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Резервацията е потвърдена!
                </h3>
                <p className="text-gray-600 mb-4">
                  Вашата резервация беше успешно създадена.
                </p>

                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Изпълнител</p>
                    <p className="font-medium text-gray-900">{bookingConfirmation.taskerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Време</p>
                    <p className="font-medium text-gray-900">
                      {bookingConfirmation.startTime}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      До: {bookingConfirmation.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Обща цена</p>
                    <p className="font-semibold text-indigo-600 text-lg">{bookingConfirmation.price}</p>
                  </div>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => {
                  setShowBookingSuccess(false);
                  setBookingConfirmation(null);
                  router.push('/');
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Към началната страница
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
