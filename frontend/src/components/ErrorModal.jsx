import React from "react";

export function ErrorModal({ isOpen, type, onClose }) {
  if (!isOpen) return null;

  const isExpired = type === "expired";

  const title = isExpired ? "Link Expired" : "Link Not Found";
  const message = isExpired
    ? "This shortened link has reached its expiration date and is no longer active. Please contact the link creator to obtain a valid link."
    : "The shortened link you are trying to visit does not exist. It may have been deleted, or the URL could be mistyped.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 cursor-pointer backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-dark-border bg-dark-card p-8 shadow-[0_0_30px_rgba(57,255,20,0.08)] animate-fadeIn text-center">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 rounded-full bg-dark-border p-2 text-neutral-400 hover:bg-dark-hover hover:text-white transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 11-1.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neon-dark/20 border border-neon-green/30 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.1)]">
          {isExpired ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <h2 className="mb-3 text-2xl font-black font-display text-white">
          {title}
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-neutral-400">
          {message}
        </p>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full bg-neon-green hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] text-black py-3.5 rounded-xl font-bold font-display hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
