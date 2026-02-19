export default function PetDino({ mood }) {
  const isSad   = mood === 'sad'
  const isHappy = mood === 'happy'

  const bodyColor  = isHappy ? '#4ade80' : isSad ? '#6ee7b7' : '#34d399'
  const spineColor = isHappy ? '#f472b6' : isSad ? '#a78bfa' : '#fb923c'

  const eyeLeft = isSad
    ? <path d="M 72 105 Q 82 117 92 105" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 72 108 Q 82 96 92 108" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="82" cy="106" rx="8" ry="9" fill="#064e3b" />

  const eyeRight = isSad
    ? <path d="M 108 105 Q 118 117 128 105" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 108 108 Q 118 96 128 108" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
      : <ellipse cx="118" cy="106" rx="8" ry="9" fill="#064e3b" />

  const shineLeft  = !isSad && <circle cx="86" cy="102" r="2.5" fill="white" opacity="0.8" />
  const shineRight = !isSad && <circle cx="122" cy="102" r="2.5" fill="white" opacity="0.8" />

  const mouth = isSad
    ? <path d="M 88 138 Q 100 128 112 138" stroke="#064e3b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    : isHappy
      ? <path d="M 86 132 Q 100 148 114 132" stroke="#064e3b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      : <path d="M 90 136 Q 100 142 110 136" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" fill="none" />

  const sparkles = isHappy && (
    <g fill="#fbbf24" opacity="0.9">
      <text x="28"  y="66" fontSize="14">✦</text>
      <text x="155" y="70" fontSize="11">✦</text>
    </g>
  )
  const sweatDrop = isSad && (
    <g>
      <ellipse cx="143" cy="80" rx="5" ry="7" fill="#93c5fd" opacity="0.85" />
      <ellipse cx="143" cy="74" rx="3" ry="4" fill="#93c5fd" opacity="0.85" />
    </g>
  )

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xl" aria-label="dino pet">
      <defs>
        <radialGradient id="dinoBodyGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={bodyColor} />
          <stop offset="100%" stopColor="#059669" />
        </radialGradient>
      </defs>
      {sparkles}
      {/* Tail */}
      <ellipse cx="158" cy="160" rx="22" ry="10" fill="url(#dinoBodyGrad)" transform="rotate(-25 158 160)" />
      <ellipse cx="172" cy="172" rx="12" ry="7"  fill="url(#dinoBodyGrad)" transform="rotate(-20 172 172)" />
      {/* Spine spikes */}
      {[60,74,88,102,116].map((x, i) => (
        <polygon key={i}
          points={`${x},${52 - i*2} ${x-7},${72} ${x+7},${72}`}
          fill={spineColor} opacity="0.9" />
      ))}
      {/* Body */}
      <circle cx="100" cy="120" r="68" fill="url(#dinoBodyGrad)" />
      {/* Belly */}
      <ellipse cx="100" cy="134" rx="38" ry="30" fill="#a7f3d0" opacity="0.45" />
      {/* Cheeks */}
      <ellipse cx="74"  cy="126" rx="15" ry="9" fill="#86efac" opacity="0.65" />
      <ellipse cx="126" cy="126" rx="15" ry="9" fill="#86efac" opacity="0.65" />
      {eyeLeft}{eyeRight}
      {shineLeft}{shineRight}
      {mouth}
      {sweatDrop}
      {/* Stubby legs */}
      <ellipse cx="60"  cy="172" rx="18" ry="12" fill="url(#dinoBodyGrad)" />
      <ellipse cx="140" cy="172" rx="18" ry="12" fill="url(#dinoBodyGrad)" />
      {/* Toe dots */}
      <circle cx="52"  cy="170" r="4" fill="#a7f3d0" opacity="0.7" />
      <circle cx="60"  cy="167" r="4" fill="#a7f3d0" opacity="0.7" />
      <circle cx="68"  cy="170" r="4" fill="#a7f3d0" opacity="0.7" />
      <circle cx="132" cy="170" r="4" fill="#a7f3d0" opacity="0.7" />
      <circle cx="140" cy="167" r="4" fill="#a7f3d0" opacity="0.7" />
      <circle cx="148" cy="170" r="4" fill="#a7f3d0" opacity="0.7" />
    </svg>
  )
}
