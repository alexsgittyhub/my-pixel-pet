export default function PetSlime({ mood }) {
  const isSad   = mood === 'sad'
  const isHappy = mood === 'happy'

  const bodyColor = isHappy ? '#86efac' : isSad ? '#93c5fd' : '#6ee7b7'
  const rimColor  = isHappy ? '#4ade80' : isSad ? '#60a5fa' : '#34d399'

  const eyeLeft = isSad
    ? <path d="M 75 108 Q 85 120 95 108" stroke="#065f46" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 75 110 Q 85 98 95 110" stroke="#065f46" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="85" cy="108" rx="8" ry="9" fill="#065f46" />

  const eyeRight = isSad
    ? <path d="M 105 108 Q 115 120 125 108" stroke="#065f46" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 105 110 Q 115 98 125 110" stroke="#065f46" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="115" cy="108" rx="8" ry="9" fill="#065f46" />

  const shineLeft  = !isSad && <circle cx="89" cy="104" r="2.5" fill="white" opacity="0.8" />
  const shineRight = !isSad && <circle cx="119" cy="104" r="2.5" fill="white" opacity="0.8" />

  const mouth = isSad
    ? <path d="M 88 138 Q 100 128 112 138" stroke="#065f46" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 86 134 Q 100 150 114 134" stroke="#065f46" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      : <path d="M 90 137 Q 100 143 110 137" stroke="#065f46" strokeWidth="3" strokeLinecap="round" fill="none" />

  const sparkles = isHappy && (
    <g fill="#fbbf24" opacity="0.9">
      <text x="30"  y="70" fontSize="14">✦</text>
      <text x="156" y="66" fontSize="11">✦</text>
    </g>
  )
  const sweatDrop = isSad && (
    <g>
      <ellipse cx="145" cy="84" rx="5" ry="7" fill="#bfdbfe" opacity="0.85" />
      <ellipse cx="145" cy="78" rx="3" ry="4" fill="#bfdbfe" opacity="0.85" />
    </g>
  )

  /* Drippy bottom path */
  const drips = 'M 36 148 Q 44 180 52 158 Q 60 186 68 162 Q 76 188 84 164 Q 92 188 100 164 Q 108 188 116 164 Q 124 188 132 162 Q 140 186 148 158 Q 156 180 164 148'

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xl" aria-label="slime pet">
      <defs>
        <radialGradient id="slimeBodyGrad" cx="40%" cy="30%" r="65%">
          <stop offset="0%"   stopColor={bodyColor} />
          <stop offset="100%" stopColor={rimColor}  />
        </radialGradient>
      </defs>
      {sparkles}
      {/* Drippy base */}
      <path d={drips} fill="url(#slimeBodyGrad)" opacity="0.9" />
      {/* Main blob body */}
      <ellipse cx="100" cy="118" rx="68" ry="62" fill="url(#slimeBodyGrad)" />
      {/* Highlight blob */}
      <ellipse cx="80" cy="90" rx="22" ry="16" fill="white" opacity="0.18" transform="rotate(-15 80 90)" />
      {/* Cheeks */}
      <ellipse cx="70"  cy="128" rx="16" ry="10" fill={rimColor} opacity="0.4" />
      <ellipse cx="130" cy="128" rx="16" ry="10" fill={rimColor} opacity="0.4" />
      {/* Tiny antennae blobs */}
      <circle cx="84"  cy="56" r="7" fill={bodyColor} />
      <circle cx="116" cy="56" r="7" fill={bodyColor} />
      <circle cx="84"  cy="56" r="4" fill="white" opacity="0.35" />
      <circle cx="116" cy="56" r="4" fill="white" opacity="0.35" />
      {eyeLeft}{eyeRight}
      {shineLeft}{shineRight}
      {mouth}
      {sweatDrop}
    </svg>
  )
}
