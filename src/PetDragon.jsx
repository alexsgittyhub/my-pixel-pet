// PetDragon.jsx — Dragon variant for My Pixel Pet v1.4.0
export default function PetDragon({ mood, themeColor }) {
  const isSad   = mood === 'sad'
  const isHappy = mood === 'happy'

  const c  = themeColor ?? '#34d399'
  const c2 = themeColor ?? '#059669'

  const bodyGrad1 = isHappy ? '#6ee7b7' : isSad ? '#94a3b8' : c
  const bodyGrad2 = isHappy ? '#10b981' : isSad ? '#64748b' : c2

  const eyeLeft = isSad
    ? <path d="M 68 105 Q 80 118 92 105" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 68 108 Q 80 96 92 108" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="80" cy="106" rx="8" ry="9" fill="#064e3b" />

  const eyeRight = isSad
    ? <path d="M 108 105 Q 120 118 132 105" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 108 108 Q 120 96 132 108" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="120" cy="106" rx="8" ry="9" fill="#064e3b" />

  const shineLeft  = !isSad && <circle cx="84" cy="102" r="2.5" fill="white" opacity="0.8" />
  const shineRight = !isSad && <circle cx="124" cy="102" r="2.5" fill="white" opacity="0.8" />

  const browLeft  = isSad && <path d="M 64 95 Q 78 89 91 95"  stroke="#047857" strokeWidth="3.5" strokeLinecap="round" fill="none" />
  const browRight = isSad && <path d="M 109 95 Q 122 89 136 95" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" fill="none" />

  const mouth = isSad
    ? <path d="M 86 138 Q 100 128 114 138" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 84 132 Q 100 148 116 132" stroke="#047857" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      : <path d="M 88 136 Q 100 142 112 136" stroke="#047857" strokeWidth="3"   strokeLinecap="round" fill="none" />

  const fire = isHappy && (
    <g>
      <ellipse cx="100" cy="175" rx="8" ry="12" fill="#fbbf24" opacity="0.9" />
      <ellipse cx="100" cy="174" rx="5" ry="8"  fill="#f87171" opacity="0.85" />
      <ellipse cx="97"  cy="170" rx="3" ry="5"  fill="#fef3c7" opacity="0.7" />
      <ellipse cx="103" cy="171" rx="3" ry="5"  fill="#fef3c7" opacity="0.7" />
    </g>
  )

  const sweatDrop = isSad && (
    <g>
      <ellipse cx="148" cy="80" rx="5" ry="7" fill="#93c5fd" opacity="0.85" />
      <ellipse cx="148" cy="74" rx="3" ry="4" fill="#93c5fd" opacity="0.85" />
    </g>
  )

  const sparkles = isHappy && (
    <g fill="#34d399" opacity="0.9">
      <text x="28"  y="65" fontSize="14">✦</text>
      <text x="158" y="70" fontSize="11">✦</text>
      <text x="152" y="48" fontSize="9">✦</text>
    </g>
  )

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xl" aria-label="dragon pet">
      <defs>
        <radialGradient id="dragonBodyGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={bodyGrad1} />
          <stop offset="100%" stopColor={bodyGrad2} />
        </radialGradient>
        <radialGradient id="dragonWingGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
      </defs>

      {sparkles}

      {/* Wings */}
      <path d="M 48 90 Q 10 55 28 100 Q 38 118 58 108 Z"
        fill="url(#dragonWingGrad)" opacity="0.85" />
      <path d="M 152 90 Q 190 55 172 100 Q 162 118 142 108 Z"
        fill="url(#dragonWingGrad)" opacity="0.85" />

      {/* Wing membrane lines */}
      <path d="M 48 90 Q 28 82 28 100" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M 48 90 Q 20 65 28 100" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M 152 90 Q 172 82 172 100" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M 152 90 Q 180 65 172 100" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.5" />

      {/* Tail */}
      <path d="M 148 158 Q 178 170 170 188 Q 158 200 150 185"
        stroke="url(#dragonBodyGrad)" strokeWidth="12" fill="none" strokeLinecap="round" />

      {/* Spines on head */}
      <polygon points="75,52 80,38 85,52"  fill="#34d399" opacity="0.85" />
      <polygon points="95,46 100,30 105,46" fill="#34d399" opacity="0.9" />
      <polygon points="115,52 120,38 125,52" fill="#34d399" opacity="0.85" />

      {/* Ears / horns */}
      <ellipse cx="62"  cy="66" rx="16" ry="24" fill="url(#dragonWingGrad)" transform="rotate(-18 62 66)" />
      <ellipse cx="62"  cy="66" rx="8"  ry="14" fill="#d1fae5" transform="rotate(-18 62 66)" />
      <ellipse cx="138" cy="66" rx="16" ry="24" fill="url(#dragonWingGrad)" transform="rotate(18 138 66)" />
      <ellipse cx="138" cy="66" rx="8"  ry="14" fill="#d1fae5" transform="rotate(18 138 66)" />

      {/* Body */}
      <circle cx="100" cy="118" r="70" fill="url(#dragonBodyGrad)" />

      {/* Belly scales */}
      <ellipse cx="100" cy="132" rx="34" ry="26" fill="white" opacity="0.18" />
      <ellipse cx="100" cy="140" rx="22" ry="14" fill="white" opacity="0.12" />

      {/* Cheeks */}
      <ellipse cx="72"  cy="126" rx="15" ry="9" fill="#6ee7b7" opacity="0.45" />
      <ellipse cx="128" cy="126" rx="15" ry="9" fill="#6ee7b7" opacity="0.45" />

      {/* Nostrils */}
      <ellipse cx="94"  cy="122" rx="3.5" ry="2.5" fill="#047857" opacity="0.6" />
      <ellipse cx="106" cy="122" rx="3.5" ry="2.5" fill="#047857" opacity="0.6" />

      {browLeft}{browRight}
      {eyeLeft}{eyeRight}
      {shineLeft}{shineRight}
      {mouth}
      {sweatDrop}

      {/* Claws */}
      <ellipse cx="52"  cy="166" rx="18" ry="11" fill="url(#dragonBodyGrad)" />
      <ellipse cx="148" cy="166" rx="18" ry="11" fill="url(#dragonBodyGrad)" />
      <path d="M 42 170 L 38 178" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 50 172 L 48 181" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 58 170 L 62 178" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 142 170 L 138 178" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 150 172 L 152 181" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 158 170 L 162 178" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />

      {fire}
    </svg>
  )
}
