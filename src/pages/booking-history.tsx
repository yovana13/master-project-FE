import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { useRouter } from 'next/router';
import { Role } from '../enums/role.enum';
import InfoMessage from '../components/InfoMessage';
import LeaveReviewModal from '../components/LeaveReviewModal';
import ViewReviewModal from '../components/ViewReviewModal';

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
  status: 'completed' | 'declined' | 'cancelled' | 'no_show';
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
  reviewStatus?: {
    hasUserReview: boolean;
    hasTaskerReview: boolean;
  };
}

interface ReviewStatus {
  hasUserReview: boolean;
  hasTaskerReview: boolean;
  userReview?: any;
  taskerReview?: any;
}

type StatusFilter = 'all' | 'completed' | 'declined' | 'cancelled' | 'no_show';

export default function BookingHistory() {
  const { userId } = useContext(AuthContext);
  const router = useRouter();
  
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'tasker') return Role.tasker;
      if (storedRole === 'client') return Role.client;
      if (storedRole === 'admin') return Role.admin;
    }
    return Role.unauthorised;
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [infoMessage, setInfoMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showViewReviewModal, setShowViewReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    if (userRole !== Role.tasker) {
      router.push('/');
      return;
    }

    fetchBookingHistory();
  }, [userId, userRole, router]);

  const fetchBookingHistory = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3007/bookings?taskerId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking history');
      }
      
      const data = await response.json();
      // Filter to only show completed, declined, cancelled, and no_show statuses
      const filteredData = data.filter((booking: Booking) => 
        ['completed', 'declined', 'cancelled', 'no_show'].includes(booking.status)
      );
      setBookings(filteredData);
    } catch (error) {
      console.error('Failed to fetch booking history:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handleViewReview = async (booking: Booking) => {
    try {
      const response = await fetch(`http://localhost:3007/reviews/booking/${booking.id}/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.taskerReview) {
          setSelectedReview(data.taskerReview);
          setSelectedBooking(booking);
          setShowViewReviewModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch review:', error);
      setInfoMessage({ text: 'Failed to load review. Please try again.', type: 'error' });
    }
  };

  const handleReviewSuccess = async () => {
    await fetchBookingHistory();
    setInfoMessage({ text: 'Review submitted successfully!', type: 'success' });
  };

  const handleReviewError = (message: string) => {
    setInfoMessage({ text: message, type: 'error' });
  };

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      no_show: 'bg-orange-100 text-orange-800',
    }[status] || 'bg-gray-100 text-gray-800';

    const label = {
      completed: 'Completed',
      declined: 'Declined',
      cancelled: 'Cancelled',
      no_show: 'No Show',
    }[status] || status;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles}`}>
        {label}
      </span>
    );
  };

  const statusCounts = {
    all: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    declined: bookings.filter(b => b.status === 'declined').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    no_show: bookings.filter(b => b.status === 'no_show').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading booking history...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Booking History - Master Project</title>
        <meta name="description" content="View your booking history" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking History</h1>
            <p className="text-gray-600">View all your completed, declined, cancelled, and no-show bookings</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-2">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'completed', label: 'Completed' },
                { key: 'declined', label: 'Declined' },
                { key: 'cancelled', label: 'Cancelled' },
                { key: 'no_show', label: 'No Show' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as StatusFilter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-20">
                    {statusCounts[key as keyof typeof statusCounts]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Grid */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'You don\'t have any booking history yet.' 
                  : `You don't have any ${statusFilter} bookings.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Status and Price */}
                  <div className="flex items-center justify-between mb-4">
                    {getStatusBadge(booking.status)}
                    <span className="text-xl font-bold text-gray-900">
                      ${(booking.priceCents / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Service Name */}
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">
                    {booking.service.name}
                  </h3>

                  {/* Client Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-600">{booking.user.name}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2">
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
                    <div className="flex items-center gap-2">
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
                  </div>

                  {/* Additional Details */}
                  {booking.details && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium text-gray-700">Details: </span>
                        {booking.details}
                      </p>
                    </div>
                  )}

                  {/* Review Button for Completed Bookings */}
                  {booking.status === 'completed' && (
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      {booking.reviewStatus?.hasTaskerReview ? (
                        <button
                          onClick={() => handleViewReview(booking)}
                          className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                        >
                          View Your Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveReview(booking)}
                          className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Leave a Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave Review Modal */}
      <LeaveReviewModal
        isOpen={showReviewModal}
        booking={selectedBooking}
        userId={userId}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedBooking(null);
        }}
        onSuccess={handleReviewSuccess}
        onError={handleReviewError}
      />

      {/* View Review Modal */}
      <ViewReviewModal
        isOpen={showViewReviewModal}
        booking={selectedBooking}
        review={selectedReview}
        onClose={() => {
          setShowViewReviewModal(false);
          setSelectedReview(null);
          setSelectedBooking(null);
        }}
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
  );
}
