import Head from 'next/head';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/authContext';
import { Role } from '../enums/role.enum';

interface Category {
  id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface Service {
  id: string;
  category_id: string;
  name: string;
  description: string;
  pricing_model: 'hourly' | 'sq_m';
  average_price: number;
  is_active: boolean;
}

export default function AdminCategories() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'admin') return Role.admin;
    }
    return Role.unauthorised;
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [creatingService, setCreatingService] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    description: '',
    pricing_model: 'hourly' as 'hourly' | 'sq_m',
    average_price: '',
    is_active: true,
    image: null as File | null
  });

  useEffect(() => {
    if (!userId || userRole !== Role.admin) {
      router.push('/');
      return;
    }

    fetchData();
  }, [userId, userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const categoriesResponse = await fetch('http://localhost:3007/categories');
      if (!categoriesResponse.ok) {
        throw new Error('Неуспешно зареждане на категориите');
      }
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);

      // Fetch services
      const servicesResponse = await fetch('http://localhost:3007/services');
      if (!servicesResponse.ok) {
        throw new Error('Неуспешно зареждане на услугите');
      }
      const servicesData = await servicesResponse.json();
      setServices(servicesData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Неуспешно зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getServicesForCategory = (categoryId: string) => {
    return services.filter(service => service.category_id === categoryId);
  };

  const getPricingModelLabel = (model: 'hourly' | 'sq_m') => {
    return model === 'hourly' ? 'По час' : 'На кв.м';
  };

  const openCreateModal = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setNewServiceData({
      name: '',
      description: '',
      pricing_model: 'hourly',
      average_price: '',
      is_active: true,
      image: null
    });
    setCreateError(null);
    setCreateSuccess(null);
    setShowCreateModal(true);
  };

  const handleCreateService = async () => {
    try {
      setCreatingService(true);
      setCreateError(null);
      setCreateSuccess(null);

      // Validation
      if (!newServiceData.name.trim()) {
        setCreateError('Моля въведете име на услугата');
        return;
      }
      if (!newServiceData.description.trim()) {
        setCreateError('Моля въведете описание');
        return;
      }
      if (!newServiceData.average_price) {
        setCreateError('Моля въведете цена');
        return;
      }

      // Convert price from лв. to cents
      const priceInCents = Math.round(parseFloat(newServiceData.average_price) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        setCreateError('Моля въведете валидна цена');
        return;
      }

      // Create JSON body
      const requestBody = {
        category_id: selectedCategoryId,
        name: newServiceData.name,
        description: newServiceData.description,
        pricing_model: newServiceData.pricing_model,
        average_price: priceInCents,
        is_active: newServiceData.is_active
      };

      const response = await fetch('http://localhost:3007/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Неуспешно създаване на услугата');
      }

      setCreateSuccess('Услугата е създадена успешно!');
      
      // Refresh data and close modal after a short delay
      setTimeout(() => {
        setShowCreateModal(false);
        fetchData();
      }, 1500);

    } catch (err) {
      console.error('Error creating service:', err);
      setCreateError(err instanceof Error ? err.message : 'Неуспешно създаване на услугата');
    } finally {
      setCreatingService(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewServiceData({ ...newServiceData, image: e.target.files[0] });
    }
  };

  const openDeleteConfirmModal = (serviceId: string, serviceName: string) => {
    setServiceToDelete({ id: serviceId, name: serviceName });
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      setDeletingServiceId(serviceToDelete.id);
      setShowDeleteConfirmModal(false);

      const response = await fetch(`http://localhost:3007/services/${serviceToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Неуспешно деактивиране на услугата');
      }

      // Refresh data after successful deletion
      await fetchData();

    } catch (err) {
      console.error('Error deleting service:', err);
      setDeleteError(err instanceof Error ? err.message : 'Неуспешно деактивиране на услугата');
      setShowDeleteErrorModal(true);
    } finally {
      setDeletingServiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Зареждане на категории и услуги...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Категории и услуги</title>
        <meta name="description" content="Управление на категории и услуги" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Категории и услуги</h1>
              <p className="text-sm text-gray-600 mt-1">Преглед на всички категории и свързаните услуги</p>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Общо категории</p>
                  <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Общо услуги</p>
                  <p className="text-3xl font-bold text-gray-900">{services.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories List */}
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Няма категории</h3>
              <p className="text-gray-600">Все още няма добавени категории</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => {
                const categoryServices = getServicesForCategory(category.id);
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Category Header */}
                    <div className="flex items-center justify-between p-6">
                      <div 
                        className="flex items-center gap-4 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModal(category.id);
                          }}
                          className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Добави услуга
                        </button>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          {categoryServices.length} {categoryServices.length === 1 ? 'услуга' : 'услуги'}
                        </span>
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <svg
                            className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Services List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 p-6">
                        {categoryServices.length === 0 ? (
                          <p className="text-sm text-gray-600 text-center py-4">Няма услуги в тази категория</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryServices.map((service) => (
                              <div
                                key={service.id}
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                              >
                                
                                <div className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-base font-semibold text-gray-900">{service.name}</h4>
                                    <div className="flex items-center gap-2 ml-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        {getPricingModelLabel(service.pricing_model)}
                                      </span>
                                      {service.is_active && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          Активна
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                    <span className="text-xs text-gray-500">Средна цена</span>
                                    <span className="text-sm font-medium text-indigo-600">
                                      {(service.average_price / 100).toFixed(2)} лв.
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => openDeleteConfirmModal(service.id, service.name)}
                                    disabled={deletingServiceId === service.id}
                                    className="mt-3 w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                  >
                                    {deletingServiceId === service.id ? (
                                      <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Деактивиране...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Деактивирай услуга
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Добави нова услуга</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={creatingService}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              {createSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-600">{createSuccess}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Име на услугата *
                  </label>
                  <input
                    type="text"
                    value={newServiceData.name}
                    onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Напр. Почистване на къща"
                    disabled={creatingService}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание *
                  </label>
                  <textarea
                    value={newServiceData.description}
                    onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                    placeholder="Опишете услугата..."
                    disabled={creatingService}
                  />
                </div>

                {/* Pricing Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Модел на ценообразуване *
                  </label>
                  <select
                    value={newServiceData.pricing_model}
                    onChange={(e) => setNewServiceData({ ...newServiceData, pricing_model: e.target.value as 'hourly' | 'sq_m' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={creatingService}
                  >
                    <option value="hourly">По час</option>
                    <option value="sq_m">На кв.м</option>
                  </select>
                </div>

                {/* Average Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Средна цена (лв.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newServiceData.average_price}
                    onChange={(e) => setNewServiceData({ ...newServiceData, average_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="25.00"
                    disabled={creatingService}
                  />
                </div>

                {/* Is Active Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={newServiceData.is_active}
                    onChange={(e) => setNewServiceData({ ...newServiceData, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={creatingService}
                  />
                  <label htmlFor="is-active" className="text-sm text-gray-700">
                    Активна услуга
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateService}
                  disabled={creatingService}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {creatingService ? 'Създаване...' : 'Създай услуга'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingService}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Отказ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && serviceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Потвърждение за деактивиране</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Наистина ли искате да деактивирате услугата <strong>"{serviceToDelete.name}"</strong>?
            </p>
            <p className="text-xs text-gray-500 mb-6 bg-yellow-50 border border-yellow-200 rounded p-3">
              <strong>Забележка:</strong> Услугата ще бъде деактивирана само ако никой не я предлага в момента.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteService}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Деактивирай
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setServiceToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Отказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && serviceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Потвърждение за деактивиране</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Наистина ли искате да деактивирате услугата <strong>"{serviceToDelete.name}"</strong>?
            </p>
            <p className="text-xs text-gray-500 mb-6 bg-yellow-50 border border-yellow-200 rounded p-3">
              <strong>Забележка:</strong> Услугата ще бъде деактивирана само ако никой не я предлага в момента.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteService}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Деактивирай
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setServiceToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Отказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Modal */}
      {showDeleteErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Грешка при деактивиране</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">{deleteError}</p>
            <button
              onClick={() => {
                setShowDeleteErrorModal(false);
                setDeleteError(null);
              }}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Разбрах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
