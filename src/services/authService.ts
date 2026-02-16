const API_BASE_URL = 'http://localhost:3007';

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  is_active: boolean;
  roles: string[];
}

interface AuthResponse {
  token?: string;
}

export const authService = {
  /**
   * Login user
   * @param email User's email address
   * @param password User's password
   * @returns Promise with authentication response
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      } as LoginRequest),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  /**
   * Signup new user
   * @param userData User registration data
   * @returns Promise with authentication response
   */
  async signup(userData: {
    email: string;
    password: string;
    name: string;
    phone: string;
    is_active?: boolean;
    roles: string[];
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone,
        is_active: userData.is_active ?? true,
        roles: userData.roles,
      } as SignupRequest),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Signup failed' }));
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  },

  /**
   * Request password reset token
   */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to request reset token' }));
      throw new Error(error.message || 'Failed to request reset token');
    }
    return response.json();
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to reset password' }));
      throw new Error(error.message || 'Failed to reset password');
    }
    return response.json();
  },
};
