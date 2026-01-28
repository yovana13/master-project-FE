import { useEffect, useState } from 'react';

interface AvailableSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  date: string;
  dayOfWeek: string;
  availableSlots: AvailableSlot[];
}

interface BookingCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  taskerId: number;
  taskerName: string;
  bookingHours: number;
  pricingModel?: 'hourly' | 'sq_m';
  squareMeters?: string;
  onBookingConfirm: (taskerId: number, selectedSlot: { start: string; end: string }) => void;
}

export default function BookingCalendar({
  isOpen,
  onClose,
  taskerId,
  taskerName,
  bookingHours,
  pricingModel,
  squareMeters,
  onBookingConfirm,
}: BookingCalendarProps) {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (isOpen && taskerId) {
      // Set default date range (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 6);

      const start = today.toISOString().split('T')[0];
      const end = nextWeek.toISOString().split('T')[0];

      setStartDate(start);
      setEndDate(end);
      
      fetchAvailability(taskerId, start, end);
    }
  }, [isOpen, taskerId]);

  const fetchAvailability = async (taskerId: number, start: string, end: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:3007/bookings/available-slots/${taskerId}?startDate=${start}&endDate=${end}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const generateAvailableStartTimes = (slots: AvailableSlot[]) => {
    const startTimes: { startTime: string; endTime: string }[] = [];
    const durationMs = bookingHours * 60 * 60 * 1000; // Convert hours to milliseconds

    for (const slot of slots) {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      
      // Generate start times in 30-minute intervals
      let currentTime = slotStart;
      
      while (currentTime + durationMs <= slotEnd) {
        const startTime = new Date(currentTime).toISOString();
        const endTime = new Date(currentTime + durationMs).toISOString();
        startTimes.push({ startTime, endTime });
        currentTime += 30 * 60 * 1000; // Move to next 30-minute interval
      }
    }

    return startTimes;
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedSlot({ date, startTime, endTime });
  };

  const handleConfirm = () => {
    if (selectedSlot) {
      onBookingConfirm(taskerId, { start: selectedSlot.startTime, end: selectedSlot.endTime });
      onClose();
    }
  };

  const handleNextWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() + 7);

    const start = newStart.toISOString().split('T')[0];
    const end = newEnd.toISOString().split('T')[0];

    setStartDate(start);
    setEndDate(end);
    setSelectedSlot(null);
    fetchAvailability(taskerId, start, end);
  };

  const handlePreviousWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() - 7);

    // Don't go before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newStart < today) {
      return;
    }

    const start = newStart.toISOString().split('T')[0];
    const end = newEnd.toISOString().split('T')[0];

    setStartDate(start);
    setEndDate(end);
    setSelectedSlot(null);
    fetchAvailability(taskerId, start, end);
  };

  const canGoPrevious = () => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const prevWeekStart = new Date(start);
    prevWeekStart.setDate(start.getDate() - 7);
    
    return prevWeekStart >= today;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select a Time Slot</h2>
              <p className="text-sm text-gray-600 mt-1">Booking with {taskerName}</p>
              {pricingModel === 'sq_m' && squareMeters && (
                <p className="text-sm text-indigo-600 mt-1">
                  Estimated duration: {bookingHours} hour{bookingHours !== 1 ? 's' : ''} for {squareMeters} m²
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <button
              onClick={handlePreviousWeek}
              disabled={!canGoPrevious()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous Week
            </button>
            <div className="text-sm font-medium text-gray-900">
              {startDate && endDate && (
                <>
                  {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </>
              )}
            </div>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next Week →
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading availability...</div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : availability.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No available time slots for this week.</p>
                <p className="text-sm text-gray-500 mt-2">Try selecting a different week.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {availability.map((day) => (
                  <div key={day.date} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {formatDate(day.date)}
                    </h3>
                    
                    {day.availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500">No available slots</p>
                    ) : (() => {
                      const availableStartTimes = generateAvailableStartTimes(day.availableSlots);
                      
                      if (availableStartTimes.length === 0) {
                        return <p className="text-sm text-gray-500">No available start times for {bookingHours} hour booking</p>;
                      }
                      
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {availableStartTimes.map((timeSlot, index) => {
                            const isSelected = 
                              selectedSlot?.date === day.date && 
                              selectedSlot?.startTime === timeSlot.startTime;
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleSlotSelect(day.date, timeSlot.startTime, timeSlot.endTime)}
                                className={`px-4 py-3 text-sm font-medium rounded-md border transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {formatTime(timeSlot.startTime)}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedSlot ? (
                <span>
                  Selected: {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.startTime)} ({bookingHours} hour{bookingHours !== 1 ? 's' : ''})
                </span>
              ) : (
                <span>Please select a start time</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedSlot}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
