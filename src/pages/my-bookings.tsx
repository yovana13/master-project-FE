import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import EditBookingModal from '../components/EditBookingModal';
import ReportUserModal from '../components/ReportUserModal';
import TaskerBookingCard from '../components/TaskerBookingCard';
import { Role } from '../enums/role.enum';

interface Tasker {
  id: string;
  display_name: string;
  profile_image_url?: string;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  user?: {
    email?: string;
    phone?: string;
  };
}

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
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
  user?: User;
  service?: Service;
}

export default function MyBookings() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  
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
  const [error, setError] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [showReportUserModal, setShowReportUserModal] = useState(false);
  const [reportedUser, setReportedUser] = useState<{ id: string; name: string } | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

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
      
      const endpoint = userRole === Role.tasker
        ? `http://localhost:3007/bookings/pending-accepted/tasker/${userId}`
        : `http://localhost:3007/bookings/pending-accepted/user/${userId}`;
      
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Fetched bookings data:', data);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Неуспешно зареждане на резервациите. Моля, опитайте отново.');
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

  const handleReportUser = (userId: string, userName: string) => {
    setReportedUser({ id: userId, name: userName });
    setShowReportUserModal(true);
  };

  const handleReportSuccess = () => {
    setReportSuccess('Докладът е изпратен успешно. Благодарим ви, че помагате за безопасността на общността.');
    setShowReportUserModal(false);
    setReportedUser(null);
    setTimeout(() => setReportSuccess(null), 5000);
  };

  const handleReportError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
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
      await fetchBookings();
      setReportSuccess('Резервацията е приета успешно!');
      setTimeout(() => setReportSuccess(null), 5000);
    } catch (error) {
      console.error('Error accepting booking:', error);
      setError('Неуспешно приемане на резервацията. Моля, опитайте отново.');
      setTimeout(() => setError(null), 5000);
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
      await fetchBookings();
      setReportSuccess('Резервацията е отказана успешно!');
      setTimeout(() => setReportSuccess(null), 5000);
    } catch (error) {
      console.error('Error declining booking:', error);
      setError('Неуспешно отказване на резервацията. Моля, опитайте отново.');
      setTimeout(() => setError(null), 5000);
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
      await fetchBookings();
      setReportSuccess('Резервацията е отменена успешно!');
      setTimeout(() => setReportSuccess(null), 5000);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Неуспешно отменяне на резервацията. Моля, опитайте отново.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleNoShow = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:3007/bookings/${bookingId}/no-show`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark booking as no-show');
      }

      // Refresh the bookings list
      await fetchBookings();
      setReportSuccess('Резервацията е маркирана като неявяване.');
      setTimeout(() => setReportSuccess(null), 5000);
    } catch (error) {
      console.error('Error marking booking as no-show:', error);
      setError('Неуспешно маркиране на резервацията. Моля, опитайте отново.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`http://localhost:3007/bookings/${bookingId}/complete`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to complete booking');
      }

      // Refresh the bookings list
      await fetchBookings();
      setReportSuccess('Резервацията е завършена успешно!');
      setTimeout(() => setReportSuccess(null), 5000);
    } catch (error) {
      console.error('Error completing booking:', error);
      setError('Неуспешно завършване на резервацията. Моля, опитайте отново.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('bg-BG', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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
    const statusMap: { [key: string]: string } = {
      'pending': 'Чакаща',
      'accepted': 'Приета',
      'completed': 'Завършена',
      'canceled': 'Отменена',
      'declined': 'Отклонена',
      'no_show': 'Неявяване'
    };
    return statusMap[status] || status;
  };

  const canEdit = (status: Booking['status']) => {
    return status === 'pending' || status === 'accepted';
  };

  const renderBookingCard = (booking: Booking) => {
    // Use TaskerBookingCard component for taskers
    if (userRole === Role.tasker && booking.user) {
      return (
        <TaskerBookingCard
          key={booking.id}
          booking={{
            ...booking,
            user: booking.user,
            service: booking.service || { id: '', name: 'Услуга' }
          }}
          showActions={booking.status === 'pending'}
          showEditReport={canEdit(booking.status)}
          onAccept={handleAcceptBooking}
          onDecline={handleDeclineBooking}
          onCancel={handleCancelBooking}
          onComplete={handleCompleteBooking}
          onEdit={handleEdit}
          onReport={handleReportUser}
        />
      );
    }

    // Existing card rendering for clients
    return (
    <div
      key={booking.id}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.service?.name || 'Услуга'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(booking.status)}`}>
              {formatStatus(booking.status)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            ID на резервация: {booking.id}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            €{(booking.priceCents / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Client Info (for taskers) */}
        {userRole === Role.tasker && booking.user && booking.user.name && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {booking.user.profile_image_url ? (
                <img
                  src={booking.user.profile_image_url}
                  alt={booking.user.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl text-blue-700">
                    {booking.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {booking.user.name}
                </p>
                <p className="text-xs text-blue-600 font-medium mb-2">Информация за клиента</p>
                <div className="space-y-1.5">
                  {booking.user.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${booking.user.phone}`} className="hover:text-blue-600 font-medium">
                        {booking.user.phone}
                      </a>
                    </div>
                  )}
                  {booking.user.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${booking.user.email}`} className="hover:text-blue-600 font-medium truncate">
                        {booking.user.email}
                      </a>
                    </div>
                  )}
                  {!booking.user.phone && !booking.user.email && (
                    <p className="text-xs text-gray-500 italic">Няма налична информация за контакт</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasker Info (for clients) */}
        {userRole === Role.client && booking.tasker && booking.tasker.display_name && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {booking.tasker.profile_image_url ? (
                <img
                  src={booking.tasker.profile_image_url}
                  alt={booking.tasker.display_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl text-indigo-700">
                    {booking.tasker.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {booking.tasker.display_name}
                  </p>
                  {booking.tasker.verification_status === 'verified' && (
                    <span className="inline-flex items-center text-blue-600" title="Потвърден изпълнител">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-600 font-medium mb-2">Информация за изпълнител</p>
                <div className="space-y-1.5">
                  {booking.tasker.user?.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${booking.tasker.user.phone}`} className="hover:text-indigo-600 font-medium">
                        {booking.tasker.user.phone}
                      </a>
                    </div>
                  )}
                  {booking.tasker.user?.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${booking.tasker.user.email}`} className="hover:text-indigo-600 font-medium truncate">
                        {booking.tasker.user.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
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
              <span className="font-medium text-gray-700">Детайли:</span> {booking.details}
            </p>
          </div>
        )}

        {/* Created Date */}
        <div className="pt-2 text-xs text-gray-500">
          Резервирана на {new Date(booking.createdAt).toLocaleDateString('bg-BG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Edit and Report Buttons */}
      {canEdit(booking.status) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => handleEdit(booking)}
            className="flex-1 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Редактирай резервация
          </button>
          {userRole === Role.client && booking.tasker && (
            <button
              onClick={() => handleReportUser(booking.taskerId, booking.tasker!.display_name)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              title="Докладвай изпълнител"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
          )}
          {userRole === Role.tasker && booking.user && (
            <button
              onClick={() => handleReportUser(booking.userId, booking.user!.name)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              title="Докладвай клиент"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Cancel Button for Clients */}
      {userRole === Role.client && (booking.status === 'pending' || booking.status === 'accepted') && 
       ((new Date(booking.startsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60) > 24) && (
        <div className="mt-4">
          <button
            onClick={() => handleCancelBooking(booking.id)}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Отмени резервация
          </button>
        </div>
      )}

      {/* No Show Button for Clients */}
      {userRole === Role.client && booking.status === 'accepted' && new Date() >= new Date(booking.startsAt) && (
        <div className="mt-4">
          <button
            onClick={() => handleNoShow(booking.id)}
            className="w-full px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Неявяване
          </button>
        </div>
      )}
    </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Зареждане на вашите резервации...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Моите резервации</title>
        <meta name="description" content="Преглед на всички ваши резервации" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {reportSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600">{reportSuccess}</p>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Още няма резервации</h3>
              <p className="text-gray-600 mb-6">Започнете, като резервирате услуга!</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Разгледай услуги
              </button>
            </div>
          ) : (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Активни резервации
                <span className="text-sm font-normal text-gray-500">({bookings.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map(renderBookingCard)}
              </div>
            </section>
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
    </div>
  );
}
