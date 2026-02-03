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
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_document_url?: string;
  verification_document_type?: 'id_card' | 'passport' | 'driver_license' | 'other';
  verified_at?: string;
  verification_notes?: string;
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
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  // Verification document state
  const [documentType, setDocumentType] = useState<'id_card' | 'passport' | 'driver_license' | 'other'>('id_card');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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
        
        // Set verification status and document type
        setVerificationStatus(data.verification_status || 'unverified');
        if (data.verification_document_type) {
          setDocumentType(data.verification_document_type);
        }
      }
    } catch (err) {
      console.error('Error fetching tasker profile:', err);
    }
  };

  const handleSwitchToTasker = () => {
    onSetUserRole(Role.tasker);
    setSuccessMessage('Превключихте успешно към профил на изпълнител!');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const handleSwitchToClient = () => {
    onSetUserRole(Role.client);
    setSuccessMessage('Превключихте успешно към клиентски профил!');
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
      setSuccessMessage('Профилът е актуализиран успешно!');
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Новата парола и потвърждението не съвпадат');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Новата парола трябва да бъде поне 6 символа');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(`http://localhost:3007/users/${userId}/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Неуспешна промяна на паролата' }));
        throw new Error(errorData.message || 'Неуспешна промяна на паролата');
      }

      setPasswordSuccess('Паролата е променена успешно!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Неуспешна промяна на паролата');
    } finally {
      setChangingPassword(false);
    }
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
      setSuccessMessage('Профилът на изпълнител е актуализиран успешно!');
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
    setProfileImageFile(null);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
    }
  };

  const handleProfileImageUpload = async () => {
    if (!profileImageFile || !userId) return;

    try {
      setUploadingProfileImage(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', profileImageFile);

      const response = await fetch(`http://localhost:3007/users/${userId}/profile-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Неуспешно качване на профилната снимка');
      }

      const data = await response.json();
      setSuccessMessage('Профилната снимка е качена успешно!');
      setProfileImageFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('profile-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh tasker profile to get updated image URL
      fetchTaskerProfile();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setError(err instanceof Error ? err.message : 'Неуспешно качване на профилната снимка');
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentFile) {
      setVerificationMessage({ text: 'Моля, изберете документ за качване', type: 'error' });
      return;
    }

    try {
      setUploadingDocument(true);
      setVerificationMessage(null);

      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('document', documentFile);

      const response = await fetch(`http://localhost:3007/users/tasker/${userId}/verification-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload verification document');
      }

      setVerificationMessage({ text: 'Документът за верификация е качен успешно! Вашият профил ще бъде прегледан.', type: 'success' });
      setDocumentFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('document') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh tasker profile to get updated verification status
      fetchTaskerProfile();

      setTimeout(() => setVerificationMessage(null), 5000);
    } catch (err) {
      console.error('Error uploading verification document:', err);
      setVerificationMessage({ text: 'Неуспешно качване на документа. Моля, опитайте отново.', type: 'error' });
      setTimeout(() => setVerificationMessage(null), 5000);
    } finally {
      setUploadingDocument(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Зареждане на вашия акаунт...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Моят акаунт</title>
        <meta name="description" content="Управление на настройките на акаунта" />
      </Head>

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
                <h2 className="text-xl font-semibold text-gray-900">Информация за профила</h2>
                <p className="text-sm text-gray-600 mt-1">Управление на вашата лична информация</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Редактирай профил
                </button>
              )}
            </div>

            {/* Card Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Име
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
                      {userData?.name || 'Не е зададено'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Имейл
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
                      {userData?.email || 'Не е зададено'}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Телефонен номер
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
                      {userData?.phone || 'Не е зададено'}
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
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Запазване...' : 'Запази промените'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Password Change Card */}
          <div className="mt-6 bg-white rounded-lg shadow-sm">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Промяна на парола</h2>
                <p className="text-sm text-gray-600 mt-1">Актуализирайте вашата парола за сигурност</p>
              </div>
            </div>

            {/* Card Body */}
            <form onSubmit={handlePasswordSubmit} className="p-6">
              {/* Password Success Message */}
              {passwordSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-600">{passwordSuccess}</p>
                  </div>
                </div>
              )}

              {/* Password Error Message */}
              {passwordError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{passwordError}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Текуща парола *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Въведете текущата парола"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Нова парола *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Въведете нова парола (поне 6 символа)"
                  />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Потвърди нова парола *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Потвърдете новата парола"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Промяна...' : 'Промени паролата'}
                </button>
              </div>
            </form>
          </div>

          {/* Tasker Profile Card - Only visible for taskers */}
          {userRole === Role.tasker && (
            <div className="mt-6 bg-white rounded-lg shadow-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Профил на изпълнител</h2>
                  <p className="text-sm text-gray-600 mt-1">Управление на вашата информация като изпълнител</p>
                </div>
                {!isEditingTasker && (
                  <button
                    onClick={() => setIsEditingTasker(true)}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактирай профил на изпълнител
                  </button>
                )}
              </div>

              {/* Card Body */}
              <form onSubmit={handleTaskerSubmit} className="p-6">
                {/* Profile Image Preview */}
                {taskerProfile?.profile_image_url && (
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <img
                        src={taskerProfile.profile_image_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                      {taskerProfile.verification_status === 'verified' && (
                        <span className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-1.5 border-2 border-white" title="Потвърден изпълнител">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Image Upload - Only in edit mode */}
                {isEditingTasker && (
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Актуализирай профилна снимка</h3>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="profile-image" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Избери файл
                        </label>
                        <input
                          type="file"
                          id="profile-image"
                          onChange={handleProfileImageChange}
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingProfileImage}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Приети формати: JPG, PNG, GIF. Максимален размер: 5MB
                      </p>
                      {profileImageFile && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-indigo-900 font-medium">{profileImageFile.name}</span>
                            <span className="text-xs text-indigo-600">({(profileImageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleProfileImageUpload}
                            disabled={uploadingProfileImage}
                            className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingProfileImage ? 'Качване...' : 'Качи'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Показвано име
                    </label>
                    {isEditingTasker ? (
                      <input
                        type="text"
                        id="display_name"
                        name="display_name"
                        value={taskerFormData.display_name}
                        onChange={handleTaskerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Вашето професионално име"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        {taskerProfile?.display_name || 'Не е зададено'}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Биография
                    </label>
                    {isEditingTasker ? (
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={taskerFormData.bio}
                        onChange={handleTaskerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Разкажете на клиентите за вашия опит и умения..."
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 whitespace-pre-wrap">
                        {taskerProfile?.bio || 'Не е зададено'}
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Адрес
                    </label>
                    {isEditingTasker ? (
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={taskerFormData.address}
                        onChange={handleTaskerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Адрес на областта за обслужване"
                      />
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                        {taskerProfile?.address || 'Не е зададено'}
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
                      Отказ
                    </button>
                    <button
                      type="submit"
                      disabled={savingTasker}
                      className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingTasker ? 'Запазване...' : 'Запази промените'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Profile Verification Card - Only visible for taskers */}
          {userRole === Role.tasker && (
            <div className="mt-6 bg-white rounded-lg shadow-sm">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Верификация на профил</h2>
                    <p className="text-sm text-gray-600 mt-1">Качете документ за верификация, за да потвърдите самоличността си</p>
                  </div>
                  {/* Verification Status Badge */}
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                    verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {verificationStatus === 'verified' ? '✓ Потвърден' :
                     verificationStatus === 'pending' ? '⏳ Чака преглед' :
                     verificationStatus === 'rejected' ? '✗ Отказан' :
                     '○ Непотвърден'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <form onSubmit={handleVerificationSubmit} className="p-6">
                {/* Verification Status Info */}
                {verificationStatus === 'pending' && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-yellow-800">
                        Вашият документ за верификация в момента се преглежда. Ще бъдете уведомени, когато прегледът бъде завършен.
                      </p>
                    </div>
                  </div>
                )}

                {verificationStatus === 'verified' && taskerProfile?.verified_at && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                      <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-green-800">
                        <p className="font-medium">Вашият профил е потвърден!</p>
                        <p className="mt-1">Потвърден на {new Date(taskerProfile.verified_at).toLocaleDateString('bg-BG')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {verificationStatus === 'rejected' && taskerProfile?.verification_notes && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-red-800">
                        <p className="font-medium">Вашата верификация беше отказана.</p>
                        <p className="mt-1"><strong>Причина:</strong> {taskerProfile.verification_notes}</p>
                        <p className="mt-2">Моля, изпратете отново документа си с поисканите промени.</p>
                      </div>
                    </div>
                  </div>
                )}

                {verificationMessage && (
                  <div className={`mb-6 p-4 rounded-md ${
                    verificationMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      verificationMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {verificationMessage.text}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Document Type */}
                  <div>
                    <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
                      Вид документ
                    </label>
                    <select
                      id="documentType"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as 'id_card' | 'passport' | 'driver_license' | 'other')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={uploadingDocument || verificationStatus === 'pending' || verificationStatus === 'verified'}
                    >
                      <option value="id_card">Лична карта</option>
                      <option value="passport">Паспорт</option>
                      <option value="driver_license">Шофьорска книжка</option>
                      <option value="other">Друго</option>
                    </select>
                  </div>

                  {/* Current Document Display (for pending/verified) */}
                  {(verificationStatus === 'pending' || verificationStatus === 'verified') && taskerProfile?.verification_document_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Качен документ
                      </label>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-900 font-medium">Документ изпратен</span>
                          </div>
                          <a
                            href={taskerProfile.verification_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Преглед на документа →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Upload - Only for unverified/rejected */}
                  {(verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
                    <div>
                      <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                        Качване на документ
                      </label>
                      <div>
                        <label htmlFor="document" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Избери файл
                        </label>
                        <input
                          type="file"
                          id="document"
                          onChange={handleDocumentFileChange}
                          accept="image/*,.pdf"
                          className="hidden"
                          disabled={uploadingDocument}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Приети формати: Изображения (JPG, PNG) или PDF. Максимален размер: 10MB
                      </p>
                    </div>
                  )}

                  {/* Selected File Display */}
                  {documentFile && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-indigo-900 font-medium">{documentFile.name}</span>
                        <span className="text-xs text-indigo-600">({(documentFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button - Only for unverified/rejected */}
                {(verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
                  <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={uploadingDocument || !documentFile}
                      className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploadingDocument ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Качване...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {verificationStatus === 'rejected' ? 'Изпрати отново документа' : 'Качи документ'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Role Selection Card - When user has roles but none is active */}
          {(userRole === Role.unauthorised || !userRole) && userRoles.length > 0 && (
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div>
                <h3 className="text-base font-semibold text-purple-900 mb-3">Изберете вашия профил</h3>
                <p className="text-sm text-purple-700 mb-4">
                  Имате множество профили. Моля, изберете кой искате да използвате.
                </p>
                <div className="flex gap-3">
                  {userRoles.includes('client') && (
                    <button
                      onClick={handleSwitchToClient}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Използвай като клиент
                    </button>
                  )}
                  {userRoles.includes('tasker') && (
                    <button
                      onClick={handleSwitchToTasker}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Използвай като изпълнител
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
                    <h3 className="text-base font-semibold text-indigo-900">Превключи към профил на изпълнител</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                      Имате профил на изпълнител. Превключете, за да получите достъп до функциите за изпълнители, управление на услуги и заявки за задачи.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSwitchToTasker}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Превключи към изпълнител
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
                    <h3 className="text-base font-semibold text-green-900">Станете изпълнител</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Започнете да печелите, като предлагате вашите услуги. Създайте профил на изпълнител, за да започнете.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateTaskerProfile}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Създай профил на изпълнител
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
                    <h3 className="text-base font-semibold text-indigo-900">Превключи към клиентски профил</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                      Имате клиентски профил. Превключете, за да резервирате услуги и управлявате вашите резервации.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSwitchToClient}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Превключи към клиент
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
                    <h3 className="text-base font-semibold text-green-900">Създай клиентски профил</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Резервирайте услуги като клиент. Създайте клиентски профил, за да започнете.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateClientProfile}
                  disabled={checkingRoles}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Създай клиентски профил
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
                <h3 className="text-sm font-medium text-blue-900">Информация за акаунта</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Поддържайте вашата контактна информация актуална, за да осигурите безпроблемна комуникация с изпълнители и доставчици на услуги.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
