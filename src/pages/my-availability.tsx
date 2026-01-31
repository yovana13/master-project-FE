import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push(timeValue);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

interface DayAvailability {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function MyAvailability() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  
  // Initialize userRole from localStorage
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'tasker') return Role.tasker;
    }
    return Role.unauthorised;
  });

  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS_OF_WEEK.map(day => ({
      day_of_week: day.value,
      start_time: '09:00',
      end_time: '17:00',
      is_active: false
    }))
  );
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || userRole !== Role.tasker) {
      router.push('/');
      return;
    }

    fetchAvailability();
  }, [userId, userRole]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3007/users/${userId}/availability`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      const data = await response.json();
      
      // Merge fetched data with default availability
      const mergedAvailability = DAYS_OF_WEEK.map(day => {
        const existing = data.find((a: any) => a.day_of_week === day.value);
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            start_time: existing.start_time.substring(0, 5), // Remove seconds
            end_time: existing.end_time.substring(0, 5), // Remove seconds
            is_active: existing.is_active
          };
        }
        return {
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_active: false
        };
      });
      
      setAvailability(mergedAvailability);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (index: number) => {
    const updated = [...availability];
    updated[index].is_active = !updated[index].is_active;
    setAvailability(updated);
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const updated = [...availability];
    updated[index][field] = value;
    
    // If start time is changed and it's now after or equal to end time, adjust end time
    if (field === 'start_time') {
      const currentEndIndex = TIME_OPTIONS.indexOf(updated[index].end_time);
      const newStartIndex = TIME_OPTIONS.indexOf(value);
      
      if (newStartIndex >= currentEndIndex) {
        // Set end time to the next available option after start time
        updated[index].end_time = TIME_OPTIONS[newStartIndex + 1] || TIME_OPTIONS[TIME_OPTIONS.length - 1];
      }
    }
    
    setAvailability(updated);
  };

  const handleDeleteDay = async (dayOfWeek: string) => {
    if (!confirm(`Are you sure you want to remove availability for ${dayOfWeek}?`)) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`http://localhost:3007/users/${userId}/availability/${dayOfWeek}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete availability' }));
        throw new Error(errorData.message || 'Failed to delete availability');
      }

      // Update local state
      const updated = availability.map(day => 
        day.day_of_week === dayOfWeek 
          ? { ...day, is_active: false } 
          : day
      );
      setAvailability(updated);

      setSuccessMessage('Availability removed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete availability');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in');
      return;
    }

    // Validate times
    for (const day of availability) {
      if (day.is_active && day.start_time >= day.end_time) {
        setError(`Invalid time range for ${day.day_of_week}: start time must be before end time`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Submit availability for each day
      for (const day of availability) {
        const response = await fetch(`http://localhost:3007/users/${userId}/availability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            is_active: day.is_active
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to save availability' }));
          throw new Error(errorData.message || 'Failed to save availability');
        }
      }

      setSuccessMessage('Availability updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchAvailability();
    } catch (err) {
      console.error('Error saving availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading availability...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>My Availability</title>
        <meta name="description" content="Manage your availability" />
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
            <h1 className="text-2xl font-bold text-gray-900">My Availability</h1>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Availability Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Set Your Working Hours</h2>
              <p className="text-sm text-gray-600">Select the days you're available and set your working hours</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {availability.map((day, index) => {
                const dayLabel = DAYS_OF_WEEK[index].label;
                
                return (
                  <div key={day.day_of_week} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.is_active}
                          onChange={() => handleToggleDay(index)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="font-medium text-gray-900">{dayLabel}</span>
                      </label>
                      
                      {day.is_active && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDay(day.day_of_week)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    {day.is_active && (
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label htmlFor={`start-${day.day_of_week}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <select
                            id={`start-${day.day_of_week}`}
                            value={day.start_time}
                            onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor={`end-${day.day_of_week}`} className="block text-sm font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <select
                            id={`end-${day.day_of_week}`}
                            value={day.end_time}
                            onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            {TIME_OPTIONS.filter(time => time > day.start_time).map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Availability
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
