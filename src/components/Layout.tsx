import { Fragment, useContext, useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { AuthContext } from '../context/authContext';

interface LayoutProps {
  children: React.ReactNode;
}

interface Warning {
  id: string;
  userId: string;
  reason: string;
  issuedBy: string;
  createdAt: string;
}

export default function Layout({ children }: LayoutProps) {
  const { userId } = useContext(AuthContext);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserWarnings();
    }
  }, [userId]);

  const fetchUserWarnings = async () => {
    try {
      const response = await fetch(`http://localhost:3007/users/${userId}/warnings?unacknowledged=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch warnings');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setWarnings(data);
        setShowWarningsModal(true);
      }
    } catch (err) {
      console.error('Error fetching warnings:', err);
    }
  };

  const acknowledgeWarnings = async () => {
    try {
      setAcknowledging(true);
      
      // Acknowledge all warnings
      await Promise.all(
        warnings.map(warning => 
          fetch(`http://localhost:3007/users/warnings/${warning.id}/acknowledge`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          })
        )
      );

      setShowWarningsModal(false);
      setWarnings([]);
    } catch (err) {
      console.error('Error acknowledging warnings:', err);
      // Still close the modal even if acknowledgment fails
      setShowWarningsModal(false);
    } finally {
      setAcknowledging(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Fragment>
      <Header />
      <main className="min-h-screen sm:px-4 sm:py-0">
        {children}
      </main>
      <Footer />

      {/* Warnings Modal */}
      {showWarningsModal && warnings.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {warnings.length === 1 ? 'Warning Notice' : `${warnings.length} Warning Notices`}
                    </h3>
                    <p className="text-sm text-gray-600">Please review the following warning{warnings.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWarningsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {warnings.map((warning, index) => (
                  <div key={warning.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                        Warning #{index + 1}
                      </span>
                      <span className="text-xs text-gray-600">{formatDate(warning.createdAt)}</span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{warning.reason}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Important:</strong> Repeated violations may result in temporary account suspension or permanent ban. 
                  Please review our community guidelines and terms of service.
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={acknowledgeWarnings}
                  disabled={acknowledging}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {acknowledging ? 'Processing...' : 'I Understand'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}
