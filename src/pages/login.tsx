import { useState, FormEvent, useContext } from 'react';
import InfoMessage from '../components/InfoMessage';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  role?: string;
  iat: number;
  exp: number;
}


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const router = useRouter();
  const ctx = useContext(AuthContext);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      
      // Store token and update context
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        // Decode token to get userId immediately
        const decodedToken = jwt.decode(response.token) as DecodedToken;
        const userIdFromToken = decodedToken?.userId;
        
        if (userIdFromToken) {
          // Check if user has multiple roles
          const rolesResponse = await fetch(`http://localhost:3007/users/${userIdFromToken}/roles`);
          
          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json();
            const roles = rolesData.roles || [];

            // Update context after we know the roles
            ctx.changesUserToken(response.token);
            
            // If user has multiple roles, redirect to role selection
            if (roles.length > 1) {
              router.push('/select-role');
              return;
            } else if (roles.length === 1) {
              // Auto-select the single role
              const role = roles[0];
              // Map string to Role enum
              let selectedRole = Role.unauthorised;
              if (role === 'client') selectedRole = Role.client;
              else if (role === 'tasker') selectedRole = Role.tasker;
              else if (role === 'admin') selectedRole = Role.admin;
              
              ctx.onSetUserRole(selectedRole);
            }
          } else {
            console.error('Failed to fetch roles:', rolesResponse.status);
            // Still update context even if roles fetch fails
            ctx.changesUserToken(response.token);
          }
        } else {
          console.error('No userId in token');
          ctx.changesUserToken(response.token);
        }
      }
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password form submit
  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setResetToken('');
    setForgotLoading(true);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      setForgotSuccess('Изпратен е токен за смяна на паролата!');
      setResetToken(res.resetToken || '');
    } catch (err: any) {
      setForgotError(err.message || 'Грешка при заявка за смяна на парола.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showForgot ? 'Забравена парола' : 'Влезте в профила си'}
          </h2>
        </div>
        {!showForgot ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Имейл адрес
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Имейл адрес"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Парола
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Парола"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Вход...' : 'Вход'}
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 mt-2">
              <button
                type="button"
                className="text-sm text-indigo-600 hover:text-indigo-500 underline"
                onClick={() => setShowForgot(true)}
              >
                Забравена парола?
              </button>
              <p className="text-sm text-gray-600">
                Нямате профил?{' '}
                <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Регистрирай се
                </a>
              </p>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Имейл адрес
                </label>
                <input
                  id="forgotEmail"
                  name="forgotEmail"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Въведете имейл адрес"
                />
              </div>
            </div>
            {forgotError && (
              <InfoMessage message={forgotError} type="error" onClose={() => setForgotError('')} />
            )}
            {forgotSuccess && (
              <InfoMessage message={forgotSuccess} type="success" onClose={() => setForgotSuccess('')} />
            )}
            {resetToken && (
              <div className="rounded-md bg-blue-50 p-4 mt-2">
                <p className="text-sm text-blue-800 break-all">
                  <b>Токен за смяна (dev):</b> {resetToken}
                </p>
                <a href="/reset-password" className="text-indigo-600 underline text-sm">Към страницата за смяна на парола</a>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="submit"
                disabled={forgotLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotLoading ? 'Изпращане...' : 'Изпрати токен'}
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-900 underline"
                onClick={() => setShowForgot(false)}
              >
                Назад към вход
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
