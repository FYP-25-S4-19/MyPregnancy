import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { websiteAPI, authAPI } from "../../lib/api";
import TestimonialsWidget from "../../components/TestimonialsWidget";
import { LogIn, X, AlertCircle, Mail, Lock, Loader } from "lucide-react";
import { useState, useEffect } from "react";

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>("");

  // Use 'home' as default page if no slug is provided
  const pageSlug = slug || "home";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Login with email/password
      console.log("🔐 Attempting login with email:", email);
      const loginResponse = await authAPI.login(email, password);
      console.log("✅ Login successful, response:", loginResponse.data);

      const token = loginResponse.data.access_token;
      localStorage.setItem("auth_token", token);
      console.log("✅ Token stored");

      // Step 2: Fetch user data to verify role
      try {
        console.log("👤 Fetching user data...");
        const userResponse = await authAPI.getMe();
        console.log("✅ User data received:", userResponse.data);

        const userData = userResponse.data;
        let userRole = userData.role;

        // Handle both enum and string formats
        console.log("🔍 Raw role from API:", userRole, "Type:", typeof userRole);

        // If it's an object (enum), extract the value
        if (typeof userRole === "object" && userRole !== null) {
          userRole = userRole.value || String(userRole);
        }

        // Convert to string and normalize
        userRole = String(userRole).trim().toUpperCase();

        console.log("🔍 Processed role:", userRole);

        // STRICT check: Only allow ADMIN role
        const isAdmin = userRole === "ADMIN";
        console.log("🔐 Is ADMIN?", isAdmin);
        console.log('🔐 Role comparison: "' + userRole + '" === "ADMIN"?', isAdmin);

        if (!isAdmin) {
          console.log("❌ Access denied - user role is:", userRole);
          setError(`Access Denied: Your role is "${userRole}". Only users with ADMIN role can access this dashboard.`);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_role");
          localStorage.removeItem("user_id");
          localStorage.removeItem("user_email");
          setLoading(false);
          return;
        }

        console.log("✅ ADMIN role verified - storing user data");
        // User is admin - store data and redirect
        localStorage.setItem("user_role", userRole);
        localStorage.setItem("user_id", userData.id);
        localStorage.setItem("user_email", userData.email);

        console.log("🚀 Redirecting to manage account...");
        setShowLoginModal(false);
        setEmail("");
        setPassword("");
        setError("");
        // Redirect to manage account page
        window.location.assign("/admin/manage-account");
      } catch (userErr: any) {
        console.error("❌ Failed to fetch user data:", userErr);
        const errorMsg = userErr.response?.data?.detail || userErr.message || "Failed to fetch user information";
        setError(errorMsg);
        localStorage.removeItem("auth_token");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      console.error("Error response:", err.response?.data);

      // Handle different error types
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Invalid email or password");
      } else if (err.response?.status === 422) {
        setError("Invalid email format");
      } else if (err.message === "Network Error") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.response?.data?.detail || err.message || "Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const {
    data: pageData,
    isLoading,
    error: pageError,
  } = useQuery({
    queryKey: ["page", pageSlug],
    queryFn: () => websiteAPI.getPage(pageSlug).then((res) => res.data),
    enabled: !!pageSlug,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to refetch when navigating back
  });

  // Fetch background image presigned URL
  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (pageSlug) {
        try {
          const response = await websiteAPI.getBackgroundImageUrl(pageSlug);
          const imgUrl = response.data.s3_key;
          if (imgUrl) {
            setBackgroundImageUrl(imgUrl as string);
          } else {
            setBackgroundImageUrl("");
          }
        } catch (error) {
          console.error("Failed to load background image:", error);
          setBackgroundImageUrl("");
        }
      }
    };

    loadBackgroundImage();
  }, [pageSlug, pageData]); // Also reload when pageData changes

  // If root (/) has no website-builder data, fall back to static /home
  useEffect(() => {
    if (!slug && pageError) {
      navigate("/home", { replace: true });
    }
  }, [slug, pageError, navigate]);

  // useEffect(() => {
  //   console.log("Init!");
  // }, []);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!slug && pageError) return null;
  if (pageError) return <div className="p-8 text-center text-red-600">Page not found</div>;

  const page = pageData?.page;
  const sections = page?.sections || [];

  return (
    <div
      style={{
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        // minHeight: "100vh",
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

      {/* Login Modal - Admin Dashboard */}
      {showLoginModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowLoginModal(false);
                setEmail("");
                setPassword("");
                setError("");
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MyPregnancy</h1>
              <p className="text-gray-600 font-medium">Admin Dashboard</p>
              <p className="text-sm text-gray-500 mt-1">Admins only</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 text-sm font-medium">Login Failed</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
                    placeholder="admin@example.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white py-3 rounded-lg font-semibold transition disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={20} className="animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            {/* Footer Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">Admin access only. Only ADMIN users can log in here.</p>
            </div>
          </div>
        </div>
      )}

      {sections.map((section: any) => (
        <SectionDisplay key={section.id} section={section} onLoginClick={() => setShowLoginModal(true)} />
      ))}
    </div>
  );
}

function SectionDisplay({ section, onLoginClick }: any) {
  switch (section.type) {
    case "navbar":
      return (
        <nav
          style={{ backgroundColor: section.content.bgColor, color: section.content.textColor }}
          className="px-8 py-4 flex items-center justify-between"
        >
          <div className="font-bold text-lg">{section.content.logo}</div>
          <div className="flex gap-6">
            {section.content.links.map((link: any, idx: number) => {
              if (link.url?.startsWith("/")) {
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
            onClick={() => onLoginClick()}
            style={{ backgroundColor: section.content.buttonColor }}
            className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            {section.content.buttonText}
          </button>
        </nav>
      );
    case "hero":
      return (
        <div
          style={{ backgroundColor: section.content.bgColor }}
          className="p-12 text-center min-h-screen flex flex-col items-center justify-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{section.content.heading}</h1>
          <p className="text-xl text-gray-600 mb-8">{section.content.subheading}</p>
          <button className="px-8 py-3 bg-gray-900 text-white rounded-lg">{section.content.buttonText}</button>
        </div>
      );
    case "features":
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
    case "about":
      return (
        <div className="bg-white p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{section.content.title}</h2>
          <p className="text-gray-700 leading-relaxed">{section.content.description}</p>
          {section.content.image && (
            <img src={section.content.image} alt="About" className="mt-6 w-full rounded-lg max-h-96 object-cover" />
          )}
        </div>
      );
    case "cta":
      return (
        <div style={{ backgroundColor: section.content.bgColor }} className="p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">{section.content.heading}</h2>
          <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium">
            {section.content.buttonText}
          </button>
        </div>
      );
    case "faq":
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
    case "testimonials":
      return (
        <div className="bg-gray-50 p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.content.title}</h2>
          {section.content.useBackend ? (
            <div className="max-w-5xl mx-auto">
              <TestimonialsWidget
                minRating={section.content.minRating}
                maxRating={section.content.maxRating}
                sortBy={section.content.sortBy}
                limit={section.content.limit}
                showStats={section.content.showStats}
                autoRotate={section.content.autoRotate}
                rotateInterval={section.content.rotateInterval}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {section.content.items.map((item: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex gap-1 mb-2">
                    {[...Array(item.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                  <p className="font-semibold text-gray-900">— {item.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
}
