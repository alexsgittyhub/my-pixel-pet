export default function PixelPet({ mood }) {
  // mood: 'happy' | 'neutral' | 'sad'
  const isSad    = mood === 'sad'
  const isHappy  = mood === 'happy'

  /* ── Body colours ── */
  const bodyGrad1 = isHappy ? '#f472b6' : isSad ? '#a78bfa' : '#e879f9'
  const bodyGrad2 = isHappy ? '#c084fc' : isSad ? '#818cf8' : '#c084fc'

  /* ── Eye shapes ──
       happy → upward arcs  (UwU)
       sad   → downward arcs + heavy brows
       neutral → simple oval dots                                      */
  const eyeLeft = isSad
    ? <path d="M 68 108 Q 80 120 92 108" stroke="#4c1d95" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 68 110 Q 80 98 92 110" stroke="#4c1d95" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="80" cy="108" rx="8" ry="9" fill="#4c1d95" />

  const eyeRight = isSad
    ? <path d="M 108 108 Q 120 120 132 108" stroke="#4c1d95" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 108 110 Q 120 98 132 110" stroke="#4c1d95" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="120" cy="108" rx="8" ry="9" fill="#4c1d95" />

  /* Shine dots on eyes for happy/neutral */
  const shineLeft  = !isSad && <circle cx="84" cy="104" r="2.5" fill="white" opacity="0.8" />
  const shineRight = !isSad && <circle cx="124" cy="104" r="2.5" fill="white" opacity="0.8" />

  /* ── Brows (sad only) ── */
  const browLeft  = isSad && <path d="M 66 98 Q 79 92 91 98" stroke="#6d28d9" strokeWidth="3.5" strokeLinecap="round" fill="none" />
  const browRight = isSad && <path d="M 109 98 Q 121 92 134 98" stroke="#6d28d9" strokeWidth="3.5" strokeLinecap="round" fill="none" />

  /* ── Mouth ── */
  const mouth = isSad
    ? <path d="M 86 140 Q 100 130 114 140" stroke="#6d28d9" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 84 134 Q 100 150 116 134" stroke="#6d28d9" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      : <path d="M 88 138 Q 100 144 112 138" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" fill="none" />

  /* ── Extra: sweat drop when sad ── */
  const sweatDrop = isSad && (
    <g>
      <ellipse cx="145" cy="82" rx="5" ry="7" fill="#93c5fd" opacity="0.85" />
      <ellipse cx="145" cy="76" rx="3" ry="4" fill="#93c5fd" opacity="0.85" />
    </g>
  )

  /* ── Extra: sparkles when happy ── */
  const sparkles = isHappy && (
    <g fill="#fbbf24" opacity="0.9">
      <text x="30"  y="68" fontSize="14">✦</text>
      <text x="156" y="72" fontSize="11">✦</text>
      <text x="150" y="50" fontSize="9">✦</text>
    </g>
  )

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xl"
      aria-label="pixel pet"
    >
      <defs>
        <radialGradient id="bodyGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={bodyGrad1} />
          <stop offset="100%" stopColor={bodyGrad2} />
        </radialGradient>
        <radialGradient id="hornGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
        <radialGradient id="earGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>

      {sparkles}

      {/* ── Tail ── */}
      <ellipse cx="162" cy="162" rx="18" ry="11" fill="url(#bodyGrad)" transform="rotate(-30 162 162)" />

      {/* ── Left ear ── */}
      <ellipse cx="62" cy="64" rx="20" ry="26" fill="url(#earGrad)" transform="rotate(-15 62 64)" />
      <ellipse cx="62" cy="64" rx="11" ry="16" fill="#fce7f3" transform="rotate(-15 62 64)" />

      {/* ── Right ear ── */}
      <ellipse cx="138" cy="64" rx="20" ry="26" fill="url(#earGrad)" transform="rotate(15 138 64)" />
      <ellipse cx="138" cy="64" rx="11" ry="16" fill="#fce7f3" transform="rotate(15 138 64)" />

      {/* ── Body ── */}
      <circle cx="100" cy="118" r="72" fill="url(#bodyGrad)" />

      {/* ── Belly patch ── */}
      <ellipse cx="100" cy="132" rx="36" ry="28" fill="white" opacity="0.25" />

      {/* ── Cheeks ── */}
      <ellipse cx="72"  cy="128" rx="16" ry="10" fill="#f9a8d4" opacity="0.55" />
      <ellipse cx="128" cy="128" rx="16" ry="10" fill="#f9a8d4" opacity="0.55" />

      {/* ── Brows ── */}
      {browLeft}
      {browRight}

      {/* ── Eyes ── */}
      {eyeLeft}
      {eyeRight}
      {shineLeft}
      {shineRight}

      {/* ── Mouth ── */}
      {mouth}

      {/* ── Sweat drop ── */}
      {sweatDrop}

      {/* ── Tiny paws ── */}
      <ellipse cx="50"  cy="168" rx="20" ry="13" fill="url(#bodyGrad)" />
      <ellipse cx="150" cy="168" rx="20" ry="13" fill="url(#bodyGrad)" />
      <circle cx="43"  cy="165" r="5"  fill="#f9a8d4" opacity="0.6" />
      <circle cx="50"  cy="162" r="5"  fill="#f9a8d4" opacity="0.6" />
      <circle cx="57"  cy="165" r="5"  fill="#f9a8d4" opacity="0.6" />
      <circle cx="143" cy="165" r="5"  fill="#f9a8d4" opacity="0.6" />
      <circle cx="150" cy="162" r="5"  fill="#f9a8d4" opacity="0.6" />
      <circle cx="157" cy="165" r="5"  fill="#f9a8d4" opacity="0.6" />
    </svg>
  )
}
