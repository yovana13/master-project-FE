import { useState } from 'react';
import ClientReviewsModal from './ClientReviewsModal';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
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
  status: 'pending' | 'accepted' | 'completed' | 'canceled' | 'declined' | 'no_show';
  details: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  service: Service;
}

interface TaskerBookingCardProps {
  booking: TaskerBooking;
  onAccept?: (bookingId: string) => void;
  onDecline?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
  onEdit?: (booking: TaskerBooking) => void;
  onReport?: (userId: string, userName: string) => void;
  showActions?: boolean;
  showEditReport?: boolean;
}

export default function TaskerBookingCard({ 
  booking, 
  onAccept, 
  onDecline,
  onCancel,  onComplete,  onEdit,
  onReport,
  showActions = true,
  showEditReport = false
}: TaskerBookingCardProps) {
  const [showClientReviews, setShowClientReviews] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const hasStartTimePassed = () => {
    const now = new Date();
    const startTime = new Date(booking.startsAt);
    return now >= startTime;
  };

  const isMoreThan24HoursBeforeStart = () => {
    const now = new Date();
    const startTime = new Date(booking.startsAt);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilStart > 24;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.service.name}
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
        {/* Client Info */}
        {booking.user && booking.user.name && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                onClick={() => setShowClientReviews(true)}
                title="Виж отзиви за клиента"
              >
                <span className="text-xl text-blue-700">
                  {booking.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setShowClientReviews(true)}
                  title="Виж отзиви за клиента"
                >
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
          <span>
            {formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}
          </span>
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
      </div>

      {/* Action Buttons */}
      {showActions && booking.status === 'pending' && onAccept && onDecline && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => onDecline(booking.id)}
            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            Откажи
          </button>
          <button
            onClick={() => onAccept(booking.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            Приеми
          </button>
        </div>
      )}

      {/* Edit and Report Buttons */}
      {showEditReport && onEdit && isMoreThan24HoursBeforeStart() && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => onEdit(booking)}
            className="flex-1 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Редактирай резервация
          </button>
          {onReport && (
            <button
              onClick={() => onReport(booking.userId, booking.user.name)}
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

      {/* Cancel Button */}
      {onCancel && booking.status === 'accepted' && isMoreThan24HoursBeforeStart() && (
        <div className="mt-4">
          <button
            onClick={() => onCancel(booking.id)}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Отмени резервация
          </button>
        </div>
      )}

      {/* Complete Button */}
      {onComplete && booking.status === 'accepted' && hasStartTimePassed() && (
        <div className="mt-4">
          <button
            onClick={() => onComplete(booking.id)}
            className="w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Завърши резервация
          </button>
        </div>
      )}

      {/* Client Reviews Modal */}
      {booking.user && (
        <ClientReviewsModal
          isOpen={showClientReviews}
          userId={booking.userId}
          userName={booking.user.name}
          onClose={() => setShowClientReviews(false)}
        />
      )}
    </div>
  );
}
