import { useState } from "react";
import { loginUser, registerUser } from "../api/urlApi";

export function AuthModal({ isOpen, onClose, onAuthSuccess, authReason }) {
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
        onAuthSuccess(res.data.user);
        onClose();
      } else {
        // Register needs username, email, password
        const res = await registerUser(username, email, password);
        onAuthSuccess(res.data.user);
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
        className="absolute inset-0 bg-black/85 cursor-pointer backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-dark-border bg-dark-card p-8 shadow-[0_0_30px_rgba(57,255,20,0.08)] animate-fadeIn">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-black font-display text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full bg-dark-border p-2 text-neutral-400 hover:bg-dark-hover hover:text-white transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 11-1.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {authReason === "shorten" && (
          <div className="mb-6 rounded-xl border border-neon-dark bg-neon-dark/10 p-3.5 text-xs text-neon-green font-semibold leading-relaxed animate-fadeIn">
            Please sign in or create an account to shorten and track your links.
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex border-b border-dark-border">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`flex-1 pb-3 text-center font-display font-semibold transition-all cursor-pointer ${
              isLogin ? "border-b-2 border-neon-green text-neon-green" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`flex-1 pb-3 text-center font-display font-semibold transition-all cursor-pointer ${
              !isLogin ? "border-b-2 border-neon-green text-neon-green" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-950/40 bg-red-950/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-400">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full rounded-xl bg-black border border-dark-border px-4 py-3 text-white placeholder-neutral-700 outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/10 transition-all"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {isLogin ? "Username or Email" : "Email Address"}
            </label>
            <input
              type={isLogin ? "text" : "email"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isLogin ? "johndoe or john@example.com" : "john@example.com"}
              className="w-full rounded-xl bg-black border border-dark-border px-4 py-3 text-white placeholder-neutral-700 outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/10 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-black border border-dark-border px-4 py-3 text-white placeholder-neutral-700 outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-neon-green hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] text-black py-3.5 rounded-xl font-bold font-display hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
