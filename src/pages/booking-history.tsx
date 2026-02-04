import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { useRouter } from 'next/router';
import { Role } from '../enums/role.enum';
import InfoMessage from '../components/InfoMessage';
import LeaveReviewModal from '../components/LeaveReviewModal';
import ViewReviewModal from '../components/ViewReviewModal';
import ReportUserModal from '../components/ReportUserModal';

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
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  tasker?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
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

  const [showReportUserModal, setShowReportUserModal] = useState(false);
  const [reportedUser, setReportedUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    fetchBookingHistory();
  }, [userId, userRole, router]);

  const fetchBookingHistory = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const endpoint = userRole === Role.tasker
        ? `http://localhost:3007/bookings?taskerId=${userId}`
        : `http://localhost:3007/bookings?userId=${userId}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Неуспешно зареждане на историята на резервациите');
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
        const review = userRole === Role.tasker ? data.taskerReview : data.userReview;
        if (review) {
          setSelectedReview(review);
          setSelectedBooking(booking);
          setShowViewReviewModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch review:', error);
      setInfoMessage({ text: 'Неуспешно зареждане на отзива. Моля, опитайте отново.', type: 'error' });
    }
  };

  const handleReviewSuccess = async () => {
    await fetchBookingHistory();
    setInfoMessage({ text: 'Отзивът е изпратен успешно!', type: 'success' });
  };

  const handleReviewError = (message: string) => {
    setInfoMessage({ text: message, type: 'error' });
  };

  const handleReportUser = (userId: string, userName: string) => {
    setReportedUser({ id: userId, name: userName });
    setShowReportUserModal(true);
  };

  const handleReportSuccess = () => {
    setInfoMessage({ text: 'Докладът е изпратен успешно. Благодарим ви, че помагате за безопасността на общността.', type: 'success' });
    setShowReportUserModal(false);
    setReportedUser(null);
  };

  const handleReportError = (errorMessage: string) => {
    setInfoMessage({ text: errorMessage, type: 'error' });
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
      completed: 'Завършена',
      declined: 'Отказана',
      cancelled: 'Отменена',
      no_show: 'Неявяване',
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
        <div className="text-gray-600">Зареждане на историята на резервациите...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>История на резервациите - Master Project</title>
        <meta name="description" content="Преглед на вашата история на резервации" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">История на резервациите</h1>
            <p className="text-gray-600">Преглед на всички завършени, отказани, отменени и неявявания резервации</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-2">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Всички' },
                { key: 'completed', label: 'Завършени' },
                { key: 'declined', label: 'Отказани' },
                { key: 'cancelled', label: 'Отменени' },
                { key: 'no_show', label: 'Неявявания' },
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Няма намерени резервации</h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'Още нямате история на резервации.' 
                  : `Нямате ${statusFilter === 'completed' ? 'завършени' : statusFilter === 'declined' ? 'отказани' : statusFilter === 'cancelled' ? 'отменени' : 'неявявания'} резервации.`}
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
                      €{(booking.priceCents / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Service Name */}
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">
                    {booking.service.name}
                  </h3>

                  {/* Person Info (Client for Taskers, Tasker for Clients) */}
                  <div className="space-y-2 mb-4">
                    {userRole === Role.tasker && booking.user && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-gray-600">{booking.user.name}</span>
                      </div>
                    )}
                    
                    {userRole === Role.client && booking.tasker && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-gray-600">{booking.tasker.display_name}</span>
                        {booking.tasker.verification_status === 'verified' && (
                          <span className="inline-flex items-center text-blue-600" title="Потвърден изпълнител">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    )}

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
                        {new Date(booking.startsAt).toLocaleDateString('bg-BG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' в '}
                        {new Date(booking.startsAt).toLocaleTimeString('bg-BG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {booking.details && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium text-gray-700">Детайли: </span>
                        {booking.details}
                      </p>
                    </div>
                  )}

                  {/* Review Button for Completed Bookings */}
                  {booking.status === 'completed' && (
                    <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                      {(userRole === Role.tasker && booking.reviewStatus?.hasTaskerReview) || 
                       (userRole === Role.client && booking.reviewStatus?.hasUserReview) ? (
                        <button
                          onClick={() => handleViewReview(booking)}
                          className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Преглед на вашия отзив
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveReview(booking)}
                          className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Оставете отзив
                        </button>
                      )}
                      
                      {/* Report User Button */}
                      {userRole === Role.client && booking.tasker && (
                        <button
                          onClick={() => handleReportUser(booking.taskerId, booking.tasker!.display_name)}
                          className="w-full px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Докладвай изпълнител
                        </button>
                      )}
                      {userRole === Role.tasker && booking.user && (
                        <button
                          onClick={() => handleReportUser(booking.userId, booking.user!.name)}
                          className="w-full px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Докладвай клиент
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
