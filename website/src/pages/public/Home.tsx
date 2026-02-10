import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../lib/api";
import {
  Bell,
  Home,
  User,
  Plus,
  Search,
  Users,
  BookOpen,
  HeartPulse,
  MessageSquare,
  Sparkles,
  ClipboardList,
  LogIn,
  X,
  AlertCircle,
  Mail,
  Lock,
  Loader,
} from "lucide-react";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginResponse = await authAPI.login(email, password);
      const token = loginResponse.data.access_token;
      localStorage.setItem("auth_token", token);

      const userResponse = await authAPI.getMe();
      const userData = userResponse.data;
      let userRole = userData.role;
      if (typeof userRole === "object" && userRole !== null) {
        userRole = userRole.value || String(userRole);
      }
      userRole = String(userRole).trim().toUpperCase();
      const isAdmin = userRole === "ADMIN";
      if (!isAdmin) {
        setError(`Access Denied: Your role is "${userRole}". Only users with ADMIN role can access this dashboard.`);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_email");
        setLoading(false);
        return;
      }

      localStorage.setItem("user_role", userRole);
      localStorage.setItem("user_id", userData.id);
      localStorage.setItem("user_email", userData.email);

      setShowLoginModal(false);
      setEmail("");
      setPassword("");
      setError("");
      navigate("/admin/manage-account", { replace: true });
    } catch (err: any) {
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

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-x-hidden"
      style={{
        backgroundImage: "url('/wallpaper.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundColor: "#fff0f0",
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Merriweather:ital,wght@0,700;0,900;1,400&display=swap');
          html {
            scroll-behavior: smooth;
          }
          .font-serif-brand { font-family: 'Merriweather', serif; }
          .font-sans-brand { font-family: 'DM Sans', sans-serif; }
        `}
      </style>

      {/* --- Navigation Bar --- */}
      <header className="bg-white/95 backdrop-blur-sm w-full py-4 shadow-sm z-50 sticky top-0">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-baseline gap-1 select-none cursor-pointer">
            <span className="font-serif-brand italic text-xl text-[#592E2E]">my</span>
            <span className="font-serif-brand font-black text-3xl text-[#592E2E] tracking-tight">Pregnancy</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 lg:gap-12 absolute left-1/2 -translate-x-1/2">
            {[
              { name: "About Us", href: "#about-us" },
              { name: "Features", href: "#features" },
              { name: "How It Works", href: "#how-it-works" },
              { name: "FAQ", href: "#faq" },
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-sans-brand font-bold text-[#592E2E] text-sm lg:text-base hover:text-[#8a4a4a] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowLoginModal(true)}
              className="font-sans-brand font-bold text-[#592E2E] hover:opacity-70 text-sm lg:text-base"
            >
              Log In
            </button>
            <button className="bg-[#f0a3a3] hover:bg-[#e08e8e] text-white font-sans-brand font-bold px-6 py-2.5 rounded-lg shadow-md transition-all">
              Download App
            </button>
          </div>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <main className="w-full flex flex-col items-center justify-center text-center px-4 py-20 lg:min-h-[90vh]">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif-brand font-bold text-5xl md:text-7xl text-[#592E2E] leading-tight mb-8 drop-shadow-sm">
            A Calm Companion for <br />
            Your Pregnancy Journey
          </h1>

          <p className="font-sans-brand font-medium text-[#592E2E] text-lg md:text-xl mx-auto mb-12 opacity-90 text-center leading-relaxed">
            Track health, personalized meal plan, join a supportive <br className="hidden md:block" />
            community, and get trusted consultation from <br className="hidden md:block" />
            verified specialists – all in one app.
          </p>

          <button className="bg-[#FADADD] hover:bg-[#f5c2c8] text-[#592E2E] font-sans-brand font-bold text-lg px-12 py-3 rounded-lg shadow-sm transition-transform transform hover:-translate-y-1">
            Try Now!
          </button>
        </div>
      </main>

      {/* --- About Us Section --- */}
      <section id="about-us" className="w-full px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif-brand font-bold text-4xl md:text-5xl text-[#592E2E] text-center mb-16">About Us</h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-8">
            <div className="w-full md:w-1/2 flex items-center justify-end pr-4 md:pr-8">
              <div className="space-y-8 text-[#592E2E] max-w-md">
                <div className="space-y-6 font-sans-brand text-lg leading-relaxed opacity-90">
                  <p>
                    MyPregnancy is a modern digital health platform designed to support expecting mothers with
                    personalized insights, evidence-based guidance, and a caring community.
                  </p>
                  <p>
                    We bring together technology and empathy to make pregnancy tracking simpler, safer, and more
                    meaningful.
                  </p>
                  <p>
                    Our app combines AI-powered features, expert-verified content, and secure data protection to help
                    you stay informed, calm, and connected throughout your journey.
                  </p>
                </div>

                <div className="space-y-6 mt-8">
                  <div>
                    {/* Login Modal */}
                    {showLoginModal && (
                      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
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

                          <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">MyPregnancy</h1>
                            <p className="text-gray-600 font-medium">Admin Dashboard</p>
                            <p className="text-sm text-gray-500 mt-1">Admins only</p>
                          </div>

                          {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-red-700 text-sm font-medium">Login Failed</p>
                                <p className="text-red-600 text-sm mt-1">{error}</p>
                              </div>
                            </div>
                          )}

                          <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                              <div className="relative">
                                <Mail
                                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                  size={20}
                                />
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

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                              <div className="relative">
                                <Lock
                                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                  size={20}
                                />
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

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white py-3 rounded-lg font-semibold transition disabled:cursor-not-allowed mt-2"
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

                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-center text-xs text-gray-500">
                              Admin access only. Only ADMIN users can log in here.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <h3 className="font-serif-brand font-bold text-2xl mb-2">Our Vision</h3>
                    <p className="font-sans-brand text-lg opacity-90">
                      To create a trusted space where mothers feel confident and supported — every step of the way.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-serif-brand font-bold text-2xl mb-2">Our Promise</h3>
                    <p className="font-sans-brand text-lg opacity-90">
                      Your journey, your well-being, your privacy — always protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Phone Mockup */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-start pl-13 md:pl-48">
              <div className="relative border-[12px] border-[#1a1a1a] rounded-[3rem] h-[680px] w-[340px] bg-white shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-[#1a1a1a] rounded-b-xl z-20"></div>
                <div className="h-10 w-full bg-white shrink-0"></div>
                <div className="px-6 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff9ea9] flex items-center justify-center text-white font-bold text-xs">
                      OW
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Hi, Welcome back,
                      </span>
                      <span className="text-sm font-bold text-gray-800">Olivia Wilson</span>
                    </div>
                  </div>
                  <Bell className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar">
                  <div className="mt-2 mb-4">
                    <h3 className="text-[#8B4545] font-bold text-lg">Week 27 - 14 October 2025</h3>
                  </div>
                  <div className="bg-[#fcdcdc] rounded-full px-4 py-2 flex items-center gap-2 mb-6">
                    <span className="text-xs text-[#a06060]">Ask AI</span>
                    <div className="flex-grow"></div>
                    <Search className="w-3 h-3 text-[#a06060]" />
                  </div>
                  <br></br>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-[#ffe4e6] rounded-xl flex flex-col items-center justify-center text-center p-4">
                      <span className="text-[#8B4545] font-bold text-sm">
                        Discussion <br /> Forum
                      </span>
                    </div>
                    <div className="aspect-square bg-[#ffe4e6] rounded-xl flex flex-col items-center justify-center text-center p-4">
                      <span className="text-[#8B4545] font-bold text-sm">Library</span>
                    </div>
                    <div className="aspect-square bg-[#ffe4e6] rounded-xl flex flex-col items-center justify-center text-center p-4">
                      <span className="text-[#8B4545] font-bold text-sm">Journal</span>
                    </div>
                    <div className="aspect-square bg-[#ffe4e6] rounded-xl flex flex-col items-center justify-center text-center p-4">
                      <span className="text-[#8B4545] font-bold text-sm">Consultation</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 w-full bg-white h-20 border-t border-gray-100 flex items-center justify-around px-6 pb-2">
                  <div className="flex flex-col items-center gap-1 text-[#ff9ea9]">
                    <Home className="w-6 h-6 fill-current" />
                    <span className="text-[10px] font-bold">Home</span>
                  </div>
                  <div className="-mt-8 bg-[#ff9ea9] rounded-full p-4 shadow-lg ring-4 ring-white">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <User className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Profile</span>
                  </div>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="w-full px-6 py-20 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          {/* Header */}
          <div className="mb-16">
            <h3 className="font-sans-brand font-bold text-[#8B4545] uppercase tracking-widest text-sm mb-4">
              Features
            </h3>
            <br></br>
            <h3 className="font-serif-brand font-bold text-3xl md:text-4xl text-[#592E2E]">
              Everything You Need for Your Pregnancy Journey
            </h3>
            <br></br>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {/* Feature Card 1 */}
            <div className="bg-[#fcf2f2]/80 border border-[#eecaca] rounded-3xl p-10 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300 min-h-[250px]">
              <Users className="w-16 h-16 text-[#592E2E] mb-6 stroke-1.5" />
              <h3 className="font-sans-brand font-bold text-xl text-[#592E2E]">
                Consultation with <br /> Certified Specialists
              </h3>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-[#fcf2f2]/80 border border-[#eecaca] rounded-3xl p-10 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300 min-h-[250px]">
              <BookOpen className="w-16 h-16 text-[#592E2E] mb-6 stroke-1.5" />
              <h3 className="font-sans-brand font-bold text-xl text-[#592E2E]">Learning Module</h3>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-[#fcf2f2]/80 border border-[#eecaca] rounded-3xl p-10 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300 min-h-[250px]">
              <HeartPulse className="w-16 h-16 text-[#592E2E] mb-6 stroke-1.5" />
              <h3 className="font-sans-brand font-bold text-xl text-[#592E2E]">Health Tracking</h3>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-[#fcf2f2]/80 border border-[#eecaca] rounded-3xl p-10 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300 min-h-[250px]">
              <div className="relative">
                <MessageSquare className="w-16 h-16 text-[#592E2E] mb-6 stroke-1.5" />
              </div>
              <h3 className="font-sans-brand font-bold text-xl text-[#592E2E]">
                Community Forum <br /> & Daily Journal
              </h3>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-[#fcf2f2]/80 border border-[#eecaca] rounded-3xl p-10 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300 min-h-[250px]">
              <Sparkles className="w-16 h-16 text-[#592E2E] mb-6 stroke-1.5" />
              <h3 className="font-sans-brand font-bold text-xl text-[#592E2E]">
                Personalized <br /> Meal Plan & Ask AI
              </h3>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-[#fcf2f2]/80 border border-[#eecaca] rounded-3xl p-10 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300 min-h-[250px]">
              <ClipboardList className="w-16 h-16 text-[#592E2E] mb-6 stroke-1.5" />
              <h3 className="font-sans-brand font-bold text-xl text-[#592E2E]">Alerts & Reminders</h3>
            </div>
          </div>
        </div>
      </section>
      {/* --- How It Works Section --- */}
      <section id="how-it-works" className="w-full px-6 py-20 relative overflow-hidden">
        {/* Decorative Background Blobs */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#fae6e6] rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10"></div>
        <div className="absolute top-1/3 right-0 w-[30rem] h-[30rem] bg-[#fcecec] rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <h3 className="font-sans-brand font-bold text-[#8B4545] uppercase tracking-widest text-sm mb-4">
              How It Works
            </h3>
            <br></br>
            <h2 className="font-serif-brand font-bold text-3xl md:text-5xl text-[#592E2E]">
              Simple Steps to a Healthy Pregnancy
            </h2>
          </div>
          <br></br>
          {/* Steps Container */}
          <div className="flex flex-col gap-12 md:gap-20 items-center">
            {/* Step 1 - Left Aligned */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 md:w-3/4 mr-auto">
              <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#eeb4b4]/90 shadow-lg shadow-[#eeb4b4]/40 flex items-center justify-center z-10">
                <span className="font-serif-brand font-bold text-white text-3xl md:text-4xl">1</span>
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
                <div className="hidden md:block w-full border-t-2 border-[#eeb4b4]/30 mb-3 -ml-8"></div>
                <h4 className="font-serif-brand font-bold text-2xl text-[#592E2E] mb-2">Create Your Profile</h4>
                <p className="font-sans-brand text-[#592E2E] text-lg opacity-80">
                  Enter your due date and health details.
                </p>
              </div>
            </div>

            {/* Step 2 - Right Aligned */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-8 md:w-3/4 ml-auto md:mr-0">
              <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#eeb4b4]/90 shadow-lg shadow-[#eeb4b4]/40 flex items-center justify-center z-10">
                <span className="font-serif-brand font-bold text-white text-3xl md:text-4xl">2</span>
              </div>
              <div className="flex flex-col items-center md:items-end text-center md:text-right w-full">
                <div className="hidden md:block w-full border-t-2 border-[#eeb4b4]/30 mb-3 -mr-8"></div>
                <h4 className="font-serif-brand font-bold text-2xl text-[#592E2E] mb-2">Set Your Goals</h4>
                <p className="font-sans-brand text-[#592E2E] text-lg opacity-80">
                  Focus on nutrition, activity, or mindfulness.
                </p>
              </div>
            </div>

            {/* Step 3 - Left Aligned */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 md:w-3/4 mr-auto">
              <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#eeb4b4]/90 shadow-lg shadow-[#eeb4b4]/40 flex items-center justify-center z-10">
                <span className="font-serif-brand font-bold text-white text-3xl md:text-4xl">3</span>
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
                <div className="hidden md:block w-full border-t-2 border-[#eeb4b4]/30 mb-3 -ml-8"></div>
                <h4 className="font-serif-brand font-bold text-2xl text-[#592E2E] mb-2">Track & Learn</h4>
                <p className="font-sans-brand text-[#592E2E] text-lg opacity-80">
                  Log symptoms and read weekly expert insights.
                </p>
              </div>
            </div>

            {/* Step 4 - Right Aligned */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-8 md:w-3/4 ml-auto md:mr-0">
              <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#eeb4b4]/90 shadow-lg shadow-[#eeb4b4]/40 flex items-center justify-center z-10">
                <span className="font-serif-brand font-bold text-white text-3xl md:text-4xl">4</span>
              </div>
              <div className="flex flex-col items-center md:items-end text-center md:text-right w-full">
                <div className="hidden md:block w-full border-t-2 border-[#eeb4b4]/30 mb-3 -mr-8"></div>
                <h4 className="font-serif-brand font-bold text-2xl text-[#592E2E] mb-2">Connect & Get Support</h4>
                <p className="font-sans-brand text-[#592E2E] text-lg opacity-80">
                  Ask questions and share experiences safely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* --- FAQ Section --- */}
      <section
        id="faq"
        className="w-full px-6 py-20 relative overflow-hidden flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm"
      >
        {/* Background Blobs (Rotated positions for variety) */}
        <div className="absolute top-0 right-0 -translate-y-1/2 w-[40rem] h-[40rem] bg-[#ffe4e4] rounded-full mix-blend-multiply filter blur-3xl opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 w-96 h-96 bg-[#ffd1d1] rounded-full mix-blend-multiply filter blur-3xl opacity-60 -z-10"></div>

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h3 className="font-sans-brand font-bold text-[#8B4545] uppercase tracking-widest text-sm mb-4">FAQ</h3>
            <br></br>
            <h2 className="font-serif-brand font-bold text-3xl md:text-5xl text-[#592E2E]">
              Frequently Asked Questions
            </h2>
            <br></br>
          </div>

          {/* FAQ Items */}
          <div className="flex flex-col gap-4">
            {/* Question 1 */}
            <details className="group bg-white/50 border border-[#eecaca] rounded-2xl open:bg-white/80 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h4 className="font-sans-brand font-bold text-lg md:text-xl text-[#592E2E]">Is MyPregnancy free?</h4>
                <Plus className="w-6 h-6 text-[#8B4545] transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <div className="px-6 pb-6 pt-0 text-[#592E2E]/80 font-sans-brand leading-relaxed">
                Yes! The core features like week-by-week tracking, symptom logging, and the basic community access are
                completely free. We also offer a Premium plan for unlimited AI consultations and advanced meal planning.
              </div>
            </details>

            {/* Question 2 */}
            <details className="group bg-white/50 border border-[#eecaca] rounded-2xl open:bg-white/80 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h4 className="font-sans-brand font-bold text-lg md:text-xl text-[#592E2E]">
                  Is my personal data safe?
                </h4>
                <Plus className="w-6 h-6 text-[#8B4545] transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <div className="px-6 pb-6 pt-0 text-[#592E2E]/80 font-sans-brand leading-relaxed">
                Absolutely. We use end-to-end encryption to protect your health data. We are HIPAA compliant and never
                sell your personal information to third-party advertisers. Your privacy is our priority.
              </div>
            </details>

            {/* Question 3 */}
            <details className="group bg-white/50 border border-[#eecaca] rounded-2xl open:bg-white/80 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h4 className="font-sans-brand font-bold text-lg md:text-xl text-[#592E2E]">
                  Is this a replacement for medical advice?
                </h4>
                <Plus className="w-6 h-6 text-[#8B4545] transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <div className="px-6 pb-6 pt-0 text-[#592E2E]/80 font-sans-brand leading-relaxed">
                No. MyPregnancy is designed to be a companion tool for education and tracking. While our content is
                reviewed by specialists, you should always consult your OB-GYN or healthcare provider for medical
                decisions.
              </div>
            </details>

            {/* Question 4 */}
            <details className="group bg-white/50 border border-[#eecaca] rounded-2xl open:bg-white/80 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h4 className="font-sans-brand font-bold text-lg md:text-xl text-[#592E2E]">
                  What platforms are supported?
                </h4>
                <Plus className="w-6 h-6 text-[#8B4545] transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <div className="px-6 pb-6 pt-0 text-[#592E2E]/80 font-sans-brand leading-relaxed">
                The MyPregnancy app is currently available on both iOS (App Store) and Android (Google Play Store). You
                can also access your profile via our web dashboard.
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
