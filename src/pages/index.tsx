import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/authContext'
import { useRouter } from 'next/router'

interface Category {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
}

interface Service {
  id: number;
  category_id: number;
  name: string;
  description: string;
  base_price: number;
}

export default function Home() {
  const { userId, userRole } = useContext(AuthContext);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3007/categories');
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setActiveCategory(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3007/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const filteredServices = services.filter(
    service => service.category_id === activeCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Master Project - Home Services</title>
        <meta name="description" content="Master project frontend" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">TaskRabbit Clone</h1>
              {userId ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-medium">{userId}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <a
                    href="/login"
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Login
                  </a>
                  <a
                    href="/signup"
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Sign Up
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

      <main className="min-h-screen bg-gray-50">
        {/* Categories */}
        <div className="bg-white border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-8 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex flex-col items-center gap-2 min-w-fit px-4 py-2 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                    activeCategory === category.id ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {/* Icon placeholder - you can add actual icons here */}
                    <span className="text-2xl">
                      {category.name === 'Moving' && '📦'}
                      {category.name === 'Cleaning' && '🧹'}
                      {category.name === 'Assembly' && '🔧'}
                      {category.name === 'Mounting' && '🔨'}
                      {category.name === 'Outdoor Help' && '🌳'}
                      {category.name === 'Home Repairs' && '🔨'}
                      {category.name === 'Painting' && '🎨'}
                      {!['Moving', 'Cleaning', 'Assembly', 'Mounting', 'Outdoor Help', 'Home Repairs', 'Painting'].includes(category.name) && '⚡'}
                    </span>
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap ${
                    activeCategory === category.id ? 'font-semibold' : ''
                  }`}>
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => router.push(`/services/${service.id}`)}
                className="bg-white border border-gray-200 rounded-lg px-6 py-4 text-left hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
                )}
                {service.base_price && (
                  <p className="text-sm text-gray-600 mt-2">
                    From <span className="font-semibold">${service.base_price}</span>
                  </p>
                )}
              </button>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No services available in this category yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
