import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { websiteAPI, authAPI } from '../../lib/api';
import { LogIn, X } from 'lucide-react';
import { useState } from 'react';

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      authAPI.login(credentials.username, credentials.password),
    onSuccess: (response) => {
      // Store the token
      localStorage.setItem('auth_token', response.data.access_token);
      setShowLoginModal(false);
      setUsername('');
      setPassword('');
      setError('');
      // Redirect or show success
      alert('Login successful!');
    },
    onError: () => {
      setError('Invalid username or password');
    },
  });

  const { data: pageData, isLoading, error: pageError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => websiteAPI.getPage(slug!).then(res => res.data),
    enabled: !!slug,
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (pageError) return <div className="p-8 text-center text-red-600">Page not found</div>;

  const page = pageData?.page;
  const sections = page?.sections || [];
  const backgroundImage = page?.background_image;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ username, password });
  };

  return (
    <div
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Fixed Login Button - Top Right */}
      {!showLoginModal && (
        <button
          onClick={() => setShowLoginModal(true)}
          className="absolute top-6 right-6 z-50 flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-lg"
        >
          <LogIn size={18} />
          Login
        </button>
      )}
      <br></br>
      <br></br>
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-transparent">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Log In</h2>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <br></br>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {loginMutation.isPending ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      )}

      {sections.map((section: any) => (
        <SectionDisplay key={section.id} section={section} />
      ))}
    </div>
  );
}

function SectionDisplay({ section }: any) {
  const navigate = useNavigate();

  switch (section.type) {
    case 'navbar':
      return (
        <nav style={{ backgroundColor: section.content.bgColor, color: section.content.textColor }} className="px-8 py-4 flex items-center justify-between">
          <div className="font-bold text-lg">{section.content.logo}</div>
          <div className="flex gap-6">
            {section.content.links.map((link: any, idx: number) => {
              if (link.url?.startsWith('/')) {
                return (
                  <Link key={idx} to={link.url} className="text-sm hover:opacity-75 transition">
                    {link.label}
                  </Link>
                );
              }
              return (
                <a key={idx} href={link.url} className="text-sm hover:opacity-75 transition">
                  {link.label}
                </a>
              );
            })}
          </div>
          <button 
            onClick={() => navigate(section.content.buttonUrl || '/login')}
            style={{ backgroundColor: section.content.buttonColor }} 
            className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            {section.content.buttonText}
          </button>
        </nav>
      );
    case 'hero':
      return (
        <div style={{ backgroundColor: section.content.bgColor }} className="p-12 text-center min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{section.content.heading}</h1>
          <p className="text-xl text-gray-600 mb-8">{section.content.subheading}</p>
          <button className="px-8 py-3 bg-gray-900 text-white rounded-lg">
            {section.content.buttonText}
          </button>
        </div>
      );
    case 'features':
      return (
        <div className="bg-white p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{section.content.title}</h2>
          <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
            {section.content.items.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center text-center">
                {item.icon ? (
                  <img src={item.icon} alt={item.label} className="w-32 h-32 object-cover rounded-lg mb-4" />
                ) : (
                  <div className="text-6xl mb-4">📷</div>
                )}
                <p className="font-medium text-gray-900">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'about':
      return (
        <div className="bg-white p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{section.content.title}</h2>
          <p className="text-gray-700 leading-relaxed">{section.content.description}</p>
          {section.content.image && (
            <img src={section.content.image} alt="About" className="mt-6 w-full rounded-lg max-h-96 object-cover" />
          )}
        </div>
      );
    case 'cta':
      return (
        <div
          style={{ backgroundColor: section.content.bgColor }}
          className="p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-6">{section.content.heading}</h2>
          <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium">
            {section.content.buttonText}
          </button>
        </div>
      );
    case 'faq':
      return (
        <div className="bg-white p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.content.title}</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {section.content.items.map((item: any, idx: number) => (
              <div key={idx} className="border border-gray-300 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">{item.question}</p>
                <p className="text-gray-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="bg-gray-50 p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.content.title}</h2>
          <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {section.content.items.map((item: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex gap-1 mb-2">
                  {[...Array(item.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                <p className="font-semibold text-gray-900">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}