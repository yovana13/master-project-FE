import { useState, FormEvent, useContext } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';
import { AuthContext } from '../context/authContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'client' | 'tasker' | 'both'>('client');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const ctx = useContext(AuthContext);

  const translateError = (message: string): string => {
    if (/phone number .+ is already taken/i.test(message)) {
      const phone = message.match(/phone number (.+?) is/i)?.[1] || '';
      return `Телефонен номер ${phone} вече е зает`;
    }
    if (/email .+ is already taken/i.test(message)) {
      const email = message.match(/email (.+?) is/i)?.[1] || '';
      return `Имейл ${email} вече е зает`;
    }
    if (/already taken/i.test(message)) {
      return 'Тази стойност вече е заета';
    }
    if (/signup failed/i.test(message)) {
      return 'Регистрацията не успя. Моля, опитайте отново.';
    }
    return message;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Паролите не съвпадат');
      return;
    }

    if (password.length < 6) {
      setError('Паролата трябва да бъде поне 6 символа');
      return;
    }

    setIsLoading(true);

    try {
      // Determine roles based on user type selection
      let roles: string[];
      if (userType === 'both') {
        roles = ['tasker', 'client'];
      } else {
        roles = [userType];
      }

      const response = await authService.signup({
        email,
        password,
        name,
        phone,
        is_active: true,
        roles
      });
      
      // Store token and update context
      if (response.token) {
        localStorage.setItem('token', response.token);
        // Store the primary role in localStorage since it's not in the JWT
        const primaryRole = userType === 'both' ? 'tasker' : userType;
        localStorage.setItem('userRole', primaryRole);
        ctx.changesUserToken(response.token);
        ctx.onSetUserRole(primaryRole as any);
      }
      
      // Redirect based on user type
      if (userType === 'tasker' || userType === 'both') {
        router.push('/become-a-tasker');
      } else {
        router.push('/');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Регистрацията не успя. Моля, опитайте отново.';
      setError(translateError(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Създайте профил
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Имате профил?{' '}
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Влезте в профила си
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Пълно име
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Моля, попълнете това поле')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Иван Иванов"
              />
            </div>
            
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
                onInvalid={(e) => {
                  const input = e.target as HTMLInputElement;
                  if (input.validity.valueMissing) {
                    input.setCustomValidity('Моля, попълнете това поле');
                  } else if (input.validity.typeMismatch) {
                    input.setCustomValidity('Моля, въведете валиден имейл адрес');
                  }
                }}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="ivan@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефонен номер
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Моля, попълнете това поле')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="+441234567890"
              />
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                Искам да се регистрирам като
              </label>
              <select
                id="userType"
                name="userType"
                required
                value={userType}
                onChange={(e) => setUserType(e.target.value as 'client' | 'tasker' | 'both')}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              >
                <option value="client">Клиент</option>
                <option value="tasker">Изпълнител</option>
                <option value="both">И двете (Клиент и Изпълнител)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Парола
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Моля, попълнете това поле')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Потвърдете паролата
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Моля, попълнете това поле')}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
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
              {isLoading ? 'Създаване на профил...' : 'Регистрирай се'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
