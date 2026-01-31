import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import EditBookingModal from '../components/EditBookingModal';

interface Tasker {
  id: string;
  display_name: string;
  profile_image_url?: string;
}

interface Service {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  userId: string;
  taskerId: string;
  serviceId: string;
  city: string;
  address: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  status: 'pending' | 'accepted' | 'completed' | 'canceled' | 'declined' | 'no_show';
  details: string;
  createdAt: string;
  updatedAt: string;
  tasker?: Tasker;
  service?: Service;
}

interface GroupedBookings {
  active: Booking[];
  completed: Booking[];
  inactive: Booking[];
}

export default function MyBookings() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:3007/bookings?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchBookings();
    setShowEditModal(false);
    setEditingBooking(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBooking(null);
  };

  const groupBookings = (bookings: Booking[]): GroupedBookings => {
    return {
      active: bookings.filter(b => b.status === 'pending' || b.status === 'accepted'),
      completed: bookings.filter(b => b.status === 'completed'),
      inactive: bookings.filter(b => ['canceled', 'declined', 'no_show'].includes(b.status)),
    };
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadgeColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const canEdit = (status: Booking['status']) => {
    return status === 'pending' || status === 'accepted';
  };

  const renderBookingCard = (booking: Booking) => (
    <div
      key={booking.id}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.service?.name || 'Service'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(booking.status)}`}>
              {formatStatus(booking.status)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Booking ID: {booking.id.substring(0, 8)}...
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            ${(booking.priceCents / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Tasker Info */}
        {booking.tasker && (
          <div className="flex items-center gap-3">
            {booking.tasker.profile_image_url ? (
              <img
                src={booking.tasker.profile_image_url}
                alt={booking.tasker.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-lg text-gray-500">
                  {booking.tasker.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {booking.tasker.display_name}
              </p>
              <p className="text-xs text-gray-500">Tasker</p>
            </div>
          </div>
        )}

        {/* Date and Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(booking.startsAt)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{booking.address}, {booking.city}</span>
        </div>

        {/* Details */}
        {booking.details && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Details:</span> {booking.details}
            </p>
          </div>
        )}

        {/* Created Date */}
        <div className="pt-2 text-xs text-gray-500">
          Booked on {new Date(booking.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Edit Button */}
      {canEdit(booking.status) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleEdit(booking)}
            className="w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Booking
          </button>
        </div>
      )}
    </div>
  );

  const grouped = groupBookings(bookings);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>My Bookings</title>
        <meta name="description" content="View all your bookings" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            </div>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Start by booking a service!</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Bookings (Pending & Accepted) */}
              {grouped.active.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Active Bookings
                    <span className="text-sm font-normal text-gray-500">({grouped.active.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grouped.active.map(renderBookingCard)}
                  </div>
                </section>
              )}

              {/* Completed Bookings */}
              {grouped.completed.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Completed
                    <span className="text-sm font-normal text-gray-500">({grouped.completed.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grouped.completed.map(renderBookingCard)}
                  </div>
                </section>
              )}

              {/* Inactive Bookings (Canceled, Declined, No Show) */}
              {grouped.inactive.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Past Issues
                    <span className="text-sm font-normal text-gray-500">({grouped.inactive.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grouped.inactive.map(renderBookingCard)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          booking={editingBooking}
          taskerId={editingBooking.taskerId}
          bookingDurationHours={(() => {
            const start = new Date(editingBooking.startsAt);
            const end = new Date(editingBooking.endsAt);
            return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          })()}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
