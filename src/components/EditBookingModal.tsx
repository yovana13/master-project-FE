import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  address: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  details: string;
}

interface AvailableSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  date: string;
  dayOfWeek: string;
  availableSlots: AvailableSlot[];
}

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  taskerId: string;
  bookingDurationHours: number;
  onSuccess: () => void;
}

export default function EditBookingModal({
  isOpen,
  onClose,
  booking,
  taskerId,
  bookingDurationHours,
  onSuccess,
}: EditBookingModalProps) {
  const [formData, setFormData] = useState({
    address: '',
    startsAt: '',
    endsAt: '',
    priceCents: 0,
    details: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      setFormData({
        address: booking.address,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        priceCents: booking.priceCents,
        details: booking.details,
      });
      setError(null);
      setShowTimeSlots(false);
      setSelectedSlot(null);
      
      // Set default date range (next 7 days from current booking date or today)
      const bookingDate = new Date(booking.startsAt);
      const today = new Date();
      const startFromDate = bookingDate > today ? bookingDate : today;
      
      const nextWeek = new Date(startFromDate);
      nextWeek.setDate(startFromDate.getDate() + 6);

      const start = startFromDate.toISOString().split('T')[0];
      const end = nextWeek.toISOString().split('T')[0];

      setStartDate(start);
      setEndDate(end);
    }
  }, [isOpen, booking]);

  const fetchAvailability = async (start: string, end: string) => {
    try {
      setLoadingAvailability(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:3007/bookings/available-slots/${taskerId}?startDate=${start}&endDate=${end}`
      );

      if (!response.ok) {
        throw new Error('Неуспешно зареждане на наличността');
      }

      const data = await response.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Неуспешно зареждане на наличността. Моля, опитайте отново.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const generateAvailableStartTimes = (slots: AvailableSlot[]) => {
    const startTimes: { startTime: string; endTime: string }[] = [];
    const durationMs = bookingDurationHours * 60 * 60 * 1000;

    for (const slot of slots) {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      
      let currentTime = slotStart;
      
      while (currentTime + durationMs <= slotEnd) {
        const startTime = new Date(currentTime).toISOString();
        const endTime = new Date(currentTime + durationMs).toISOString();
        startTimes.push({ startTime, endTime });
        currentTime += 30 * 60 * 1000;
      }
    }

    return startTimes;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('bg-BG', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleShowTimeSlots = () => {
    setShowTimeSlots(true);
    fetchAvailability(startDate, endDate);
  };

  const handleSlotSelect = (date: string, startTime: string, endTime: string) => {
    setSelectedSlot({ date, startTime, endTime });
    setFormData(prev => ({
      ...prev,
      startsAt: startTime,
      endsAt: endTime,
    }));
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
    fetchAvailability(start, end);
  };

  const handlePreviousWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() - 7);

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
    fetchAvailability(start, end);
  };

  const canGoPrevious = () => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const prevWeekStart = new Date(start);
    prevWeekStart.setDate(start.getDate() - 7);
    
    return prevWeekStart >= today;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceCents' ? parseFloat(value) * 100 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const startsAt = formData.startsAt;
      const endsAt = formData.endsAt;

      // Validate dates
      if (new Date(startsAt) >= new Date(endsAt)) {
        throw new Error('Крайното време трябва да е след началното време');
      }

      const updateData = {
        address: formData.address,
        startsAt,
        endsAt,
        priceCents: Math.round(formData.priceCents),
        details: formData.details,
      };

      const response = await fetch(`http://localhost:3007/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Неуспешно актуализиране на резервацията' }));
        throw new Error(errorData.message || 'Неуспешно актуализиране на резервацията');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating booking:', err);
      setError(err instanceof Error ? err.message : 'Неуспешно актуализиране на резервацията');
    } finally {
      setLoading(false);
    }
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Редактирай резервация</h2>
              <p className="text-sm text-gray-600 mt-1">Актуализирайте детайлите на вашата резервация</p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Адрес
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата и час
              </label>
              
              {!showTimeSlots ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                    <div className="text-sm text-gray-600 mb-1">Текуща резервация:</div>
                    <div className="font-medium text-gray-900">
                      {new Date(formData.startsAt).toLocaleString('bg-BG', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Продължителност: {bookingDurationHours} час{bookingDurationHours !== 1 ? 'а' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleShowTimeSlots}
                    className="w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                  >
                    Промени часовия слот
                  </button>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  {/* Week Navigation */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={handlePreviousWeek}
                      disabled={!canGoPrevious()}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Предишна
                    </button>
                    <div className="text-xs font-medium text-gray-900">
                      {startDate && endDate && (
                        <>
                          {new Date(startDate).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Следваща →
                    </button>
                  </div>

                  {/* Available Slots */}
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {loadingAvailability ? (
                      <div className="text-center py-8 text-gray-600 text-sm">
                        Зареждане на наличността...
                      </div>
                    ) : availability.length === 0 ? (
                      <div className="text-center py-8 text-gray-600 text-sm">
                        Няма налични слотове за тази седмица
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availability.map((day) => {
                          const availableStartTimes = generateAvailableStartTimes(day.availableSlots);
                          
                          if (availableStartTimes.length === 0) return null;
                          
                          return (
                            <div key={day.date}>
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                                {formatDate(day.date)}
                              </h4>
                              <div className="grid grid-cols-3 gap-2">
                                {availableStartTimes.map((timeSlot, index) => {
                                  const isSelected = 
                                    selectedSlot?.date === day.date && 
                                    selectedSlot?.startTime === timeSlot.startTime;
                                  
                                  return (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => handleSlotSelect(day.date, timeSlot.startTime, timeSlot.endTime)}
                                      className={`px-2 py-2 text-xs font-medium rounded border transition-colors ${
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
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedSlot && (
                    <div className="p-3 bg-green-50 border-t border-green-200 text-sm text-green-800">
                      ✓ Избрано: {formatDate(selectedSlot.date)} в {formatTime(selectedSlot.startTime)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price (Read-only) */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Цена
              </label>
              <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                ${(formData.priceCents / 100).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Цената не може да бъде променена</p>
            </div>

            {/* Details */}
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
                Допълнителни детайли
              </label>
              <textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Отказ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Запазване...' : 'Запази промените'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
