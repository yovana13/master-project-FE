interface Booking {
  user?: {
    name: string;
  };
  tasker?: {
    display_name: string;
  };
  service: {
    name: string;
  };
}

interface Review {
  rating: number;
  comment?: string;
  createdAt?: string;
  created_at?: string;
}

interface ViewReviewModalProps {
  isOpen: boolean;
  booking: Booking | null;
  review: Review | null;
  onClose: () => void;
}

export default function ViewReviewModal({ isOpen, booking, review, onClose }: ViewReviewModalProps) {
  if (!isOpen || !review || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Вашият отзив</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Отзив за: {booking.user?.name || booking.tasker?.display_name || 'Няма'}</p>
          <p className="text-sm text-gray-600">Услуга: {booking.service.name}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Оценка</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-6 h-6 ${
                    star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                  fill={star <= review.rating ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              ))}
            </div>
          </div>

          {review.comment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Коментар</label>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{review.comment}</p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Отзив от {new Date(review.createdAt || review.created_at || '').toLocaleDateString('bg-BG', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
}
