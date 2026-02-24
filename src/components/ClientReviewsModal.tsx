import { useEffect, useState } from 'react';

interface Reviewer {
  id: string;
  email: string;
  name: string;
  phone: string;
  is_active: boolean;
  city: string | null;
  created_at: string;
  updated_at: string;
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
  status: string;
  details: string;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  taskerId: string | null;
  userId: string;
  isUserReview: boolean;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: Reviewer;
  booking: Booking;
}

interface ClientReviewsModalProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

export default function ClientReviewsModal({
  isOpen,
  userId,
  userName,
  onClose,
}: ClientReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchReviews();
    }
  }, [isOpen, userId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3007/reviews/user/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data);
    } catch (err) {
      console.error('Error fetching client reviews:', err);
      setError('Неуспешно зареждане на отзивите. Моля, опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Отзиви за клиент</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Client Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center">
              <span className="text-2xl text-blue-700">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{userName}</h3>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">({reviews.length} отзива)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Зареждане на отзиви...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchReviews}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Опитайте отново
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Все още няма отзиви</h3>
              <p className="text-gray-600">Този клиент все още не е получил отзиви.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{review.reviewer.name}</p>
                      <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
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

                  {/* Review Comment */}
                  {review.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Затвори
          </button>
        </div>
      </div>
    </div>
  );
}
