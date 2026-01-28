import { useState } from 'react';

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

interface StepThreeProps {
  userId: string | null;
  onBack: () => void;
  onComplete: () => void;
  setError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
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

export default function StepThree({
  userId,
  onBack,
  onComplete,
  setError,
  setIsLoading,
  isLoading
}: StepThreeProps) {
  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS_OF_WEEK.map(day => ({
      day_of_week: day.value,
      start_time: '09:00',
      end_time: '17:00',
      is_active: false
    }))
  );

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('Form submitted');
    console.log('User ID:', userId);
    
    if (!userId) {
      setError('You must be logged in');
      return;
    }

    // Check if at least one day is selected
    const activeDays = availability.filter(day => day.is_active);
    console.log('Active days:', activeDays);
    
    if (activeDays.length === 0) {
      setError('Please select at least one day');
      return;
    }

    // Validate times
    for (const day of activeDays) {
      if (day.start_time >= day.end_time) {
        setError(`Invalid time range for ${day.day_of_week}: start time must be before end time`);
        console.log(`Validation failed for ${day.day_of_week}: ${day.start_time} >= ${day.end_time}`);
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // Submit availability for each active day
      for (const day of activeDays) {
        console.log('Submitting day:', day);
        
        const response = await fetch(`http://localhost:3007/users/${userId}/availability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            is_active: day.is_active
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Failed to save availability' }));
          console.error('API Error:', error);
          throw new Error(error.message || 'Failed to save availability');
        }
        
        const data = await response.json();
        console.log('Success response:', data);
      }

      console.log('Availability saved successfully');
      onComplete();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to save availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Set Your Working Hours</h3>
        <p className="text-sm text-gray-600">Select the days you're available and set your working hours</p>
        
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
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Complete Profile'}
        </button>
      </div>
    </form>
  );
}
