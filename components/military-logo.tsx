export function MilitaryLogo() {
  return (
    <div className="flex items-center justify-center">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Shield background */}
        <path
          d="M32 4L52 12V28C52 42 32 58 32 58C32 58 12 42 12 28V12L32 4Z"
          fill="url(#shieldGradient)"
          stroke="#F59E0B"
          strokeWidth="2"
        />

        {/* Satellite body */}
        <rect x="28" y="20" width="8" height="12" fill="#10B981" stroke="#059669" strokeWidth="1" />

        {/* Solar panels */}
        <rect x="22" y="24" width="4" height="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
        <rect x="38" y="24" width="4" height="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />

        {/* Antenna */}
        <line x1="32" y1="20" x2="32" y2="16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="16" r="2" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />

        {/* Signal waves */}
        <circle cx="32" cy="26" r="6" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.6" />
        <circle cx="32" cy="26" r="9" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.4" />
        <circle cx="32" cy="26" r="12" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.2" />

        {/* Stars */}
        <polygon points="20,14 21,16 23,16 21.5,17.5 22,20 20,18.5 18,20 18.5,17.5 17,16 19,16" fill="#F59E0B" />
        <polygon points="44,14 45,16 47,16 45.5,17.5 46,20 44,18.5 42,20 42.5,17.5 41,16 43,16" fill="#F59E0B" />

        {/* Bottom text area */}
        <text x="32" y="48" textAnchor="middle" fill="#F59E0B" fontSize="6" fontWeight="bold" fontFamily="monospace">
          SENTINEL
        </text>

        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
