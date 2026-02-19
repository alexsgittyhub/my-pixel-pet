import { useState, useEffect, useCallback } from 'react'
import PixelPet from './PixelPet'

const DECAY_INTERVAL = 3000 // ms between stat decay ticks
const DECAY_AMOUNT   = 2    // points lost per tick
const FEED_AMOUNT    = 15
const PLAY_AMOUNT    = 15
const MAX_STAT       = 100
const SAD_THRESHOLD  = 30

function clamp(val, min = 0, max = MAX_STAT) {
  return Math.min(max, Math.max(min, val))
}

function getMood(hunger, happiness) {
  const avg = (hunger + happiness) / 2
  if (avg >= 60) return 'happy'
  if (avg < SAD_THRESHOLD) return 'sad'
  return 'neutral'
}

function StatBar({ label, value, color, icon }) {
  const pct    = Math.round(value)
  const isCrit = value < SAD_THRESHOLD

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-xs font-pixel text-purple-700">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span className={`text-xs font-pixel font-bold ${isCrit ? 'text-red-500 animate-pulse' : 'text-purple-600'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-4 w-full rounded-full bg-purple-100 border-2 border-purple-200 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isCrit ? 'animate-pulse2' : ''}`}
          style={{
            width: `${pct}%`,
            background: isCrit
              ? 'linear-gradient(90deg, #f87171, #fb923c)'
              : `linear-gradient(90deg, ${color[0]}, ${color[1]})`,
          }}
        />
      </div>
    </div>
  )
}

function ActionButton({ onClick, label, icon, gradient, disabled, animClass }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center gap-1 px-6 py-3 rounded-2xl
        font-pixel text-xs text-white shadow-lg
        transition-all duration-150
        active:scale-95 hover:scale-105 hover:shadow-xl
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        ${animClass ?? ''}
      `}
      style={{ background: gradient }}
    >
      <span className="text-2xl">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default function App() {
  const [hunger,    setHunger]    = useState(100)
  const [happiness, setHappiness] = useState(100)
  const [feedAnim,  setFeedAnim]  = useState(false)
  const [playAnim,  setPlayAnim]  = useState(false)
  const [petAnim,   setPetAnim]   = useState('bounce2') // 'bounce2' | 'wiggle' | 'pulse2'

  const mood = getMood(hunger, happiness)

  /* ── Passive stat decay ── */
  useEffect(() => {
    const id = setInterval(() => {
      setHunger(h    => clamp(h    - DECAY_AMOUNT))
      setHappiness(p => clamp(p - DECAY_AMOUNT))
    }, DECAY_INTERVAL)
    return () => clearInterval(id)
  }, [])

  /* ── Update pet animation based on mood ── */
  useEffect(() => {
    if (mood === 'sad')    setPetAnim('pulse2')
    if (mood === 'happy')  setPetAnim('bounce2')
    if (mood === 'neutral') setPetAnim('bounce2')
  }, [mood])

  const handleFeed = useCallback(() => {
    if (hunger >= MAX_STAT) return
    setHunger(h => clamp(h + FEED_AMOUNT))
    setFeedAnim(true)
    setPetAnim('wiggle')
    setTimeout(() => {
      setFeedAnim(false)
      setPetAnim(mood === 'sad' ? 'pulse2' : 'bounce2')
    }, 1200)
  }, [hunger, mood])

  const handlePlay = useCallback(() => {
    if (happiness >= MAX_STAT) return
    setHappiness(p => clamp(p + PLAY_AMOUNT))
    setPlayAnim(true)
    setPetAnim('wiggle')
    setTimeout(() => {
      setPlayAnim(false)
      setPetAnim(mood === 'sad' ? 'pulse2' : 'bounce2')
    }, 1200)
  }, [happiness, mood])

  const moodLabel = {
    happy:   '(≧◡≦) Yay!',
    neutral: '(•ᴗ•)  Okay…',
    sad:     '(╥﹏╥) Please care for me!',
  }[mood]

  const bgCard = mood === 'sad'
    ? 'from-indigo-100 via-purple-100 to-blue-100'
    : mood === 'happy'
      ? 'from-pink-100 via-fuchsia-100 to-violet-100'
      : 'from-rose-100 via-purple-100 to-cyan-100'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className={`
          relative w-full max-w-sm rounded-3xl
          bg-gradient-to-b ${bgCard}
          border-4 border-purple-300 shadow-2xl
          flex flex-col items-center gap-6 p-6
          transition-all duration-700
        `}
      >
        {/* ── Title ── */}
        <h1 className="font-pixel text-purple-600 text-base tracking-tight text-center">
          ✦ My Pixel Pet ✦
        </h1>

        {/* ── Pet Stage ── */}
        <div
          className={`relative w-52 h-52 animate-${petAnim}`}
          style={{ animationDuration: mood === 'sad' ? '2.5s' : '1s' }}
        >
          <PixelPet mood={mood} />
        </div>

        {/* ── Mood label ── */}
        <p
          className={`font-pixel text-xs text-center transition-colors duration-500 ${
            mood === 'sad'   ? 'text-indigo-400' :
            mood === 'happy' ? 'text-pink-500'   : 'text-purple-500'
          }`}
        >
          {moodLabel}
        </p>

        {/* ── Status bars ── */}
        <div className="w-full flex flex-col gap-3 px-2">
          <StatBar
            label="Hunger"
            value={hunger}
            icon="🍓"
            color={['#f472b6', '#fb7185']}
          />
          <StatBar
            label="Happiness"
            value={happiness}
            icon="⭐"
            color={['#c084fc', '#818cf8']}
          />
        </div>

        {/* ── Buttons ── */}
        <div className="flex gap-4">
          <ActionButton
            onClick={handleFeed}
            label="Feed"
            icon="🍓"
            gradient="linear-gradient(135deg, #f472b6, #fb7185)"
            disabled={hunger >= MAX_STAT}
            animClass={feedAnim ? 'ring-4 ring-pink-300' : ''}
          />
          <ActionButton
            onClick={handlePlay}
            label="Play"
            icon="⭐"
            gradient="linear-gradient(135deg, #c084fc, #818cf8)"
            disabled={happiness >= MAX_STAT}
            animClass={playAnim ? 'ring-4 ring-purple-300' : ''}
          />
        </div>

        {/* ── Decorative corner stars ── */}
        <span className="absolute top-4 left-4  text-pink-300 text-lg select-none">✦</span>
        <span className="absolute top-4 right-4 text-purple-300 text-lg select-none">✦</span>
        <span className="absolute bottom-4 left-4  text-mint-300 text-sm select-none opacity-60">✦</span>
        <span className="absolute bottom-4 right-4 text-pink-300 text-sm select-none opacity-60">✦</span>
      </div>
    </div>
  )
}
