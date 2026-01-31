import { useState, FormEvent, useContext } from 'react';
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
  const router = useRouter();
  const ctx = useContext(AuthContext);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      console.log('Login successful:', response);
      
      // Store token and update context
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        // Decode token to get userId immediately
        const decodedToken = jwt.decode(response.token) as DecodedToken;
        const userIdFromToken = decodedToken?.userId;
        
        console.log('Decoded userId:', userIdFromToken);
        
        if (userIdFromToken) {
          // Check if user has multiple roles
          const rolesResponse = await fetch(`http://localhost:3007/users/${userIdFromToken}/roles`);
          
          console.log('Roles response status:', rolesResponse.status);
          
          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json();
            const roles = rolesData.roles || [];
            
            console.log('User roles:', roles);
            
            // Update context after we know the roles
            ctx.changesUserToken(response.token);
            
            // If user has multiple roles, redirect to role selection
            if (roles.length > 1) {
              console.log('User has multiple roles, redirecting to /select-role');
              router.push('/select-role');
              return;
            } else if (roles.length === 1) {
              // Auto-select the single role
              const role = roles[0];
              console.log('Auto-selecting single role:', role);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
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
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
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
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
