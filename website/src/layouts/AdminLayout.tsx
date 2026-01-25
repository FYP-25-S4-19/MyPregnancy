import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Globe,
  LogOut,
  Menu,
  MessageSquare,
  Stethoscope,
  Tags,
  UtensilsCrossed,
  Users,
  UserCheck,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Website Builder', href: '/admin/website-builder', icon: Globe },
  { name: 'Users', href: '/admin/manage-account', icon: Users },
  { name: 'Pending Users', href: '/admin/view-pending-users', icon: UserCheck },
  { name: 'Recipe Categories', href: '/admin/recipe-categories', icon: UtensilsCrossed },
  { name: 'Article Categories', href: '/admin/article-categories', icon: BookOpen },
  { name: 'Doctor Specialization', href: '/admin/doctor-specialization', icon: Stethoscope },
  { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-800"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">MyPregnancy Admin</h1>
        </div>

        {/* Circle navbar (desktop) */}
        <nav className="hidden lg:flex items-center gap-3 ml-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => `
                group flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border 
                ${isActive ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'}
              `}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                item.name === 'Website Builder' && 'bg-pink-100'
              } ${item.name !== 'Website Builder' && 'bg-gray-100'} group-hover:bg-blue-100`}>
                <item.icon size={18} />
              </span>
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100"
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
              <LogOut size={18} />
            </span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>

        {/* Mobile slide-over (optional) */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-600 to-blue-700 shadow-xl">
              <div className="flex items-center justify-between h-16 px-4 border-b border-blue-500">
                <h2 className="font-semibold text-white">Menu</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-blue-100">
                  <X size={20} />
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive ? 'bg-gray-300 text-gray-900' : 'bg-blue-500 text-white hover:bg-blue-400'}
                    `}
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-3 w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}