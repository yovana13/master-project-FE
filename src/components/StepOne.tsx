import { useState } from 'react';
import CitiesSelector from './CitiesSelector';

interface StepOneProps {
  userId: string | null;
  displayName: string;
  setDisplayName: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  profileImage: File | null;
  setProfileImage: (file: File | null) => void;
  cities: string[];
  setCities: (cities: string[]) => void;
  onNext: () => void;
  setError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function StepOne({
  userId,
  displayName,
  setDisplayName,
  gender,
  setGender,
  bio,
  setBio,
  address,
  setAddress,
  profileImage,
  setProfileImage,
  cities,
  setCities,
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

    if (cities.length === 0) {
      setError('Please select at least one city');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('gender', gender);
      formData.append('bio', bio);
      formData.append('address', address);
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

      // Submit cities
      const citiesResponse = await fetch(`http://localhost:3007/users/${userId}/cities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cities }),
      });

      if (!citiesResponse.ok) {
        const error = await citiesResponse.json().catch(() => ({ message: 'Failed to save cities' }));
        throw new Error(error.message || 'Failed to save cities');
      }

      console.log('Cities saved successfully');
      
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
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            required
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          >
            <option value="">Select gender</option>
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
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
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Your address"
          />
        </div>

        <CitiesSelector
          selectedCities={cities}
          onCitiesChange={setCities}
          label="Cities *"
          description="Select the cities where you're willing to work"
          showSelectedCities={false}
        />

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
