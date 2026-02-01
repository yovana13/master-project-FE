import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';

export default function Header() {
  const router = useRouter();
  const { userId, onSetUserId } = useContext(AuthContext);
  
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div 
            onClick={() => router.push('/')}
            className="cursor-pointer"
          >
            <h2 className="text-xl font-bold text-gray-900">Master Project</h2>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {!userId ? (
              <button
                onClick={() => router.push('/login')}
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </button>
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
                      My Services
                    </button>
                    <button
                      onClick={() => router.push('/my-availability')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      My Availability
                    </button>
                    <button
                      onClick={() => router.push('/booking-history')}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Booking History
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => router.push('/my-bookings')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  My Bookings
                </button>

                <button
                  onClick={() => router.push('/booking-history')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Booking History
                </button>
                
                <button
                  onClick={() => router.push('/my-account')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Account
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
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
