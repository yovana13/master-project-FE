import { useState, useEffect } from 'react';

interface ReportBugModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function ReportBugModal({ isOpen, userId, onClose, onSuccess, onError }: ReportBugModalProps) {
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [browserInfo, setBrowserInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Fetch user's email when modal opens if user is logged in
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!userId || !isOpen) return;
      
      setLoadingEmail(true);
      try {
        const response = await fetch(`http://localhost:3007/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.email) {
            setEmail(userData.email);
          }
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
        // Not critical, user can still enter email manually
      } finally {
        setLoadingEmail(false);
      }
    };

    fetchUserEmail();
  }, [userId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:3007/bug-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || null,
          email,
          description,
          browserInfo: browserInfo || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit bug report');
      }

      // Reset form
      setEmail('');
      setDescription('');
      setBrowserInfo('');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting bug report:', error);
      onError(error.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Докладвай грешка</h3>
            <p className="text-sm text-gray-600 mt-1">Помогнете ни да подобрим приложението</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Имейл *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loadingEmail || (userId && email !== '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={loadingEmail ? "Зареждане на имейл..." : "email@example.com"}
            />
            {userId && email && (
              <p className="text-xs text-gray-500 mt-1">Използва се имейлът от вашия профил</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Моля, опишете грешката подробно: какво се случи, какво очаквахте и стъпки за възпроизвеждане..."
            />
          </div>

          {/* Browser Info */}
          <div>
            <label htmlFor="browserInfo" className="block text-sm font-medium text-gray-700 mb-1">
              Информация за браузъра (По желание)
            </label>
            <input
              type="text"
              id="browserInfo"
              value={browserInfo}
              onChange={(e) => setBrowserInfo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="напр. Chrome 120 на Windows"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Изпращане...
                </>
              ) : (
                'Изпрати доклад'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
