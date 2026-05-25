// import { useState } from "react";
// import {
//   createShortUrl,
//   getStats,
  
// } from "../api/urlApi";

// export function Shortener() {
//   const [url, setUrl] = useState("");
//   const [shortUrl, setShortUrl] = useState("");
//   const [stats, setStats] = useState(null);
//   const [code, setCode] = useState("");

//   // CREATE SHORT URL
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await createShortUrl(url);

//       setShortUrl(res.data.shortUrl);
//       setUrl("");
//       setStats(null);
//     } catch (err) {
//       alert(err.response?.data?.message || "Error creating short URL");
//     }
//   };

//   // GET STATS
//   const handleStats = async () => {
//     try {
//       const res = await getStats(code);

//       setStats(res.data);
//     } catch (err) {
//       alert(err.response?.data?.message || "Error fetching stats");
//     }
//   };

//   // REDIRECT
//   const handleRedirect = () => {
//   window.open(`http://localhost:5000/${code}`, "_blank");
// };

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
//       <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-2xl">
        
//         <h1 className="text-5xl font-bold text-center text-blue-600 mb-10">
//           URL Shortener
//         </h1>

//         {/* CREATE URL */}
//         <form
//           onSubmit={handleSubmit}
//           className="flex flex-col md:flex-row gap-4"
//         >
//           <input
//             type="text"
//             placeholder="Enter long URL..."
//             value={url}
//             onChange={(e) => setUrl(e.target.value)}
//             className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
//           />

//           <button
//             type="submit"
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
//           >
//             Shorten
//           </button>
//         </form>

//         {/* SHORT URL */}
//         {shortUrl && (
//           <div className="mt-8 bg-gray-50 p-5 rounded-2xl border">
//             <p className="text-gray-600 mb-2 font-medium">
//               Short URL
//             </p>

//             <a
//               href={shortUrl}
//               target="_blank"
//               rel="noreferrer"
//               className="text-blue-600 break-all hover:underline"
//             >
//               {shortUrl}
//             </a>
//           </div>
//         )}

//         {/* STATS + REDIRECT */}
//         <div className="mt-10">
//           <h2 className="text-2xl font-semibold mb-4 text-gray-700">
//             URL Actions
//           </h2>

//           <div className="flex flex-col md:flex-row gap-4">
//             <input
//               type="text"
//               placeholder="Enter short code"
//               value={code}
//               onChange={(e) => setCode(e.target.value)}
//               className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-400"
//             />

//             <button
//               onClick={handleStats}
//               className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition"
//             >
//               Get Stats
//             </button>

//             <button
//               onClick={handleRedirect}
//               className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition"
//             >
//               Redirect
//             </button>
//           </div>
//         </div>

//         {/* STATS DISPLAY */}
//         {stats && (
//           <div className="mt-8 bg-gray-50 border rounded-2xl p-6">
//             <h3 className="text-xl font-semibold mb-4 text-gray-700">
//               URL Stats
//             </h3>

//             <div className="space-y-3 text-gray-700">
//               <p>
//                 <span className="font-semibold">Original URL:</span>{" "}
//                 <a
//                   href={stats.originalUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="text-blue-600 hover:underline break-all"
//                 >
//                   {stats.originalUrl}
//                 </a>
//               </p>

//               <p>
//                 <span className="font-semibold">Clicks:</span>{" "}
//                 {stats.clicks}
//               </p>

//               <p>
//                 <span className="font-semibold">Created At:</span>{" "}
//                 {new Date(stats.createdAt).toLocaleString()}
//               </p>

