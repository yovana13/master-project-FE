import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';
import CitiesSelector from '../components/CitiesSelector';

interface Service {
  id: string;
  name: string;
  description: string;
  pricing_model: 'hourly' | 'sq_m';
  category_id: number;
  average_price?: number;
}

interface TaskerService {
  id: string;
  tasker_id: string;
  service_id: string;
  price_hourly: number | null;
  price_per_sq_m: number | null;
  time_per_sq_m: number | null;
  min_booking_minutes: number;
  is_active: boolean;
  notes: string | null;
}

interface ServiceFormData {
  serviceId: string;
  priceHourly: string;
  pricePerSqM: string;
  timePerSqM: string;
  minBookingMinutes: string;
  notes: string;
}

export default function MyServices() {
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

  const [taskerServices, setTaskerServices] = useState<TaskerService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [taskerCities, setTaskerCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [citiesSuccessMessage, setCitiesSuccessMessage] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<TaskerService | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ServiceFormData>({
    serviceId: '',
    priceHourly: '',
    pricePerSqM: '',
    timePerSqM: '',
    minBookingMinutes: '60',
    notes: '',
  });

  useEffect(() => {
    if (!userId || userRole !== Role.tasker) {
      router.push('/');
      return;
    }

    fetchTaskerServices();
    fetchAllServices();
    fetchTaskerCities();
  }, [userId, userRole]);

  const fetchTaskerServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3007/taskers/${userId}/services`);
      
      if (!response.ok) {
        throw new Error('Неуспешно зареждане на услугите');
      }
      
      const data = await response.json();
      setTaskerServices(data);
    } catch (err) {
      console.error('Error fetching tasker services:', err);
      setError('Неуспешно зареждане на вашите услуги');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllServices = async () => {
    try {
      const response = await fetch('http://localhost:3007/services');
      
      if (!response.ok) {
        throw new Error('Неуспешно зареждане на услугите');
      }
      
      const data = await response.json();
      setAllServices(data);
    } catch (err) {
      console.error('Error fetching all services:', err);
    }
  };

  const fetchTaskerCities = async () => {
    try {
      const response = await fetch(`http://localhost:3007/users/${userId}/cities`);
      
      if (!response.ok) {
        throw new Error('Неуспешно зареждане на градовете');
      }
      
      const data = await response.json();
      // Extract city names from the response array
      const cityNames = data.map((item: any) => item.city);
      setTaskerCities(cityNames);
    } catch (err) {
      console.error('Error fetching tasker cities:', err);
    }
  };

  const handleUpdateCities = async () => {
    try {
      setError(null);
      setCitiesSuccessMessage(null);

      const response = await fetch(`http://localhost:3007/users/${userId}/cities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cities: taskerCities }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Неуспешно актуализиране на градовете' }));
        throw new Error(errorData.message || 'Неуспешно актуализиране на градовете');
      }

      setCitiesSuccessMessage('Градовете са актуализирани успешно!');
      setTimeout(() => setCitiesSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating cities:', err);
      setError(err instanceof Error ? err.message : 'Неуспешно актуализиране на градовете');
    }
  };



  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        service_id: formData.serviceId,
        min_booking_minutes: parseInt(formData.minBookingMinutes),
        is_active: true,
        notes: formData.notes,
      };

      // Add pricing based on selected service type
      const selectedService = allServices.find(s => s.id === formData.serviceId);
      if (selectedService?.pricing_model === 'hourly') {
        payload.price_hourly = Math.round(parseFloat(formData.priceHourly) * 100);
      } else if (selectedService?.pricing_model === 'sq_m') {
        payload.price_per_sq_m = Math.round(parseFloat(formData.pricePerSqM) * 100);
        payload.time_per_sq_m = parseInt(formData.timePerSqM);
      }

      const response = await fetch(`http://localhost:3007/taskers/${userId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Неуспешно добавяне на услуга' }));
        throw new Error(errorData.message || 'Неуспешно добавяне на услуга');
      }

      setSuccessMessage('Услугата е добавена успешно!');
      setShowAddModal(false);
      resetForm();
      await fetchTaskerServices();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding service:', err);
      setError(err instanceof Error ? err.message : 'Неуспешно добавяне на услуга');
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setError(null);
    setSuccessMessage(null);

    try {
      const serviceDetails = allServices.find(s => s.id === editingService.service_id);
      
      const payload: any = {
        minBookingMinutes: parseInt(formData.minBookingMinutes),
        isActive: true,
      };

      // Add pricing based on service type
      if (serviceDetails?.pricing_model === 'hourly') {
        payload.priceHourly = Math.round(parseFloat(formData.priceHourly) * 100);
      } else if (serviceDetails?.pricing_model === 'sq_m') {
        payload.pricePerSqM = Math.round(parseFloat(formData.pricePerSqM) * 100);
        payload.timePerSqM = parseInt(formData.timePerSqM);
      }

      console.log("editing: ", editingService);

      const response = await fetch(`http://localhost:3007/taskers/${userId}/services/${editingService.service_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Неуспешно актуализиране на услугата' }));
        throw new Error(errorData.message || 'Неуспешно актуализиране на услугата');
      }

      setSuccessMessage('Услугата е актуализирана успешно!');
      setShowEditModal(false);
      setEditingService(null);
      resetForm();
      await fetchTaskerServices();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating service:', err);
      setError(err instanceof Error ? err.message : 'Неуспешно актуализиране на услугата');
    }
  };

  const handleDeleteService = async (taskerServiceId: string) => {
    if (!confirm('Сигурни ли сте, че искате да премахнете тази услуга?')) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`http://localhost:3007/taskers/${userId}/services/${taskerServiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Неуспешно изтриване на услугата' }));
        throw new Error(errorData.message || 'Неуспешно изтриване на услугата');
      }

      setSuccessMessage('Услугата е премахната успешно!');
      await fetchTaskerServices();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err instanceof Error ? err.message : 'Неуспешно премахване на услугата');
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (service: TaskerService) => {
    setEditingService(service);
    setFormData({
      serviceId: service.service_id,
      priceHourly: service.price_hourly ? (service.price_hourly / 100).toFixed(2) : '',
      pricePerSqM: service.price_per_sq_m ? (service.price_per_sq_m / 100).toFixed(2) : '',
      timePerSqM: service.time_per_sq_m?.toString() || '',
      minBookingMinutes: service.min_booking_minutes.toString(),
      notes: service.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      serviceId: '',
      priceHourly: '',
      pricePerSqM: '',
      timePerSqM: '',
      minBookingMinutes: '60',
      notes: '',
    });
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingService(null);
    resetForm();
    setError(null);
  };

  const getAvailableServices = () => {
    const taskerServiceIds = taskerServices.map(ts => ts.service_id);
    return allServices.filter(s => !taskerServiceIds.includes(s.id));
  };

  const selectedService = allServices.find(s => s.id === formData.serviceId);
  const editServiceDetails = editingService ? allServices.find(s => s.id === editingService.service_id) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Зареждане на вашите услуги...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Моите услуги</title>
        <meta name="description" content="Управление на вашите услуги" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Моите услуги</h1>
            </div>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Добави услуга
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Services Grid */}
          {taskerServices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Няма услуги още</h3>
              <p className="text-gray-600 mb-6">Добавете вашата първа услуга, за да започнете да приемате резервации</p>
              <button
                onClick={openAddModal}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Добавете вашата първа услуга
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {taskerServices.map((taskerService) => {
                const serviceDetails = allServices.find(s => s.id === taskerService.service_id);
                return (
                  <div
                    key={taskerService.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {serviceDetails?.name || 'Service'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {serviceDetails?.description || ''}
                        </p>
                      </div>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded ${
                        taskerService.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {taskerService.is_active ? 'Активна' : 'Неактивна'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {serviceDetails?.pricing_model === 'hourly' && taskerService.price_hourly && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Часова тарифа:</span>
                          <span className="font-medium text-gray-900">
                            {(taskerService.price_hourly / 100).toFixed(2)} евро/час
                          </span>
                        </div>
                      )}
                      {serviceDetails?.pricing_model === 'sq_m' && (
                        <>
                          {taskerService.price_per_sq_m && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">На квадратен метър:</span>
                              <span className="font-medium text-gray-900">
                                {(taskerService.price_per_sq_m / 100).toFixed(2)} евро/м²
                              </span>
                            </div>
                          )}
                          {taskerService.time_per_sq_m && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Време на м²:</span>
                              <span className="font-medium text-gray-900">
                                {taskerService.time_per_sq_m} мин
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Мин. резервация:</span>
                        <span className="font-medium text-gray-900">
                          {taskerService.min_booking_minutes} мин
                        </span>
                      </div>
                    </div>

                  {taskerService.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                      {taskerService.notes}
                    </div>
                  )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(taskerService)}
                        className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Редактирай
                      </button>
                      <button
                        onClick={() => handleDeleteService(taskerService.service_id)}
                        className="flex-1 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                      >
                        Премахни
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cities Management Section */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Зони на обслужване</h2>
                <p className="text-sm text-gray-600">Управление на градовете, в които предлагате вашите услуги</p>
              </div>
            </div>

            {/* Cities Success Message */}
            {citiesSuccessMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-600">{citiesSuccessMessage}</p>
                </div>
              </div>
            )}

            <CitiesSelector
              selectedCities={taskerCities}
              onCitiesChange={setTaskerCities}
              label="Изберете градове"
              description="Управление на градовете, в които предлагате вашите услуги"
              showSelectedCities={true}
            />

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleUpdateCities}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Запази градовете
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Добави услуга</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">
                  Услуга *
                </label>
                <select
                  id="serviceId"
                  required
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Изберете услуга</option>
                  {getAvailableServices().map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.pricing_model === 'hourly' ? 'По час' : 'На м²'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedService?.pricing_model === 'hourly' && (
                <div>
                  <label htmlFor="priceHourly" className="block text-sm font-medium text-gray-700 mb-1">
                    Часова тарифа (евро) *
                  </label>
                  <input
                    id="priceHourly"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.priceHourly}
                    onChange={(e) => setFormData({ ...formData, priceHourly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="50.00"
                  />
                  {typeof selectedService.average_price === 'number' && (
                    <div className="mt-2 text-xs text-gray-500 bg-blue-50 rounded p-2">
                      Средна цена за тази услуга: <b>{(selectedService.average_price / 100).toFixed(2)} евро/час</b>
                    </div>
                  )}
                </div>
              )}

              {selectedService?.pricing_model === 'sq_m' && (
                <>
                  <div>
                    <label htmlFor="pricePerSqM" className="block text-sm font-medium text-gray-700 mb-1">
                      Цена на м² (евро) *
                    </label>
                    <input
                      id="pricePerSqM"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.pricePerSqM}
                      onChange={(e) => setFormData({ ...formData, pricePerSqM: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="3.00"
                    />
                    {typeof selectedService.average_price === 'number' && (
                      <div className="mt-2 text-xs text-gray-500 bg-blue-50 rounded p-2">
                        Средна цена за тази услуга: <b>{(selectedService.average_price / 100).toFixed(2)} евро/м²</b>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="timePerSqM" className="block text-sm font-medium text-gray-700 mb-1">
                      Време на м² (минути) *
                    </label>
                    <input
                      id="timePerSqM"
                      type="number"
                      required
                      min="1"
                      value={formData.timePerSqM}
                      onChange={(e) => setFormData({ ...formData, timePerSqM: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="5"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="minBookingMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Минимална резервация (минути) *
                </label>
                <input
                  id="minBookingMinutes"
                  type="number"
                  required
                  min="1"
                  value={formData.minBookingMinutes}
                  onChange={(e) => setFormData({ ...formData, minBookingMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="60"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Бележки
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Допълнителна информация за тази услуга..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Добави услуга
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Редактирай услуга</h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-900">{editServiceDetails?.name}</p>
              <p className="text-xs text-gray-600 mt-1">{editServiceDetails?.description}</p>
            </div>

            <form onSubmit={handleUpdateService} className="space-y-4">
              {editServiceDetails?.pricing_model === 'hourly' && (
                <div>
                  <label htmlFor="editPriceHourly" className="block text-sm font-medium text-gray-700 mb-1">
                    Часова тарифа (евро) *
                  </label>
                  <input
                    id="editPriceHourly"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.priceHourly}
                    onChange={(e) => setFormData({ ...formData, priceHourly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="50.00"
                  />
                  {typeof editServiceDetails.average_price === 'number' && (
                    <div className="mt-2 text-xs text-gray-500 bg-blue-50 rounded p-2">
                      Средна цена за тази услуга: <b>{(editServiceDetails.average_price / 100).toFixed(2)} евро/час</b>
                    </div>
                  )}
                </div>
              )}

              {editServiceDetails?.pricing_model === 'sq_m' && (
                <>
                  <div>
                    <label htmlFor="editPricePerSqM" className="block text-sm font-medium text-gray-700 mb-1">
                      Цена на м² (евро) *
                    </label>
                    <input
                      id="editPricePerSqM"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.pricePerSqM}
                      onChange={(e) => setFormData({ ...formData, pricePerSqM: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="3.00"
                    />
                    {typeof editServiceDetails.average_price === 'number' && (
                      <div className="mt-2 text-xs text-gray-500 bg-blue-50 rounded p-2">
                        Средна цена за тази услуга: <b>{(editServiceDetails.average_price / 100).toFixed(2)} евро/м²</b>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="editTimePerSqM" className="block text-sm font-medium text-gray-700 mb-1">
                      Време на м² (минути) *
                    </label>
                    <input
                      id="editTimePerSqM"
                      type="number"
                      required
                      min="1"
                      value={formData.timePerSqM}
                      onChange={(e) => setFormData({ ...formData, timePerSqM: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="5"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="editMinBookingMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Минимална резервация (минути) *
                </label>
                <input
                  id="editMinBookingMinutes"
                  type="number"
                  required
                  min="1"
                  value={formData.minBookingMinutes}
                  onChange={(e) => setFormData({ ...formData, minBookingMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="60"
                />
              </div>

              <div>
                <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Бележки
                </label>
                <textarea
                  id="editNotes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Допълнителна информация за тази услуга..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Актуализирай услуга
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
