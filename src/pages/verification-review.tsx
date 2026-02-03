import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';

interface PendingVerification {
  id: string;
  display_name: string;
  email: string;
  profile_image_url?: string;
  verification_document_url: string;
  verification_document_type: 'id_card' | 'passport' | 'driver_license' | 'other';
  created_at: string;
  updated_at: string;
}

export default function VerificationReview() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'admin') return Role.admin;
    }
    return Role.unauthorised;
  });

  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || userRole !== Role.admin) {
      router.push('/');
      return;
    }

    fetchPendingVerifications();
  }, [userId, userRole]);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3007/users/taskers/pending-verification', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Неуспешно зареждане на чакащи верификации');
      }

      const data = await response.json();
      setVerifications(data);
    } catch (err) {
      console.error('Error fetching pending verifications:', err);
      setError('Неуспешно зареждане на чакащи верификации. Моля, опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (verification: PendingVerification, action: 'approve' | 'reject') => {
    setSelectedVerification(verification);
    setActionType(action);
    setNotes('');
    setShowActionModal(true);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setSelectedVerification(null);
    setNotes('');
  };

  const handleSubmitAction = async () => {
    if (!selectedVerification) return;

    try {
      setProcessing(true);

      const response = await fetch(`http://localhost:3007/users/tasker/${selectedVerification.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: actionType,
          notes: notes.trim() || (actionType === 'approve' ? 'Верификацията е одобрена' : 'Верификацията е отхвърлена'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Неуспешно ${actionType === 'approve' ? 'одобрение' : 'отхвърляне'} на верификацията`);
      }

      setSuccessMessage(`Верификацията е ${actionType === 'approve' ? 'одобрена' : 'отхвърлена'} успешно!`);
      setTimeout(() => setSuccessMessage(null), 5000);

      // Refresh the list
      await fetchPendingVerifications();
      handleCloseActionModal();
    } catch (err) {
      console.error(`Error ${actionType}ing verification:`, err);
      alert(`Неуспешно ${actionType === 'approve' ? 'одобрение' : 'отхвърляне'} на верификацията. Моля, опитайте отново.`);
    } finally {
      setProcessing(false);
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'id_card': return 'Лична карта';
      case 'passport': return 'Паспорт';
      case 'driver_license': return 'Шофьорска книжка';
      case 'other': return 'Друго';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Зареждане на чакащи верификации...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Преглед на верификации - Админ</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Преглед на верификации</h1>
            <p className="mt-2 text-gray-600">
              Прегледайте и одобрете или отхвърлете документи за верификация на изпълнители
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Verification Count */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{verifications.length}</p>
                  <p className="text-sm text-gray-600">Чакащи верификации</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verifications List */}
          {verifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Няма чакащи верификации</h3>
              <p className="text-gray-600">Всички документи за верификация са прегледани.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Изпълнител
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Тип документ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Подаден
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Документ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verifications.map((verification) => (
                      <tr key={verification.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {verification.profile_image_url ? (
                              <a
                                href={verification.profile_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                              >
                                <img
                                  src={verification.profile_image_url}
                                  alt={verification.display_name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              </a>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                                <span className="text-sm font-medium text-indigo-600">
                                  {verification.display_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <p className="text-sm font-medium text-gray-900">{verification.display_name}</p>
                              <p className="text-xs text-gray-500">{verification.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getDocumentTypeName(verification.verification_document_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(verification.updated_at).toLocaleDateString('bg-BG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={verification.verification_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Виж документ
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenActionModal(verification, 'approve')}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                            >
                              Одобри
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(verification, 'reject')}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                            >
                              Отхвърли
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedVerification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' ? 'Одобри' : 'Отхвърли'} верификация
              </h3>
              <button
                onClick={handleCloseActionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  На път сте да <strong className={actionType === 'approve' ? 'text-green-600' : 'text-red-600'}>
                    {actionType === 'approve' ? 'одобрите' : 'отхвърлите'}
                  </strong> верификацията за:
                </p>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">{selectedVerification.display_name}</p>
                  <p className="text-xs text-gray-500">{selectedVerification.email}</p>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Бележки {actionType === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Документът е верифициран успешно' : 'Моля, предоставете причина за отхвърлянето (напр., Документът е размазан)'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {actionType === 'reject' && !notes.trim() && (
                  <p className="mt-1 text-xs text-red-600">Бележките са задължителни при отхвърляне</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseActionModal}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Отказ
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={processing || (actionType === 'reject' && !notes.trim())}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? 'Обработка...' : actionType === 'approve' ? 'Одобри' : 'Отхвърли'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
