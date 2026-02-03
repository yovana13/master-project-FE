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
      setError('Трябва да сте влезли в профила си, за да станете изпълнител');
      return;
    }

    if (cities.length === 0) {
      setError('Моля, изберете поне един град');
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
        const error = await response.json().catch(() => ({ message: 'Неуспешно създаване на профил на изпълнител' }));
        throw new Error(error.message || 'Неуспешно създаване на профил на изпълнител');
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
        const error = await citiesResponse.json().catch(() => ({ message: 'Неуспешно запазване на градове' }));
        throw new Error(error.message || 'Неуспешно запазване на градове');
      }

      console.log('Cities saved successfully');
      
      // Move to next step after successful save
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неуспешно създаване на профил на изпълнител. Моля, опитайте отново.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Три имена
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Вашето цяло име"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Пол
          </label>
          <select
            id="gender"
            name="gender"
            required
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          >
            <option value="">Изберете пол</option>
            <option value="male">Мъж</option>
            <option value="female">Жена</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Биография
          </label>
          <textarea
            id="bio"
            name="bio"
            required
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Разкажете ни за вашите умения и опит..."
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Адрес
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Вашият адрес"
          />
        </div>

        <CitiesSelector
          selectedCities={cities}
          onCitiesChange={setCities}
          label="Градове *"
          description="Изберете градовете, в които сте готови да работите"
          showSelectedCities={false}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Профилна снимка
          </label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="profileImage"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Избери файл
            </label>
            <input
              id="profileImage"
              name="profileImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {profileImage && (
              <p className="text-sm text-gray-600">{profileImage.name}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Запазване...' : 'Напред'}
        </button>
      </div>
    </form>
  );
}
