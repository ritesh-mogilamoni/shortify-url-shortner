import { useState } from "react";
import { loginUser, registerUser } from "../api/urlApi";

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Log in can use username or email
        const res = await loginUser(email, password);
        onAuthSuccess(res.data.token, res.data.user);
        onClose();
      } else {
        // Register needs username, email, password
        const res = await registerUser(username, email, password);
        onAuthSuccess(res.data.token, res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 cursor-pointer"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1F2937] bg-[#111827] p-8 shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full bg-[#1F2937] p-2 text-gray-400 hover:bg-[#1E293B] hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-[#1F2937]">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 pb-3 text-center font-semibold transition-all ${
              isLogin ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 pb-3 text-center font-semibold transition-all ${
              !isLogin ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full rounded-xl bg-[#1F2937] border border-[#374151] px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              {isLogin ? "Username or Email" : "Email Address"}
            </label>
            <input
              type={isLogin ? "text" : "email"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isLogin ? "johndoe or john@example.com" : "john@example.com"}
              className="w-full rounded-xl bg-[#1F2937] border border-[#374151] px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-[#1F2937] border border-[#374151] px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
