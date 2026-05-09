export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
              SP
            </div>
            <span className="font-semibold text-lg tracking-tight">
              PredictiveAlpha
            </span>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-4">
            <button
              id="nav-docs-btn"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Documentation
            </button>
            <div className="h-5 w-px bg-gray-700" />
            <button
              id="nav-signin-btn"
              className="text-sm font-medium bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
