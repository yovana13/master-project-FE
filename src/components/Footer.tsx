export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">TaskTrust</h3>
            <p className="text-gray-400 text-sm">
              Вашата доверена платформа за свързване на клиенти с професионални специалисти.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Бързи връзки</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Начало
                </a>
              </li>
              <li>
                <a href="/signup" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Станете професионалист
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Контакти</h3>
            <p className="text-gray-400 text-sm">
              Имейл: support@tasktrust.com
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Телефон: +359 123 456 789
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} TaskTrust. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
}
