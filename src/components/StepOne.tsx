import { useState } from 'react';

interface StepOneProps {
  userId: string | null;
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  serviceRadiusKm: string;
  setServiceRadiusKm: (value: string) => void;
  profileImage: File | null;
  setProfileImage: (file: File | null) => void;
  onNext: () => void;
  setError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function StepOne({
  userId,
  displayName,
  setDisplayName,
  bio,
  setBio,
  serviceRadiusKm,
  setServiceRadiusKm,
  profileImage,
  setProfileImage,
  onNext,
  setError,
  setIsLoading,
  isLoading
}: StepOneProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitTaskerProfile();
  };

  const submitTaskerProfile = async () => {
    if (!userId) {
      setError('You must be logged in to become a tasker');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('bio', bio);
      formData.append('service_radius_km', serviceRadiusKm);
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3007/users/${userId}/tasker-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create tasker profile' }));
        throw new Error(error.message || 'Failed to create tasker profile');
      }

      console.log('Tasker profile created successfully');
      
      // Move to next step after successful save
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasker profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Your professional name"
          />
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            required
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Tell us about your skills and experience..."
          />
        </div>

        <div>
          <label htmlFor="serviceRadiusKm" className="block text-sm font-medium text-gray-700 mb-1">
            Service Radius (km)
          </label>
          <input
            id="serviceRadiusKm"
            name="serviceRadiusKm"
            type="number"
            min="0"
            step="0.1"
            required
            value={serviceRadiusKm}
            onChange={(e) => setServiceRadiusKm(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="10"
          />
          <p className="mt-1 text-xs text-gray-500">How far are you willing to travel for tasks?</p>
        </div>

        <div>
          <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
            Profile Image
          </label>
          <input
            id="profileImage"
            name="profileImage"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          />
          {profileImage && (
            <p className="mt-1 text-xs text-gray-500">Selected: {profileImage.name}</p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Next'}
        </button>
      </div>
    </form>
  );
}
