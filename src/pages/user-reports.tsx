import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';

interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: 'harassment' | 'scam' | 'inappropriate_behavior' | 'no_show' | 'poor_service' | 'other';
  description: string;
  status: 'pending' | 'reviewed';
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    display_name: string;
    email: string;
  };
  reportedUser?: {
    id: string;
    display_name: string;
    email: string;
    is_active: boolean;
  };
}

export default function UserReports() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const [userRole, setUserRole] = useState<Role>(Role.unauthorised);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'warning' | 'suspend_3_days' | 'permanent_ban' | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'admin') {
      setUserRole(Role.admin);
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (userRole === Role.admin) {
      fetchUserReports();
    }
  }, [userRole]);

  const fetchUserReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3007/user-reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Неуспешно зареждане на доклади за потребители');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching user reports:', err);
      setError('Неуспешно зареждане на доклади за потребители. Моля, опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (report: UserReport, action: 'warning' | 'suspend_3_days' | 'permanent_ban') => {
    setSelectedReport(report);
    setActionType(action);
    setShowActionModal(true);
    
    // Set default messages
    if (action === 'warning') {
      setActionMessage('Вашето поведение е било докладвано и прегледано. Моля, спазвайте нашите правила на общността.');
    } else if (action === 'suspend_3_days') {
      setActionMessage('Вашият акаунт е временно деактивиран за 3 дни поради нарушения на политиката.');
    } else if (action === 'permanent_ban') {
      setActionMessage('Вашият акаунт е трайно баннат поради сериозно нарушение на условията.');
    }
  };

  const executeAction = async () => {
    if (!selectedReport || !actionType) return;

    try {
      setProcessingAction(true);
      setError(null);

      const response = await fetch(`http://localhost:3007/users/${selectedReport.reportedUserId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: actionType,
          reason: actionMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Неуспешно изпълнение на действието');
      }

      // Update report status to 'reviewed' after action is taken
      await updateReportStatus(selectedReport.id, 'reviewed');

      setSuccessMessage(`Действието е изпълнено успешно!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setShowActionModal(false);
      setSelectedReport(null);
      setActionType(null);
      setActionMessage('');
      
      // Refresh the list
      fetchUserReports();
    } catch (err) {
      console.error('Error executing action:', err);
      setError('Неуспешно изпълнение на действието. Моля, опитайте отново.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessingAction(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: 'reviewed') => {
    try {
      setError(null);

      const response = await fetch(`http://localhost:3007/user-reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Неуспешна актуализация на статуса');
      }

      setSuccessMessage('Статусът на доклада е актуализиран успешно!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      fetchUserReports();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Неуспешна актуализация на статуса. Моля, опитайте отново.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Няма данни';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Невалидна дата';
      return date.toLocaleDateString('bg-BG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (error) {
      return 'Невалидна дата';
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels = {
      harassment: 'Тормоз',
      scam: 'Измама',
      inappropriate_behavior: 'Неподходящо поведение',
      no_show: 'Неявяване',
      poor_service: 'Лоша услуга',
      other: 'Друго',
    };
    return labels[reason as keyof typeof labels] || reason;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-green-100 text-green-800',
    };

    const label = {
      pending: 'Чакащ',
      reviewed: 'Прегледан',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {label[status as keyof typeof label] || status}
      </span>
    );
  };

  const filteredReports = statusFilter === 'all' 
    ? reports 
    : reports.filter(report => report.status === statusFilter);

  const statusCounts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Зареждане на доклади за потребители...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Доклади за потребители</h1>
              <p className="text-gray-600 mt-2">Преглеждайте и управлявайте доклади за потребители</p>
            </div>
            <button
              onClick={fetchUserReports}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Обнови
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Всички ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Чакащи ({statusCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('reviewed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'reviewed'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Прегледани ({statusCounts.reviewed})
          </button>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? 'Още няма доклади' : `Няма ${statusFilter === 'pending' ? 'чакащи' : 'прегледани'} доклади`}
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'Докладите за потребители ще се появят тук, когато бъдат изпратени.'
                  : 'Опитайте да изберете друг филтър, за да видите други доклади.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Докладчик
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Докладван потребител
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Причина
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Докладван
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {report.reporter?.display_name || 'Неизвестен'}
                          </div>
                          <div className="text-gray-500">{report.reporter?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {report.reportedUser?.display_name || 'Неизвестен'}
                          </div>
                          <div className="text-gray-500">{report.reportedUser?.email}</div>
                          {report.reportedUser?.is_active === false && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                              Неактивен
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                          {getReasonLabel(report.reason)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <p className="line-clamp-2">{report.description}</p>
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs mt-1"
                          >
                            Виж пълен текст
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {report.status === 'pending' && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleAction(report, 'warning')}
                              className="text-yellow-600 hover:text-yellow-800 font-medium text-left"
                            >
                              Изпрати предупреждение
                            </button>
                            <button
                              onClick={() => handleAction(report, 'suspend_3_days')}
                              className="text-orange-600 hover:text-orange-800 font-medium text-left"
                            >
                              Деактивирай за 3 дни
                            </button>
                            <button
                              onClick={() => handleAction(report, 'permanent_ban')}
                              className="text-red-600 hover:text-red-800 font-medium text-left"
                            >
                              Перманентен бан
                            </button>
                          </div>
                        )}
                        {report.status === 'reviewed' && (
                          <span className="text-gray-500">Завършен</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredReports.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            {statusFilter === 'all' 
              ? `Показани всички ${reports.length} доклада`
              : `Показани ${filteredReports.length} от ${reports.length} доклада`}
            {' • '}
            Чакащи: {statusCounts.pending}, Прегледани: {statusCounts.reviewed}
          </div>
        )}
      </div>

      {/* View Full Report Modal */}
      {selectedReport && !showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Детайли на доклада</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Докладчик</label>
                  <p className="text-gray-900">{selectedReport.reporter?.display_name || 'Неизвестен'}</p>
                  <p className="text-sm text-gray-500">{selectedReport.reporter?.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Докладван потребител</label>
                  <p className="text-gray-900">{selectedReport.reportedUser?.display_name || 'Неизвестен'}</p>
                  <p className="text-sm text-gray-500">{selectedReport.reportedUser?.email}</p>
                  {selectedReport.reportedUser?.is_active === false && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                      Акаунтът е неактивен
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Причина</label>
                  <p className="text-gray-900">{getReasonLabel(selectedReport.reason)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Статус</label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Описание</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Докладван на</label>
                    <p className="text-gray-900">{formatDate(selectedReport.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Последна актуализация</label>
                    <p className="text-gray-900">{formatDate(selectedReport.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Затвори
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedReport && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {actionType === 'warning' && 'Изпрати предупредително съобщение'}
                {actionType === 'suspend_3_days' && 'Деактивирай потребител за 3 дни'}
                {actionType === 'permanent_ban' && 'Трайно банвай потребител'}
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Потребител: <span className="font-medium text-gray-900">{selectedReport.reportedUser?.display_name}</span></p>
                <p className="text-sm text-gray-600">Имейл: <span className="font-medium text-gray-900">{selectedReport.reportedUser?.email}</span></p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Причина
                </label>
                <textarea
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Въведете причината за това действие..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedReport(null);
                    setActionType(null);
                    setActionMessage('');
                  }}
                  disabled={processingAction}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Отказ
                </button>
                <button
                  onClick={executeAction}
                  disabled={processingAction || !actionMessage.trim()}
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    actionType === 'warning' 
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : actionType === 'suspend_3_days'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingAction ? 'Обработка...' : 'Потвърди действието'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