//               <p>
//                 <span className="font-semibold">Expires At:</span>{" "}
//                 {stats.expiresAt
//                   ? new Date(stats.expiresAt).toLocaleString()
//                   : "No expiry"}
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { createShortUrl, getStats, getUserProfile, getUserUrls, baseURL, shortLinkHost } from "../api/urlApi";
import { Sidebar } from "./Sidebar";
import { AuthModal } from "./AuthModal";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryPreset, setExpiryPreset] = useState("1h");
  const [expiresAt, setExpiresAt] = useState("");

  // Auto-open sidebar on wide screens on initial load
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
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
          console.error("Auth init error:", err);
          handleLogout();
        })
        .finally(() => {
          setLoadingUrls(false);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setUrls([]);
    setShortUrl("");
    setStats(null);
    setInspectedCode("");
  };

  const handleAuthSuccess = (token, user) => {
    localStorage.setItem("token", token);
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
      setIsAuthModalOpen(true);
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
    <div className="flex min-h-screen w-full bg-[#0B0F19] text-white">
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        urls={urls}
        onLogout={handleLogout}
        onLoginClick={() => setIsAuthModalOpen(true)}
        loadingUrls={loadingUrls}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onSelectLink={handleSelectLink}
      />

      <div className={`flex flex-1 flex-col relative overflow-x-hidden transition-all duration-300 ${isSidebarOpen ? "lg:pl-80" : "lg:pl-0"}`}>
        {/* Top Navbar Header */}
        <header className="flex h-16 items-center justify-between border-b border-[#1F2937] bg-[#111827] px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg bg-[#1F2937] p-2 text-gray-400 hover:bg-[#1E293B] hover:text-white"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-xl font-bold text-blue-400">
                Shortify
              </span>
            </button>
          </div>

          <div>
            {!user ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Sign In
              </button>
            ) : (
              <div className="text-sm font-semibold text-gray-300">
                Hi, {user.username}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:px-8 max-w-5xl w-full mx-auto">
          {/* Header Panel */}
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-[#111827] border border-[#1F2937] p-6 rounded-2xl">
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Shortify Dashboard
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                Shorten URLs, manage links, and view detailed click analytics.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="w-full flex bg-[#111827] border border-[#1F2937] p-1.5 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab("shorten")}
              className={`flex-1 py-2.5 px-2 md:py-3 md:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-250 flex items-center justify-center gap-2 ${
                activeTab === "shorten"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Shorten Link
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-2.5 px-2 md:py-3 md:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-250 flex items-center justify-center gap-2 ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Link Analytics
            </button>
            <button
              onClick={() => setActiveTab("redirect")}
              className={`flex-1 py-2.5 px-2 md:py-3 md:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-250 flex items-center justify-center gap-2 ${
                activeTab === "redirect"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Quick Redirect
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="w-full bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 shadow-xl">
            {/* 1. SHORTEN URL TAB */}
            {activeTab === "shorten" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                  Create a Short Link
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Paste your long URL below to shorten it immediately. Shortened URLs will be logged to your library for tracking.
                </p>

                {/* GUEST BANNER */}
                {!user && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-950/20 border border-amber-900/40 p-4 text-amber-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold">You are in Guest Mode. Please sign in to create and track URLs.</span>
                  </div>
                )}

                 {/* CREATE URL FORM */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      placeholder={user ? "Paste your long URL here (e.g. https://google.com)..." : "Please log in to shorten URLs..."}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={!user}
                      className="flex-1 bg-[#1F2937] border border-[#374151] text-white placeholder-gray-500 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={loading || !user}
                      className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-semibold px-8 py-4 rounded-xl shadow-md disabled:opacity-50"
                    >
                      {loading ? "Shortening..." : "Shorten"}
                    </button>
                  </div>

                  {user && (
                    <div className="flex flex-col gap-4 bg-[#1F2937]/50 p-4 rounded-xl border border-[#374151]/60 animate-fadeIn">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expiryEnabled}
                          onChange={(e) => setExpiryEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500/40"
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
                                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                                    : "bg-[#1F2937] border-[#374151] text-gray-400 hover:text-white hover:bg-[#253041]"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {/* Custom date input if Custom selected */}
                          {expiryPreset === "custom" && (
                            <div className="flex items-center gap-2 animate-fadeIn mt-1">
                              <span className="text-xs text-gray-400">Expires on:</span>
                              <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                required
                                min={new Date(Date.now() + 60000 - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)} // minimum 1 minute in future (local time)
                                className="bg-[#1F2937] border border-[#374151] text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  <div className="bg-[#1F2937] border border-[#374151] rounded-2xl p-6 shadow-md animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                          Shortened Link Created
                        </span>
                        <a
                          href={`${baseURL}/${shortUrl.split("/").pop()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 text-lg font-bold break-all hover:underline"
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
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="mt-6 border-t border-[#374151] pt-6 flex flex-col sm:flex-row items-center gap-6">
                      <div className="bg-white p-3 rounded-xl border border-gray-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`}
                          alt="QR Code"
                          className="h-28 w-28"
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="text-base font-bold text-white">QR Code Generated</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                          Scan this code with a smartphone to quickly visit your shortened link. Save it or share it directly!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#374151] rounded-2xl py-12 flex flex-col items-center justify-center text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <p className="text-sm font-semibold">No URL shortened yet</p>
                    <p className="text-xs text-gray-600 mt-1">Shortened links will show up here with visual analytics.</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                  Link Performance Analytics
                </h2>

                {!user ? (
                  <div className="border border-dashed border-[#374151] rounded-2xl py-12 flex flex-col items-center justify-center text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-300">Analytics are locked</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Please log in to view click analytics and link performance metrics.</p>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-6">
                      Input a short code or full shortened URL below to lookup click logs, creation date, and status. Alternatively, click any link in your sidebar library.
                    </p>

                    {/* SEARCH BAR */}
                    <form onSubmit={handleStats} className="flex gap-4 mb-8">
                      <input
                        type="text"
                        placeholder="Enter short code or full shortened URL "
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 bg-[#1F2937] border border-[#374151] text-white placeholder-gray-500 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                      {inspectedCode && code.trim() === inspectedCode ? (
                        <button
                          type="submit"
                          disabled={loadingStats || !code}
                          className="bg-[#1F2937] hover:bg-[#253041] border border-[#374151] hover:border-blue-500 active:scale-[0.98] transition-all text-white px-6 py-4 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center cursor-pointer"
                          title="Refresh Stats"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 ${loadingStats ? "animate-spin text-blue-400" : "text-gray-400"}`} 
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
                          className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-semibold px-6 py-4 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {loadingStats ? "Searching..." : "Lookup Stats"}
                        </button>
                      )}
                    </form>

                    {/* STATS DISPLAY */}
                    {loadingStats ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-3"></div>
                        <p className="text-sm text-gray-400">Fetching performance metrics...</p>
                      </div>
                    ) : stats ? (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-[#374151] pb-4">
                          <div>
                            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">
                              Inspecting Short URL
                            </span>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <h3 className="text-2xl font-extrabold text-white break-all">
                                {shortLinkHost}/{code}
                              </h3>
                              <a
                                href={`${baseURL}/${code}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm cursor-pointer"
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
                          <div className="bg-[#1F2937] rounded-2xl p-6 border border-[#374151] flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                Total Clicks
                              </p>
                              <h4 className="text-4xl font-extrabold text-white mt-2">
                                {stats.clicks}
                              </h4>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>

                          {/* ORIGINAL URL */}
                          <div className="bg-[#1F2937] rounded-2xl p-6 border border-[#374151] flex flex-col justify-between">
                            <div>
                              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                Original Destination URL
                              </p>
                              <a
                                href={stats.originalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 font-bold block truncate mt-2 text-base hover:underline"
                                title={stats.originalUrl}
                              >
                                {stats.originalUrl}
                              </a>
                            </div>
                          </div>

                          {/* CREATION DATE */}
                          <div className="bg-[#1F2937] rounded-2xl p-6 border border-[#374151]">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
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
                          <div className="bg-[#1F2937] rounded-2xl p-6 border border-[#374151]">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
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
                          <div className="bg-[#1F2937] rounded-2xl p-6 border border-[#374151] flex flex-col sm:flex-row items-center gap-6 md:col-span-2 animate-fadeIn">
                            <div className="bg-white p-3 rounded-xl border border-gray-200">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${shortLinkHost}/${code}`)}`}
                                alt="QR Code"
                                className="h-28 w-28"
                              />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                              <h4 className="text-base font-bold text-white">QR Code</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                Scan this QR code to quickly visit the link: <span className="text-blue-400 font-semibold">{shortLinkHost}/{code}</span>
                              </p>
                              <div className="mt-3 flex gap-2 justify-center sm:justify-start">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${shortLinkHost}/${code}`);
                                    alert("Link copied!");
                                  }}
                                  className="px-3 py-1.5 bg-[#2D3748] hover:bg-[#4A5568] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                                >
                                  Copy Link
                                </button>
                                <a
                                  href={`${baseURL}/${code}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all"
                                >
                                  Visit Link
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-[#374151] rounded-2xl py-12 flex flex-col items-center justify-center text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm font-semibold">No link selected for analytics</p>
                        <p className="text-xs text-gray-600 mt-1">Select a URL from your history sidebar or search for a code above to inspect.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 3. QUICK REDIRECT TAB */}
            {activeTab === "redirect" && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                  Quick Redirect Tool
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Verify or trigger a shortened link redirect. Type in a short code or full shortened URL and click Redirect to open the destination URL.
                </p>

                <form onSubmit={handleRedirect} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter short code or full shortened URL"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 bg-[#1F2937] border border-[#374151] text-white placeholder-gray-500 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!code}
                    className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-semibold px-8 py-4 rounded-xl shadow-md disabled:opacity-50"
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
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

