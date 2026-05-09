"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useState } from "react";

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
  };

  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
              SP
            </div>
            <span className="font-semibold text-lg tracking-tight">
              PredictiveAlpha
            </span>
          </Link>

          {/* Nav Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                document.documentElement.classList.toggle("dark");
              }}
              className="p-2 rounded-full text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              title="Toggle Theme"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <div className="h-5 w-px bg-gray-700" />

            {/* Auth state */}
            {isPending ? (
              /* Loading skeleton */
              <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
            ) : session?.user ? (
              /* Logged-in: avatar + dropdown */
              <div className="relative">
                <button
                  id="user-avatar-btn"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 focus:outline-none group"
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User"}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-transparent group-hover:ring-blue-500 transition-all">
                      {userInitial}
                    </div>
                  )}
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-800 rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-800">
                      <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    </div>
                    <button
                      id="signout-btn"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Logged-out */
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  id="nav-signin-btn"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  id="nav-signup-btn"
                  className="text-sm font-medium bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
