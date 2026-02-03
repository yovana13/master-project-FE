import { useState, useEffect } from 'react';

interface Service {
  id: number;
  category_id: number;
  name: string;
  description: string;
  base_price: number;
  pricing_model: 'hourly' | 'sq_m';
}

interface TaskerService {
  service_id: string;
  pricing_model: 'hourly' | 'sq_m';
  price_hourly?: string;
  min_booking_minutes?: string;
  price_per_sq_m?: string;
  time_per_sq_m?: string;
  notes?: string;
}

interface StepTwoProps {
  userId: string | null;
  onNext: () => void;
  onBack: () => void;
  setError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export default function StepTwo({
  userId,
  onNext,
  onBack,
  setError,
  setIsLoading,
  isLoading
}: StepTwoProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [taskerServices, setTaskerServices] = useState<TaskerService[]>([
    {
      service_id: '',
      pricing_model: 'hourly',
      price_hourly: '',
      min_booking_minutes: '',
      price_per_sq_m: '',
      time_per_sq_m: '',
      notes: ''
    }
  ]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3007/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setError('Неуспешно зареждане на услуги');
    }
  };

  const handleAddService = () => {
    setTaskerServices([
      ...taskerServices,
      {
        service_id: '',
        pricing_model: 'hourly',
        price_hourly: '',
        min_booking_minutes: '',
        price_per_sq_m: '',
        time_per_sq_m: '',
        notes: ''
      }
    ]);
  };

  const handleRemoveService = (index: number) => {
    if (taskerServices.length > 1) {
      setTaskerServices(taskerServices.filter((_, i) => i !== index));
    }
  };

  const handleServiceChange = (index: number, field: keyof TaskerService, value: string) => {
    const updated = [...taskerServices];
    updated[index] = { ...updated[index], [field]: value };
    
    // Update pricing model based on selected service
    if (field === 'service_id') {
      const selectedService = services.find(s => s.id.toString() === value);
      if (selectedService) {
        updated[index].pricing_model = selectedService.pricing_model;
      }
    }
    
    setTaskerServices(updated);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitTaskerService();
  };

  const submitTaskerService = async () => {
    if (!userId) {
      setError('Трябва да сте влезли в профила си');
      return;
    }

    // Validate all services
    for (let i = 0; i < taskerServices.length; i++) {
      const service = taskerServices[i];
      if (!service.service_id) {
        setError(`Моля, изберете услуга за елемент ${i + 1}`);
        return;
      }
      if (service.pricing_model === 'hourly' && !service.price_hourly) {
        setError(`Моля, въведете цена на час за услуга ${i + 1}`);
        return;
      }
      if (service.pricing_model === 'sq_m' && !service.price_per_sq_m) {
        setError(`Моля, въведете цена на квадратен метър за услуга ${i + 1}`);
        return;
      }
      if (service.pricing_model === 'sq_m' && !service.time_per_sq_m) {
        setError(`Моля, въведете време на квадратен метър за услуга ${i + 1}`);
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Submit each service
      for (const service of taskerServices) {
        const requestBody: any = {
          service_id: service.service_id,
          price_hourly: service.price_hourly ? Math.round(parseFloat(service.price_hourly) * 100) : undefined,
          price_per_sq_m: service.price_per_sq_m ? Math.round(parseFloat(service.price_per_sq_m) * 100) : undefined,
          time_per_sq_m: service.time_per_sq_m ? parseInt(service.time_per_sq_m) : undefined,
          min_booking_minutes: service.min_booking_minutes ? parseInt(service.min_booking_minutes) : undefined,
          notes: service.notes || ''
        };

        const response = await fetch(`http://localhost:3007/taskers/${userId}/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Неуспешно добавяне на услуга' }));
          throw new Error(error.message || 'Неуспешно добавяне на услуга');
        }
      }

      console.log('All services added successfully');
      
      // Move to next step after successful save
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неуспешно добавяне на услуги. Моля, опитайте отново.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-6">
        {taskerServices.map((taskerService, index) => {
          const selectedService = services.find(s => s.id.toString() === taskerService.service_id);
          
          return (
            <div key={index} className="border border-gray-300 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900">Услуга {index + 1}</h3>
                {taskerServices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveService(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Премахни
                  </button>
                )}
              </div>

              <div>
                <label htmlFor={`serviceId-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Услуга *
                </label>
                <select
                  id={`serviceId-${index}`}
                  required
                  value={taskerService.service_id}
                  onChange={(e) => handleServiceChange(index, 'service_id', e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                >
                  <option value="">Изберете услуга</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedService && taskerService.pricing_model === 'hourly' && (
                <>
                  <div>
                    <label htmlFor={`priceHourly-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Цена на час (евро) *
                    </label>
                    <input
                      id={`priceHourly-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={taskerService.price_hourly}
                      onChange={(e) => handleServiceChange(index, 'price_hourly', e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="50.00"
                    />
                  </div>

                  <div>
                    <label htmlFor={`minBookingMinutes-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Минимална резервация (минути)
                    </label>
                    <input
                      id={`minBookingMinutes-${index}`}
                      type="number"
                      min="0"
                      step="15"
                      value={taskerService.min_booking_minutes}
                      onChange={(e) => handleServiceChange(index, 'min_booking_minutes', e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="60"
                    />
                  </div>
                </>
              )}

              {selectedService && taskerService.pricing_model === 'sq_m' && (
                <>
                  <div>
                    <label htmlFor={`pricePerSqM-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Цена на квадратен метър (евро) *
                    </label>
                    <input
                      id={`pricePerSqM-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={taskerService.price_per_sq_m}
                      onChange={(e) => handleServiceChange(index, 'price_per_sq_m', e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="5.00"
                    />
                  </div>

                  <div>
                    <label htmlFor={`timePerSqM-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Необходимо време на квадратен метър (минути) *
                    </label>
                    <input
                      id={`timePerSqM-${index}`}
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={taskerService.time_per_sq_m}
                      onChange={(e) => handleServiceChange(index, 'time_per_sq_m', e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="2.5"
                    />
                  </div>

                  <div>
                    <label htmlFor={`minBooking-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Минимална резервация (кв. метри)
                    </label>
                    <input
                      id={`minBooking-${index}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={taskerService.min_booking_minutes}
                      onChange={(e) => handleServiceChange(index, 'min_booking_minutes', e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="10"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor={`notes-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Бележки (опционално)
                </label>
                <textarea
                  id={`notes-${index}`}
                  rows={3}
                  value={taskerService.notes}
                  onChange={(e) => handleServiceChange(index, 'notes', e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Достъпен през седмицата, специални изисквания..."
                />
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddService}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:border-indigo-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          + Добави друга услуга
        </button>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Назад
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Запазване...' : 'Напред'}
        </button>
      </div>
    </form>
  );
}
