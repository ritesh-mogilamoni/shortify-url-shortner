import { useState, useEffect } from "react";
import { createShortUrl, getStats, getUserProfile, getUserUrls, logoutUser, baseURL, shortLinkHost } from "../api/urlApi";
import { Sidebar } from "./Sidebar";
import { AuthModal } from "./AuthModal";
import { ErrorModal } from "./ErrorModal";

export function Shortener() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [stats, setStats] = useState(null);
  const [code, setCode] = useState("");
  const [inspectedCode, setInspectedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Tab State: "shorten" | "analytics" | "redirect"
  const [activeTab, setActiveTab] = useState("shorten");

  // Auth States
  const [user, setUser] = useState(null);
  const [urls, setUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryPreset, setExpiryPreset] = useState("1h");
  const [expiresAt, setExpiresAt] = useState("");

  // Error Modal State for redirects (expired/not found)
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorType, setErrorType] = useState("");

  const openAuthModal = (reason = "") => {
    setAuthReason(reason);
    setIsAuthModalOpen(true);
  };

  const handleCloseErrorModal = () => {
    setErrorModalOpen(false);
    setErrorType("");
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  useEffect(() => {
    // Check URL parameters for redirection errors
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam === "expired" || errorParam === "not_found") {
      setErrorType(errorParam);
      setErrorModalOpen(true);
    }

    setLoadingUrls(true);
    getUserProfile()
      .then((res) => {
        setUser(res.data.user);
        return getUserUrls();
      })
      .then((res) => {
        if (res) {
          setUrls(res.data.payload || []);
        }
      })
      .catch((err) => {
        if (err.response?.status !== 401) {
          console.error("Auth init error:", err);
        }
        setUser(null);
      })
      .finally(() => {
        setLoadingUrls(false);
      });
  }, []);

  const handleLogout = () => {
    logoutUser()
      .catch((err) => console.error("Logout error:", err))
      .finally(() => {
        setUser(null);
        setUrls([]);
        setShortUrl("");
        setStats(null);
        setInspectedCode("");
      });
  };

  const handleAuthSuccess = (user) => {
    setUser(user);
    setLoadingUrls(true);
    getUserUrls()
      .then((res) => {
        setUrls(res.data.payload || []);
      })
      .catch((err) => {
        console.error("Error fetching URLs:", err);
      })
      .finally(() => {
        setLoadingUrls(false);
      });
  };

  // CREATE SHORT URL
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      openAuthModal("shorten");
      return;
    }

    try {
      setLoading(true);
      
      let expiryDate = undefined;
      if (expiryEnabled) {
        const now = new Date();
        if (expiryPreset === "1h") {
          expiryDate = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        } else if (expiryPreset === "6h") {
          expiryDate = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
        } else if (expiryPreset === "12h") {
          expiryDate = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
        } else if (expiryPreset === "24h") {
          expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        } else if (expiryPreset === "custom" && expiresAt) {
          expiryDate = new Date(expiresAt).toISOString();
        }
      }

      const res = await createShortUrl(url, expiryDate);

      const shortCode = res.data.urlDetails?.shortCode || res.data.shortUrl.split("/").pop();
      setShortUrl(`${shortLinkHost}/${shortCode}`);
      setUrl("");
      setExpiryEnabled(false);
      setExpiryPreset("1h");
      setExpiresAt("");
      
      // Refresh list
      const historyRes = await getUserUrls();
      setUrls(historyRes.data.payload || []);
    } catch (err) {
      alert(err.response?.data?.message || "Error creating short URL");
    } finally {
      setLoading(false);
    }
  };

  // GET STATS
  const handleStats = async (e) => {
    if (e) e.preventDefault();
    if (!code) return;

    let cleanCode = code.trim();
    if (cleanCode.includes("/")) {
      const parts = cleanCode.split("/").filter(Boolean);
      if (parts.length > 0) {
        cleanCode = parts[parts.length - 1];
      }
    }
    setCode(cleanCode);

    try {
      setLoadingStats(true);
      const res = await getStats(cleanCode);
      setStats(res.data);
      setInspectedCode(cleanCode);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching stats");
    } finally {
      setLoadingStats(false);
    }
  };

  // Select a link from the sidebar to inspect stats
  const handleSelectLink = async (shortCode) => {
    setCode(shortCode);
    setActiveTab("analytics");
    setLoadingStats(true);
    try {
      const res = await getStats(shortCode);
      setStats(res.data);
      setInspectedCode(shortCode);
      // Close mobile drawer if it's open (screen < 1024)
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error("Error fetching stats for sidebar link:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // REDIRECT
  const handleRedirect = (e) => {
    if (e) e.preventDefault();
    if (!code) return;

    let cleanCode = code.trim();
    if (cleanCode.includes("/")) {
      const parts = cleanCode.split("/").filter(Boolean);
      if (parts.length > 0) {
        cleanCode = parts[parts.length - 1];
      }
    }
    setCode(cleanCode);

    window.open(`${baseURL}/${cleanCode}`, "_blank");
  };

  return (
    <div className="flex min-h-screen w-full bg-black text-white font-sans">
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        urls={urls}
        onLogout={handleLogout}
        onLoginClick={() => openAuthModal("")}
        loadingUrls={loadingUrls}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onSelectLink={handleSelectLink}
      />

      <div className={`flex flex-1 flex-col relative overflow-x-hidden transition-all duration-300 ${isSidebarOpen ? "lg:pl-80" : "lg:pl-0"}`}>
        {/* Top Navbar Header */}
        <header className="flex h-16 items-center justify-between border-b border-dark-border bg-dark-card px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg bg-dark-border p-2 text-neutral-400 hover:bg-dark-hover hover:text-white transition-all cursor-pointer"
              title="Toggle Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTab("shorten")}
              className="flex items-center gap-2 hover:opacity-85 active:scale-[0.98] transition-all focus:outline-none cursor-pointer"
              title="Go to Homepage"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-green text-black font-black shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-xl font-black font-display text-neon-green">
                Shortify
              </span>
            </button>
          </div>

          <div>
            {!user ? (
              <button
                onClick={() => openAuthModal("")}
                className="bg-neon-green hover:opacity-90 hover:shadow-[0_0_12px_rgba(57,255,20,0.25)] text-black text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <div className="text-sm font-semibold text-neutral-300">
                Hi, {user.username}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:px-8 max-w-5xl w-full mx-auto">
          {/* Header Panel */}
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-dark-card border border-dark-border p-6 rounded-2xl shadow-[0_0_20px_rgba(57,255,20,0.02)]">
            <div>
              <h1 className="text-3xl font-black font-display text-white">
                Shortify Dashboard
              </h1>
              <p className="text-neutral-400 mt-1 text-sm">
                Shorten URLs, manage links, and view detailed click analytics.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="w-full flex bg-dark-card border border-dark-border p-1.5 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab("shorten")}
              className={`flex-1 py-2.5 px-2 md:py-3 md:px-4 rounded-lg font-bold font-display text-xs sm:text-sm transition-all duration-250 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "shorten"
                  ? "bg-neon-green text-black shadow-[0_0_12px_rgba(57,255,20,0.2)]"
                  : "text-neutral-400 hover:text-white hover:bg-dark-hover"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Shorten Link
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-2.5 px-2 md:py-3 md:px-4 rounded-lg font-bold font-display text-xs sm:text-sm transition-all duration-250 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-neon-green text-black shadow-[0_0_12px_rgba(57,255,20,0.2)]"
                  : "text-neutral-400 hover:text-white hover:bg-dark-hover"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Link Analytics
            </button>
            <button
              onClick={() => setActiveTab("redirect")}
              className={`flex-1 py-2.5 px-2 md:py-3 md:px-4 rounded-lg font-bold font-display text-xs sm:text-sm transition-all duration-250 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "redirect"
                  ? "bg-neon-green text-black shadow-[0_0_12px_rgba(57,255,20,0.2)]"
                  : "text-neutral-400 hover:text-white hover:bg-dark-hover"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Quick Redirect
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="w-full bg-dark-card border border-dark-border rounded-3xl p-6 md:p-8 shadow-xl">
            {/* 1. SHORTEN URL TAB */}
            {activeTab === "shorten" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-black font-display mb-4 flex items-center gap-2 text-white">
                  Create a Short Link
                </h2>
                <p className="text-neutral-400 text-sm mb-6">
                  Paste your long URL below to shorten it immediately. Shortened URLs will be logged to your library for tracking.
                </p>



                 {/* CREATE URL FORM */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Paste your long URL here (e.g. https://google.com)..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={loading}
                      className="flex-1 bg-black border border-dark-border text-white placeholder-neutral-700 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-neon-green/10 focus:border-neon-green transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-neon-green hover:opacity-90 hover:shadow-[0_0_12px_rgba(57,255,20,0.25)] active:scale-[0.98] transition-all text-black font-bold font-display px-8 py-4 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Shortening..." : "Shorten"}
                    </button>
                  </div>

                  {user && (
                    <div className="flex flex-col gap-4 bg-black p-4 rounded-xl border border-dark-border animate-fadeIn">
                      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expiryEnabled}
                          onChange={(e) => setExpiryEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-dark-border bg-black text-neon-green focus:ring-neon-green/20"
                        />
                        <span>Enable Link Expiration</span>
                      </label>

                      {expiryEnabled && (
                        <div className="flex flex-col gap-3 animate-fadeIn">
                          {/* Presets Button Group */}
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "1 Hour", value: "1h" },
                              { label: "6 Hours", value: "6h" },
                              { label: "12 Hours", value: "12h" },
                              { label: "24 Hours", value: "24h" },
                              { label: "Custom", value: "custom" },
                            ].map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => setExpiryPreset(preset.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  expiryPreset === preset.value
                                    ? "bg-neon-green border-neon-green text-black font-bold shadow-sm"
                                    : "bg-black border-dark-border text-neutral-400 hover:text-white hover:bg-dark-hover"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {/* Custom date input if Custom selected */}
                          {expiryPreset === "custom" && (
                            <div className="flex items-center gap-2 animate-fadeIn mt-1">
                              <span className="text-xs text-neutral-400">Expires on:</span>
                              <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                required
                                min={new Date(Date.now() + 60000 - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)} // minimum 1 minute in future (local time)
                                className="bg-black border border-dark-border text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/10"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </form>

                {/* SHORT URL RESULT */}
                {shortUrl ? (
                  <div className="bg-black border border-dark-border rounded-2xl p-6 shadow-[0_0_15px_rgba(57,255,20,0.04)] animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                          Shortened Link Created
                        </span>
                        <a
                          href={`${baseURL}/${shortUrl.split("/").pop()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neon-green text-lg font-bold font-display break-all hover:underline"
                        >
                          {shortUrl}
                        </a>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shortUrl);
                            alert("Copied to clipboard!");
                          }}
                          className="bg-neon-green hover:opacity-90 hover:shadow-[0_0_12px_rgba(57,255,20,0.25)] text-black font-bold font-display px-5 py-3 rounded-xl transition-all text-sm cursor-pointer"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="mt-6 border-t border-dark-border pt-6 flex flex-col sm:flex-row items-center gap-6">
                      <div className="bg-white p-3 rounded-xl border border-neutral-850">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`}
                          alt="QR Code"
                          className="h-28 w-28"
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="text-base font-bold text-white">QR Code Generated</h4>
                        <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                          Scan this code with a smartphone to quickly visit your shortened link. Save it or share it directly!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-dark-border rounded-2xl py-12 flex flex-col items-center justify-center text-center text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <p className="text-sm font-semibold text-neutral-500">No URL shortened yet</p>
                    <p className="text-xs text-neutral-600 mt-1">Shortened links will show up here with visual analytics.</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-black font-display mb-4 flex items-center gap-2 text-white">
                  Link Performance Analytics
                </h2>

                {!user ? (
                  <div className="border border-dashed border-dark-border rounded-2xl py-12 flex flex-col items-center justify-center text-center text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm font-semibold text-neutral-500">Analytics are locked</p>
                    <p className="text-xs text-neutral-600 mt-1 mb-4">Please log in to view click analytics and link performance metrics.</p>
                    <button
                      onClick={() => openAuthModal("")}
                      className="px-5 py-2 bg-neon-green hover:opacity-90 text-black text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-neutral-400 text-sm mb-6">
                      Input a short code or full shortened URL below to lookup click logs, creation date, and status. Alternatively, click any link in your sidebar library.
                    </p>

                    {/* SEARCH BAR */}
                    <form onSubmit={handleStats} className="flex gap-4 mb-8">
                      <input
                        type="text"
                        placeholder="Enter short code or full shortened URL "
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 bg-black border border-dark-border text-white placeholder-neutral-700 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-neon-green/10 focus:border-neon-green transition-all"
                      />
                      {inspectedCode && code.trim() === inspectedCode ? (
                        <button
                          type="submit"
                          disabled={loadingStats || !code}
                          className="bg-black hover:bg-dark-hover border border-dark-border hover:border-neon-green active:scale-[0.98] transition-all text-white px-6 py-4 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center cursor-pointer"
                          title="Refresh Stats"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 ${loadingStats ? "animate-spin text-neon-green" : "text-neutral-500"}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loadingStats || !code}
                          className="bg-neon-green hover:opacity-90 active:scale-[0.98] transition-all text-black font-bold font-display px-6 py-4 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {loadingStats ? "Searching..." : "Lookup Stats"}
                        </button>
                      )}
                    </form>

                    {/* STATS DISPLAY */}
                    {loadingStats ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent mb-3"></div>
                        <p className="text-sm text-neutral-400">Fetching performance metrics...</p>
                      </div>
                    ) : stats ? (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-dark-border pb-4">
                          <div>
                            <span className="text-xs text-neon-green font-bold uppercase tracking-wider block">
                              Inspecting Short URL
                            </span>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <h3 className="text-2xl font-black font-display text-white break-all">
                                {shortLinkHost}/{code}
                              </h3>
                              <a
                                href={`${baseURL}/${code}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center p-1.5 rounded-lg bg-neon-green hover:opacity-90 text-black transition-all shadow-sm cursor-pointer"
                                title="Visit Link"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* CLICKS STAT */}
                          <div className="bg-black rounded-2xl p-6 border border-dark-border flex items-center justify-between">
                            <div>
                              <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                                Total Clicks
                              </p>
                              <h4 className="text-4xl font-black font-display text-white mt-2">
                                {stats.clicks}
                              </h4>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>

                          {/* ORIGINAL URL */}
                          <div className="bg-black rounded-2xl p-6 border border-dark-border flex flex-col justify-between">
                            <div>
                              <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                                Original Destination URL
                              </p>
                              <a
                                href={stats.originalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-neon-green font-bold block truncate mt-2 text-base hover:underline"
                                title={stats.originalUrl}
                              >
                                {stats.originalUrl}
                              </a>
                            </div>
                          </div>

                          {/* CREATION DATE */}
                          <div className="bg-black rounded-2xl p-6 border border-dark-border">
                            <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                              Created Date
                            </p>
                            <p className="text-lg font-bold text-white mt-2">
                              {new Date(stats.createdAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>

                          {/* EXPIRATION DATE */}
                          <div className="bg-black rounded-2xl p-6 border border-dark-border">
                            <p className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                              Expiration Status
                            </p>
                            <p className="text-lg font-bold text-white mt-2">
                              {stats.expiresAt
                                ? new Date(stats.expiresAt).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "Unlimited Expiry"}
                            </p>
                          </div>

                          {/* QR CODE CARD */}
                          <div className="bg-black rounded-2xl p-6 border border-dark-border flex flex-col sm:flex-row items-center gap-6 md:col-span-2 animate-fadeIn shadow-[0_0_15px_rgba(57,255,20,0.02)]">
                            <div className="bg-white p-3 rounded-xl border border-neutral-800">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${shortLinkHost}/${code}`)}`}
                                alt="QR Code"
                                className="h-28 w-28"
                              />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                              <h4 className="text-base font-bold text-white">QR Code</h4>
                              <p className="text-xs text-neutral-400 mt-1">
                                Scan this QR code to quickly visit the link: <span className="text-neon-green font-semibold">{shortLinkHost}/{code}</span>
                              </p>
                              <div className="mt-3 flex gap-2 justify-center sm:justify-start">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${shortLinkHost}/${code}`);
                                    alert("Link copied!");
                                  }}
                                  className="px-3 py-1.5 bg-dark-border hover:bg-dark-hover border border-dark-border text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                                >
                                  Copy Link
                                </button>
                                <a
                                  href={`${baseURL}/${code}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-neon-green hover:opacity-90 text-black text-xs font-bold rounded-lg transition-all"
                                >
                                  Visit Link
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-dark-border rounded-2xl py-12 flex flex-col items-center justify-center text-center text-neutral-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm font-semibold text-neutral-500">No link selected for analytics</p>
                        <p className="text-xs text-neutral-600 mt-1">Select a URL from your history sidebar or search for a code above to inspect.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 3. QUICK REDIRECT TAB */}
            {activeTab === "redirect" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-black font-display mb-4 flex items-center gap-2 text-white">
                  Quick Redirect Tool
                </h2>
                <p className="text-neutral-400 text-sm mb-6">
                  Verify or trigger a shortened link redirect. Type in a short code or full shortened URL and click Redirect to open the destination URL.
                </p>

                <form onSubmit={handleRedirect} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter short code or full shortened URL"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 bg-black border border-dark-border text-white placeholder-neutral-700 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-neon-green/10 focus:border-neon-green transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!code}
                    className="bg-neon-green hover:opacity-90 active:scale-[0.98] transition-all text-black font-bold font-display px-8 py-4 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    Redirect
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthReason("");
        }}
        onAuthSuccess={handleAuthSuccess}
        authReason={authReason}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModalOpen}
        type={errorType}
        onClose={handleCloseErrorModal}
      />
    </div>
  );
}
