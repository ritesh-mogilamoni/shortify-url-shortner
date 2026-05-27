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
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(7);

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

  const filteredUrls = urls.filter((url) => {
    const query = searchQuery.toLowerCase();
    return (
      url.shortCode.toLowerCase().includes(query) ||
      (url.originalUrl && url.originalUrl.toLowerCase().includes(query))
    );
  });

  const displayedUrls = filteredUrls.slice(0, displayLimit);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Backdrop (Mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-dark-border bg-dark-card text-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-end border-b border-dark-border px-6">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg bg-dark-border p-1.5 hover:bg-dark-hover transition-all text-neutral-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 11-1.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Profile / Auth Info */}
        <div className="border-b border-dark-border p-6">
          {user ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neon-green font-display font-black text-black shadow-inner">
                  {getInitials(user.username)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="truncate font-semibold text-white">{user.username}</h4>
                  <p className="truncate text-xs text-neutral-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-dark-border py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 border border-transparent hover:border-red-900/30 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-black p-4 text-center border border-dark-border">
              <p className="text-sm text-neutral-400 mb-3">Sign in to sync, save, and track link analytics.</p>
              <button
                onClick={onLoginClick}
                className="w-full bg-neon-green hover:bg-opacity-90 hover:shadow-[0_0_12px_rgba(57,255,20,0.25)] text-black rounded-xl py-2 text-sm font-bold transition-all"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        {user && (
          <div className="grid grid-cols-2 gap-4 border-b border-dark-border p-6">
            <div className="rounded-xl bg-black p-3 border border-dark-border text-center">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">Links</p>
              <p className="text-xl font-bold font-display">{totalUrls}</p>
            </div>
            <div className="rounded-xl bg-black p-3 border border-dark-border text-center">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">Active</p>
              <p className="text-xl font-bold font-display text-neon-green">{activeUrls}</p>
            </div>
          </div>
        )}

        {/* Links History */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              My Links
            </h3>
            {user && (
              <span className="rounded-full bg-neon-dark/20 px-2.5 py-0.5 text-xs text-neon-green font-semibold border border-neon-green/20">
                {searchQuery ? `${filteredUrls.length}/${urls.length}` : urls.length}
              </span>
            )}
          </div>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-neutral-500 font-semibold">History is locked.</p>
              <p className="text-[10px] text-neutral-600 mt-1">Please log in to view your shortened links.</p>
            </div>
          ) : loadingUrls ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-green border-t-transparent"></div>
              <p className="text-xs mt-2 text-neutral-400">Loading library...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs text-neutral-500">No links yet.</p>
              <p className="text-[10px] text-neutral-600 mt-1">Create your first link using the shortener.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDisplayLimit(7); // reset limit when searching
                  }}
                  className="w-full rounded-xl bg-black border border-dark-border pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-neon-green transition-all focus:ring-1 focus:ring-neon-green/20"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs font-bold focus:outline-none"
                  >
                    ×
                  </button>
                )}
              </div>

              {filteredUrls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-neutral-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-xs text-neutral-500">No matching links.</p>
                  <p className="text-[10px] text-neutral-600 mt-1">Try a different search query.</p>
                </div>
              ) : (
                <>
                  {displayedUrls.map((url) => {
                    const isCopied = copiedId === url._id;

                    return (
                      <div
                        key={url._id}
                        onClick={() => onSelectLink && onSelectLink(url.shortCode)}
                        className="group relative rounded-2xl bg-black p-4 border border-dark-border hover:border-neon-green hover:bg-dark-hover transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="overflow-hidden pr-2">
                            {/* Short code display */}
                            <div className="font-bold font-display text-neon-green group-hover:text-opacity-80 block truncate text-base">
                              /{url.shortCode}
                            </div>
                            
                            {/* Original Url truncated */}
                            <p
                              className="text-[11px] text-neutral-400 truncate mt-1 group-hover:text-neutral-300"
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
                                ? "bg-neon-green/20 text-neon-green"
                                : "bg-dark-border hover:bg-dark-hover border border-dark-border text-neutral-500 group-hover:text-white"
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

                        <div className="mt-3 flex items-center justify-end border-t border-dark-border pt-2 text-[10px] text-neutral-500">
                          <span className="text-neutral-500 flex items-center gap-1 group-hover:text-neon-green transition-colors">
                            Inspect
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Toggles */}
                  <div className="flex flex-col gap-2 pt-2">
                    {filteredUrls.length > displayLimit && (
                      <button
                        onClick={() => setDisplayLimit((prev) => prev + 10)}
                        className="w-full py-2.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-xs font-semibold text-neon-green hover:shadow-[0_0_8px_rgba(57,255,20,0.1)] transition-all text-center cursor-pointer"
                      >
                        Show More (+{filteredUrls.length - displayLimit} links)
                      </button>
                    )}
                    {displayLimit > 7 && (
                      <button
                        onClick={() => setDisplayLimit(7)}
                        className="w-full py-2.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-xs font-semibold text-neutral-400 hover:text-white transition-all text-center cursor-pointer"
                      >
                        Show Less
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
