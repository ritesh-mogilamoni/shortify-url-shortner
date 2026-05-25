import { useState } from "react";
import { shortLinkHost } from "../api/urlApi";

export function Sidebar({ 
  user, 
  urls, 
  onLogout, 
  onLoginClick, 
  loadingUrls, 
  isOpen, 
  setIsOpen,
  onSelectLink 
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e, id, shortCode) => {
    e.stopPropagation(); // Prevent triggering onSelectLink
    const fullUrl = `${shortLinkHost}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Calculate stats
  const totalUrls = urls.length;
  const now = new Date();
  const activeUrls = urls.filter((url) => {
    if (!url.expiresAt) return true;
    return new Date(url.expiresAt) > now;
  }).length;

  const getInitials = (name) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Backdrop (Mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-[#1F2937] bg-[#111827] text-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-end border-b border-[#1F2937] px-6">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg bg-[#1F2937] p-1.5 hover:bg-[#374151]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Profile / Auth Info */}
        <div className="border-b border-[#1F2937] p-6">
          {user ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-inner">
                  {getInitials(user.username)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="truncate font-semibold text-white">{user.username}</h4>
                  <p className="truncate text-xs text-gray-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1F2937] py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#1F2937] p-4 text-center border border-[#374151]">
              <p className="text-sm text-gray-300 mb-3">Sign in to sync, save, and track link analytics.</p>
              <button
                onClick={onLoginClick}
                className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-2 text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        {user && (
          <div className="grid grid-cols-2 gap-4 border-b border-[#1F2937] p-6">
            <div className="rounded-xl bg-[#1F2937] p-3 border border-[#374151] text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Links</p>
              <p className="text-xl font-bold">{totalUrls}</p>
            </div>
            <div className="rounded-xl bg-[#1F2937] p-3 border border-[#374151] text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Active</p>
              <p className="text-xl font-bold text-emerald-400">{activeUrls}</p>
            </div>
          </div>
        )}

        {/* Links History */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              My Links
            </h3>
            {user && (
              <span className="rounded-full bg-blue-900/40 px-2.5 py-0.5 text-xs text-blue-400 font-semibold border border-blue-850">
                {urls.length}
              </span>
            )}
          </div>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-400">History is locked.</p>
              <p className="text-[10px] text-gray-500 mt-1">Please log in to view your shortened links.</p>
            </div>
          ) : loadingUrls ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-xs mt-2 text-gray-400">Loading library...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs text-gray-400">No links yet.</p>
              <p className="text-[10px] text-gray-500 mt-1">Create your first link using the shortener.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urls.map((url) => {
                const fullShortUrl = `${shortLinkHost}/${url.shortCode}`;
                const isCopied = copiedId === url._id;

                return (
                  <div
                    key={url._id}
                    onClick={() => onSelectLink && onSelectLink(url.shortCode)}
                    className="group relative rounded-2xl bg-[#1F2937] p-4 border border-[#374151] hover:border-blue-500 hover:bg-[#253041] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden pr-2">
                        {/* Short code display */}
                        <div className="font-bold text-blue-400 group-hover:text-blue-300 block truncate text-base">
                          /{url.shortCode}
                        </div>
                        
                        {/* Original Url truncated */}
                        <p
                          className="text-[11px] text-gray-400 truncate mt-1 group-hover:text-gray-300"
                          title={url.originalUrl}
                        >
                          {url.originalUrl}
                        </p>
                      </div>

                      {/* Copy button with checkmark swap */}
                      <button
                        onClick={(e) => handleCopy(e, url._id, url.shortCode)}
                        className={`rounded-lg p-1.5 transition ${
                          isCopied
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-[#2D3748] hover:bg-[#4A5568] text-gray-400 group-hover:text-white"
                        }`}
                        title="Copy Link"
                      >
                        {isCopied ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-[#374151] pt-2 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{url.clicks || 0} clicks</span>
                      </div>
                      <span className="text-gray-400 flex items-center gap-1 group-hover:text-blue-300 transition-colors">
                        Inspect
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

