import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';

interface BugReport {
  id: string;
  userId: string | null;
  email: string;
  description: string;
  browserInfo: string | null;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export default function BugReports() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const [userRole, setUserRole] = useState<Role>(Role.unauthorised);
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');

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
      fetchBugReports();
    }
  }, [userRole]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3007/bug-reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bug reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching bug reports:', err);
      setError('Failed to load bug reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reportId: string, newStatus: 'in_progress' | 'resolved') => {
    try {
      setUpdatingId(reportId);
      setError(null);

      const response = await fetch(`http://localhost:3007/bug-reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setSuccessMessage('Status updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the list
      fetchBugReports();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };
  // Filter reports based on selected status
  const filteredReports = statusFilter === 'all' 
    ? reports 
    : reports.filter(report => report.status === statusFilter);
  if (userRole !== Role.admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bug Reports</h1>
          <p className="text-gray-600 mt-2">Manage and track reported bugs</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Filter Buttons */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Filter by status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All ({reports.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pending ({reports.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === 'in_progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                In Progress ({reports.filter(r => r.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Resolved ({reports.filter(r => r.status === 'resolved').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-600">Loading bug reports...</div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No bug reports' : `No ${getStatusLabel(statusFilter).toLowerCase()} reports`}
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'There are no bug reports to display.' 
                  : `There are no ${getStatusLabel(statusFilter).toLowerCase()} bug reports.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Browser
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{report.email}</div>
                          {report.userId && (
                            <div className="text-gray-500 text-xs">ID: {report.userId.substring(0, 8)}...</div>
                          )}
                          {!report.userId && (
                            <div className="text-gray-500 text-xs">Unregistered</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {report.description.length > 100 ? (
                            <>
                              <p className="mb-1">{report.description.substring(0, 100)}...</p>
                              <button
                                onClick={() => setSelectedReport(report)}
                                className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                              >
                                View Full
                              </button>
                            </>
                          ) : (
                            report.description
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.browserInfo || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {report.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(report.id, 'in_progress')}
                            disabled={updatingId === report.id}
                            className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                          >
                            {updatingId === report.id ? 'Updating...' : 'Start Working'}
                          </button>
                        )}
                        {report.status === 'in_progress' && (
                          <button
                            onClick={() => updateStatus(report.id, 'resolved')}
                            disabled={updatingId === report.id}
                            className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                          >
                            {updatingId === report.id ? 'Updating...' : 'Mark Resolved'}
                          </button>
                        )}
                        {report.status === 'resolved' && (
                          <span className="text-gray-400">Completed</span>
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
        {reports.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              {statusFilter === 'all' ? (
                <span>Total: {reports.length} {reports.length === 1 ? 'report' : 'reports'}</span>
              ) : (
                <span>
                  Showing {filteredReports.length} of {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>Pending: {reports.filter(r => r.status === 'pending').length}</span>
              <span>In Progress: {reports.filter(r => r.status === 'in_progress').length}</span>
              <span>Resolved: {reports.filter(r => r.status === 'resolved').length}</span>
            </div>
          </div>
        )}
      </main>

      {/* Full Description Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Bug Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                <p className="text-sm text-gray-900">{selectedReport.email}</p>
                {selectedReport.userId && (
                  <p className="text-xs text-gray-500">User ID: {selectedReport.userId}</p>
                )}
                {!selectedReport.userId && (
                  <p className="text-xs text-gray-500">Unregistered User</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedReport.status)}`}>
                  {getStatusLabel(selectedReport.status)}
                </span>
              </div>

              {selectedReport.browserInfo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Browser Information</label>
                  <p className="text-sm text-gray-900">{selectedReport.browserInfo}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200">
                  {selectedReport.description}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reported</label>
                <p className="text-sm text-gray-900">{formatDate(selectedReport.createdAt)}</p>
              </div>

              {selectedReport.updatedAt && new Date(selectedReport.updatedAt).getTime() !== new Date(selectedReport.createdAt).getTime() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedReport.updatedAt)}</p>
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
              >
                Close
              </button>
              {selectedReport.status === 'pending' && (
                <button
                  onClick={() => {
                    updateStatus(selectedReport.id, 'in_progress');
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Start Working
                </button>
              )}
              {selectedReport.status === 'in_progress' && (
                <button
                  onClick={() => {
                    updateStatus(selectedReport.id, 'resolved');
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
