export default function BackButton({ isVisible, onBackClick }) {
  if (!isVisible) return null;

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <div className="absolute top-6 left-6 z-[10]">
      <button
        onClick={handleBackClick}
        className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 text-white font-light text-sm tracking-wide transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95"
      >
        <div className="flex items-center gap-3">
          {/* Arrow icon */}
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>

          {/* Text */}
          <span className="transition-transform duration-300 group-hover:-translate-x-1">
            Back to Parallax
          </span>
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      {/* Additional context text */}
      <div className="mt-3 text-white/60 text-xs font-light tracking-wide">
        Return to explore other elements
      </div>
    </div>
  );
}
