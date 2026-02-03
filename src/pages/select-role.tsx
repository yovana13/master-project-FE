import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';
import Head from 'next/head';

export default function SelectRole() {
  const router = useRouter();
  const { userId, onSetUserRole } = useContext(AuthContext);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    fetchUserRoles();
  }, [userId]);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3007/users/${userId}/roles`);
      
      if (!response.ok) {
        throw new Error('Неуспешно зареждане на потребителски роли');
      }

      const data = await response.json();
      const roles = data.roles || [];
      setUserRoles(roles);

      // If user has only one role, auto-select it
      if (roles.length === 1) {
        handleRoleSelect(roles[0]);
      } else if (roles.length === 0) {
        setError('Няма намерени роли. Моля, свържете се с поддръжката.');
      }
    } catch (err) {
      console.error('Error fetching user roles:', err);
      setError('Неуспешно зареждане на роли. Моля, опитайте отново.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    // Map role string to Role enum
    let selectedRole: Role;
    
    if (role === 'client') {
      selectedRole = Role.client;
    } else if (role === 'tasker') {
      selectedRole = Role.tasker;
    } else if (role === 'admin') {
      selectedRole = Role.admin;
    } else {
      selectedRole = Role.unauthorised;
    }

    console.log('Selecting role:', selectedRole);

    // Update context (which will also update localStorage)
    onSetUserRole(selectedRole);

    // Redirect to home
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Зареждане на вашите профили...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Назад към вход
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Изберете вашия профил</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Добре дошли отново!
            </h2>
            <p className="text-gray-600">
              Имате няколко профила. Моля, изберете как бихте искали да продължите.
            </p>
          </div>

          <div className="space-y-4">
            {userRoles.includes('client') && (
              <button
                onClick={() => handleRoleSelect('client')}
                className="w-full bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      Продължете като клиент
                    </h3>
                    <p className="text-sm text-gray-600">
                      Резервирайте услуги и управлявайте вашите резервации
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )}

            {userRoles.includes('tasker') && (
              <button
                onClick={() => handleRoleSelect('tasker')}
                className="w-full bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      Продължете като изпълнител
                    </h3>
                    <p className="text-sm text-gray-600">
                      Управлявайте вашите услуги и преглеждайте заявки за задачи
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Можете да превключвате между профили по всяко време от настройките на вашия профил
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
