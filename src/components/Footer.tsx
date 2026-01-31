export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Master Project</h3>
            <p className="text-gray-400 text-sm">
              Your trusted platform for connecting clients with professional taskers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/become-a-tasker" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Become a Tasker
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-400 text-sm">
              Email: support@masterproject.com
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Phone: +359 123 456 789
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Master Project. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
