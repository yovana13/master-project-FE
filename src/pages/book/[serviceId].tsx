import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '../../context/authContext'
import BookingCalendar from '../../components/BookingCalendar'

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
  service_radius_km: number;
  average_rating?: number;
  total_reviews?: number;
  hourly_rate?: number;
  sq_m_rate?: number;
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
    if (!bookingData || !selectedTasker || !userId) {
      alert('Missing required booking information');
      return;
    }

    try {
      // Calculate price based on pricing model
      let priceCents = 0;
      
      if (bookingData.pricingModel === 'hourly') {
        const hours = parseFloat(bookingData.hours || '1');
        const hourlyRate = selectedTasker.hourly_rate || 0;
        priceCents = Math.round(hourlyRate * hours * 100);
        console.log('Hourly pricing:', { hours, hourlyRate, priceCents });
      } else if (bookingData.pricingModel === 'sq_m') {
        const sqMeters = parseFloat(bookingData.squareMeters || '0');
        const sqMRate = selectedTasker.sq_m_rate || 0;
        priceCents = Math.round(sqMRate * sqMeters * 100);
        console.log('Sq m pricing:', { sqMeters, sqMRate, priceCents });
      }

      if (priceCents === 0) {
        console.error('Price calculation resulted in 0:', {
          pricingModel: bookingData.pricingModel,
          hourly_rate: selectedTasker.hourly_rate,
          sq_m_rate: selectedTasker.sq_m_rate,
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
      
      // Show success message and redirect
      alert(`Booking confirmed!\nTasker: ${selectedTasker.display_name}\nTime: ${new Date(selectedSlot.start).toLocaleString()} - ${new Date(selectedSlot.end).toLocaleString()}\nPrice: $${(priceCents / 100).toFixed(2)}`);
      
      // Redirect to home or bookings page
      router.push('/');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading available taskers...</div>
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
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Book {bookingData?.serviceName} - Available Taskers</title>
        <meta name="description" content="Select a tasker for your service" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Available Taskers</h1>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Booking Summary */}
          {bookingData && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-medium text-gray-900">{bookingData.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-medium text-gray-900">{bookingData.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{bookingData.address}</p>
                </div>
                {bookingData.hours && (
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium text-gray-900">{bookingData.hours} hours</p>
                  </div>
                )}
                {bookingData.squareMeters && (
                  <div>
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-medium text-gray-900">{bookingData.squareMeters} m²</p>
                  </div>
                )}
              </div>
              {bookingData.additionalDescription && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Additional Details</p>
                  <p className="text-gray-900">{bookingData.additionalDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* Taskers List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Taskers ({taskers.length})
            </h2>

            {taskers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">
                  No taskers available in {bookingData?.city} for this service at the moment.
                </p>
                <button
                  onClick={handleBack}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Try Another Service
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
                      {tasker.profile_image_url ? (
                        <img
                          src={tasker.profile_image_url}
                          alt={tasker.display_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl text-gray-500">
                            {tasker.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {tasker.display_name}
                        </h3>
                        {tasker.average_rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg
                              className="w-5 h-5 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">
                              {tasker.average_rating.toFixed(1)}
                            </span>
                            {tasker.total_reviews && (
                              <span className="text-sm text-gray-500">
                                ({tasker.total_reviews} reviews)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {tasker.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{tasker.bio}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {bookingData?.pricingModel === 'hourly' && tasker.hourly_rate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Hourly Rate</span>
                          <span className="font-semibold text-gray-900">
                            ${tasker.hourly_rate}/hr
                          </span>
                        </div>
                      )}
                      {bookingData?.pricingModel === 'sq_m' && tasker.sq_m_rate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rate per m²</span>
                          <span className="font-semibold text-gray-900">
                            ${tasker.sq_m_rate}/m²
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleTaskerSelect(tasker.id)}
                      disabled={calculatingTime && selectedTasker?.id === tasker.id}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {calculatingTime && selectedTasker?.id === tasker.id ? 'Calculating...' : 'Select Tasker'}
                    </button>
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
    </div>
  );
}
