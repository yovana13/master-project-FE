import { useRouter } from 'next/router';
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';
import ReportBugModal from './ReportBugModal';

export default function Header() {
  const router = useRouter();
  const { userId, onSetUserId } = useContext(AuthContext);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Initialize userRole from localStorage
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'client') return Role.client;
      if (storedRole === 'tasker') return Role.tasker;
      if (storedRole === 'admin') return Role.admin;
    }
    return Role.unauthorised;
  });

  // State for Help dropdown and modals
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [showReportBugModal, setShowReportBugModal] = useState(false);
  const [reportMessage, setReportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Update userRole when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'client') setUserRole(Role.client);
      else if (storedRole === 'tasker') setUserRole(Role.tasker);
      else if (storedRole === 'admin') setUserRole(Role.admin);
      else setUserRole(Role.unauthorised);
    };
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom event from same window
    window.addEventListener('userRoleChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userRoleChanged', handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHelpDropdown(false);
      }
    };

    if (showHelpDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHelpDropdown]);

  const handleReportSuccess = () => {
    setReportMessage({ text: 'Докладът е изпратен успешно!', type: 'success' });
    setTimeout(() => setReportMessage(null), 5000);
  };

  const handleReportError = (message: string) => {
    setReportMessage({ text: message, type: 'error' });
    setTimeout(() => setReportMessage(null), 5000);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div 
            onClick={() => router.push('/')}
            className="cursor-pointer"
          >
            <h2 className="text-xl font-bold text-gray-900">TaskTrust</h2>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {!userId ? (
              <>
                <button
                  onClick={() => router.push('/signup')}
                  className="text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Регистрация
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Вход
                </button>
              </>
            ) : (
              <>
                {userRole === Role.tasker && (
                  <>
                    <button
                      onClick={() => router.push('/my-services')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Моите услуги
                    </button>
                    <button
                      onClick={() => router.push('/my-availability')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Моята наличност
                    </button>
                    <button
                      onClick={() => router.push('/booking-history')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      История на резервациите
                    </button>
                  </>
                )}
                
                {/* Bug Reports - Only for admins */}
                {userRole === Role.admin && (
                  <>
                    <button
                      onClick={() => router.push('/admin-categories')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Категории и услуги
                    </button>
                    <button
                      onClick={() => router.push('/bug-reports')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Доклади за грешки
                    </button>
                    <button
                      onClick={() => router.push('/user-reports')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Доклади за потребители
                    </button>
                    <button
                      onClick={() => router.push('/verification-review')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Преглед на верификациите
                    </button>
                  </>
                )}
                
                {/* My Bookings - Only for clients and taskers */}
                {userRole !== Role.admin && (
                  <button
                    onClick={() => router.push('/my-bookings')}
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Моите резервации
                  </button>
                )}

                {/* Booking History - Only for non-taskers and non-admins (since taskers have it above) */}
                {userRole !== Role.tasker && userRole !== Role.admin && (
                  <button
                    onClick={() => router.push('/booking-history')}
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    История на резервациите
                  </button>
                )}
                
                {/* Help Dropdown - Available for everyone except admins */}
                {userRole !== Role.admin && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowHelpDropdown(!showHelpDropdown)}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Помощ
                      <svg className={`w-4 h-4 transition-transform ${showHelpDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showHelpDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          onClick={() => {
                            setShowReportBugModal(true);
                            setShowHelpDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Докладвай грешка
                        </button>
                        {/* Report User - Only for logged-in users */}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => router.push('/my-account')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Моят профил
                </button>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    onSetUserId('');
                    window.dispatchEvent(new Event('userRoleChanged'));
                    router.push('/login');
                  }}
                  className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors rounded-md px-4 py-2 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Изход
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Report Messages */}
      {reportMessage && (
        <div className={`${reportMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-b px-4 sm:px-6 lg:px-8 py-3`}>
          <p className={`text-sm ${reportMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {reportMessage.text}
          </p>
        </div>
      )}

      {/* Report Modals */}
      <ReportBugModal
        isOpen={showReportBugModal}
        userId={userId}
        onClose={() => setShowReportBugModal(false)}
        onSuccess={handleReportSuccess}
        onError={handleReportError}
      />
    </header>
  );
}
