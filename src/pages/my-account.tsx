import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface TaskerProfileData {
  display_name: string;
  bio: string;
  address: string;
  is_active: boolean;
  profile_image_url: string;
}

export default function MyAccount() {
  const router = useRouter();
  const { userId, onSetUserRole } = useContext(AuthContext);
  
  // Initialize userRole from localStorage only
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'client') return Role.client;
      if (storedRole === 'tasker') return Role.tasker;
      if (storedRole === 'admin') return Role.admin;
    }
    return Role.unauthorised;
  });
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [checkingRoles, setCheckingRoles] = useState(false);

  // Tasker profile state
  const [taskerProfile, setTaskerProfile] = useState<TaskerProfileData | null>(null);
  const [taskerFormData, setTaskerFormData] = useState({
    display_name: '',
    bio: '',
    address: '',
    is_active: true,
    profile_image_url: '',
  });
  const [isEditingTasker, setIsEditingTasker] = useState(false);
  const [savingTasker, setSavingTasker] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
      return;
    }

    fetchUserData();
    checkUserRoles();
    
    // Fetch tasker profile if user is a tasker
    if (userRole === Role.tasker) {
      fetchTaskerProfile();
    }
  }, [userId, userRole]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3007/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserRoles = async () => {
    try {
      setCheckingRoles(true);
      const response = await fetch(`http://localhost:3007/users/${userId}/roles`);
      
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.roles || []);
      } else {
        setUserRoles([]);
      }
    } catch (err) {
      console.error('Error checking user roles:', err);
      setUserRoles([]);
    } finally {
      setCheckingRoles(false);
    }
  };

  const fetchTaskerProfile = async () => {
    try {
      const response = await fetch(`http://localhost:3007/users/tasker-profile/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTaskerProfile(data);
        setTaskerFormData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          address: data.address || '',
          is_active: data.is_active !== undefined ? data.is_active : true,
          profile_image_url: data.profile_image_url || '',
        });
      }
    } catch (err) {
      console.error('Error fetching tasker profile:', err);
    }
  };

  const handleSwitchToTasker = () => {
    onSetUserRole(Role.tasker);
    setSuccessMessage('Switched to Tasker profile successfully!');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handleSwitchToClient = () => {
    onSetUserRole(Role.client);
    setSuccessMessage('Switched to Client profile successfully!');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handleCreateTaskerProfile = () => {
    // Redirect to tasker profile creation page
    router.push('/become-a-tasker');
  };

  const handleCreateClientProfile = () => {
    // Redirect to client profile creation page or signup
    router.push('/signup');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTaskerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setTaskerFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`http://localhost:3007/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setUserData(updatedData);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleTaskerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTasker(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`http://localhost:3007/users/${userId}/tasker-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskerFormData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update tasker profile' }));
        throw new Error(errorData.message || 'Failed to update tasker profile');
      }

      const updatedData = await response.json();
      setTaskerProfile(updatedData);
      setSuccessMessage('Tasker profile updated successfully!');
      setIsEditingTasker(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating tasker profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tasker profile');
    } finally {
      setSavingTasker(false);
    }
  };

  const handleTaskerCancel = () => {
    if (taskerProfile) {
      setTaskerFormData({
        display_name: taskerProfile.display_name || '',
        bio: taskerProfile.bio || '',
        address: taskerProfile.address || '',
        is_active: taskerProfile.is_active !== undefined ? taskerProfile.is_active : true,
        profile_image_url: taskerProfile.profile_image_url || '',
      });
    }
    setIsEditingTasker(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading your account...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>My Account</title>
        <meta name="description" content="Manage your account settings" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-600">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm">
            {/* Card Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your personal information</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>

            {/* Card Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {userData?.name || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {userData?.email || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+359123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {userData?.phone || 'Not set'}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Tasker Profile Card - Only visible for taskers */}
          {userRole === Role.tasker && (
            <div className="mt-6 bg-white rounded-lg shadow-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Tasker Profile</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your tasker-specific information</p>
                </div>
                {!isEditingTasker && (
                  <button
                    onClick={() => setIsEditingTasker(true)}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Tasker Profile
                  </button>
                )}
              </div>

              {/* Card Body */}
              <form onSubmit={handleTaskerSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    {isEditingTasker ? (
                      <input
                        type="text"
                        id="display_name"
                        name="display_name"
                        value={taskerFormData.display_name}
                        onChange={handleTaskerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Your professional display name"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        {taskerProfile?.display_name || 'Not set'}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {isEditingTasker ? (
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={taskerFormData.bio}
                        onChange={handleTaskerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Tell clients about your experience and skills..."
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 whitespace-pre-wrap">
                        {taskerProfile?.bio || 'Not set'}
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    {isEditingTasker ? (
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={taskerFormData.address}
                        onChange={handleTaskerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Your service area address"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        {taskerProfile?.address || 'Not set'}
                      </div>
                    )}
                  </div>

                  {/* Profile Image URL */}
                  <div>
                    <label htmlFor="profile_image_url" className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Image URL
                    </label>
                    {isEditingTasker ? (
                      <input
                        type="url"
                        id="profile_image_url"
                        name="profile_image_url"
                        value={taskerFormData.profile_image_url}
                        onChange={handleTaskerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        {taskerProfile?.profile_image_url || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditingTasker && (
                  <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleTaskerCancel}
                      disabled={savingTasker}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingTasker}
                      className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingTasker ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Debug Info - Remove after testing */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Current Role: {userRole || 'null'}</p>
              <p>User Roles: {JSON.stringify(userRoles)}</p>
              <p>Checking Roles: {checkingRoles ? 'true' : 'false'}</p>
            </div>
          )}

          {/* Role Selection Card - When user has roles but none is active */}
          {(userRole === Role.unauthorised || !userRole) && userRoles.length > 0 && (
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div>
                <h3 className="text-base font-semibold text-purple-900 mb-3">Select Your Profile</h3>
                <p className="text-sm text-purple-700 mb-4">
                  You have multiple profiles. Please select which one you'd like to use.
                </p>
                <div className="flex gap-3">
                  {userRoles.includes('client') && (
                    <button
                      onClick={handleSwitchToClient}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Use as Client
                    </button>
                  )}
                  {userRoles.includes('tasker') && (
                    <button
                      onClick={handleSwitchToTasker}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Use as Tasker
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role Switcher/Creator Card */}
          {userRole === Role.client && userRoles.includes('tasker') && (
            // Case 1: Client with tasker role - Switch to tasker
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-6 h-6 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-indigo-900">Switch to Tasker Profile</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                      You have a tasker profile. Switch to access tasker features, manage your services, and view task requests.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSwitchToTasker}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Switch to Tasker
                </button>
              </div>
            </div>
          )}

          {userRole === Role.client && !userRoles.includes('tasker') && (
            // Case 2: Client without tasker role - Create tasker profile
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-green-900">Become a Tasker</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Start earning by offering your services. Create a tasker profile to get started.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateTaskerProfile}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Create Tasker Profile
                </button>
              </div>
            </div>
          )}

          {userRole === Role.tasker && userRoles.includes('client') && (
            // Case 3: Tasker with client role - Switch to client
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-6 h-6 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-indigo-900">Switch to Client Profile</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                      You have a client profile. Switch to book services and manage your bookings.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSwitchToClient}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Switch to Client
                </button>
              </div>
            </div>
          )}

          {userRole === Role.tasker && !userRoles.includes('client') && (
            // Case 4: Tasker without client role - Create client profile
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-green-900">Create Client Profile</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Book services as a client. Create a client profile to get started.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateClientProfile}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Create Client Profile
                </button>
              </div>
            </div>
          )}

          {/* Additional Info Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Account Information</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Keep your contact information up to date to ensure smooth communication with taskers and service providers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
