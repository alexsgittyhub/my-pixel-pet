import { useState, useEffect, useCallback, useRef } from 'react'
import AdoptionCenter from './AdoptionCenter'
import PetCat   from './PetCat'
import PetDino  from './PetDino'
import PetSlime from './PetSlime'

/* global injected by vite.config.js define */
/* eslint-disable no-undef */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0'

const DECAY_INTERVAL = 3000
const DECAY_AMOUNT   = 2
const FEED_AMOUNT    = 15
const PLAY_AMOUNT    = 15
const MAX_STAT       = 100
const SAD_THRESHOLD  = 30

const PET_COMPONENTS = { cat: PetCat, dino: PetDino, slime: PetSlime }

function clamp(val, min = 0, max = MAX_STAT) {
  return Math.min(max, Math.max(min, val))
}

function getMood(hunger, happiness) {
  const avg = (hunger + happiness) / 2
  if (avg >= 60) return 'happy'
  if (avg < SAD_THRESHOLD) return 'sad'
  return 'neutral'
}

/* ── Web Audio helpers ── */
function createAudioCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)()
  } catch { return null }
}

function playBlip(ctx) {
  if (!ctx) return
  // cute high blip — feeding
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.18, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.18)
}

function playBloop(ctx) {
  if (!ctx) return
  // lower bloop — playing
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(0.18, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.22)
}

/* ── Sub-components ── */
function StatBar({ label, value, color, icon }) {
  const pct    = Math.round(value)
  const isCrit = value < SAD_THRESHOLD
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-xs font-pixel text-purple-700">
          <span>{icon}</span><span>{label}</span>
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

/* ── Zzz particle ── */
function ZzzParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
      {['top-2 right-6 text-base', 'top-6 right-2 text-xs opacity-70', '-top-1 right-10 text-xs opacity-50'].map((cls, i) => (
        <span
          key={i}
          className={`absolute font-pixel text-indigo-400 select-none animate-bounce2 ${cls}`}
          style={{ animationDelay: `${i * 0.3}s`, animationDuration: '1.8s' }}
        >
          z
        </span>
      ))}
    </div>
  )
}

/* ── Main game ── */
function Game({ petName, animal, theme }) {
  const [hunger,    setHunger]    = useState(100)
  const [happiness, setHappiness] = useState(100)
  const [feedAnim,  setFeedAnim]  = useState(false)
  const [playAnim,  setPlayAnim]  = useState(false)
  const [petAnim,   setPetAnim]   = useState('bounce2')
  const [sleeping,  setSleeping]  = useState(false)
  const [nameWiggle, setNameWiggle] = useState(false)

  const audioCtxRef = useRef(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
    // Resume if suspended (browser autoplay policy)
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const mood = getMood(hunger, happiness)
  const PetComponent = PET_COMPONENTS[animal] ?? PetCat

  /* Passive decay — paused while sleeping */
  useEffect(() => {
    if (sleeping) return
    const id = setInterval(() => {
      setHunger(h => clamp(h - DECAY_AMOUNT))
      setHappiness(p => clamp(p - DECAY_AMOUNT))
    }, DECAY_INTERVAL)
    return () => clearInterval(id)
  }, [sleeping])

  /* Sync pet idle animation with mood */
  useEffect(() => {
    if (mood === 'sad')    setPetAnim('pulse2')
    else                   setPetAnim('bounce2')
  }, [mood])

  const handleFeed = useCallback(() => {
    if (hunger >= MAX_STAT || sleeping) return
    playBlip(getAudioCtx())
    setHunger(h => clamp(h + FEED_AMOUNT))
    setFeedAnim(true)
    setPetAnim('wiggle')
    setTimeout(() => {
      setFeedAnim(false)
      setPetAnim(mood === 'sad' ? 'pulse2' : 'bounce2')
    }, 1200)
  }, [hunger, mood, sleeping])

  const handlePlay = useCallback(() => {
    if (happiness >= MAX_STAT || sleeping) return
    playBloop(getAudioCtx())
    setHappiness(p => clamp(p + PLAY_AMOUNT))
    setPlayAnim(true)
    setPetAnim('wiggle')
    setTimeout(() => {
      setPlayAnim(false)
      setPetAnim(mood === 'sad' ? 'pulse2' : 'bounce2')
    }, 1200)
  }, [happiness, mood, sleeping])

  const handleNameClick = useCallback(() => {
    if (nameWiggle) return
    setNameWiggle(true)
    setTimeout(() => setNameWiggle(false), 700)
  }, [nameWiggle])

  const moodLabel = {
    happy:   '(≧◡≦) Yay!',
    neutral: '(•ᴗ•)  Okay…',
    sad:     '(╥﹏╥) Please care for me!',
  }[mood]

  const bgCard = sleeping
    ? 'from-indigo-200 via-blue-200 to-slate-200'
    : mood === 'sad'
      ? 'from-indigo-100 via-purple-100 to-blue-100'
      : mood === 'happy'
        ? theme?.bg ?? 'from-pink-100 via-fuchsia-100 to-violet-100'
        : 'from-rose-100 via-purple-100 to-cyan-100'

  const borderColor = theme?.border ?? 'border-purple-300'

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${sleeping ? 'bg-indigo-950/30' : ''}`}>
      <div className={`
        relative w-full max-w-sm rounded-3xl
        bg-gradient-to-b ${bgCard}
        border-4 ${borderColor} shadow-2xl
        flex flex-col items-center gap-6 p-6
        transition-all duration-700
        ${sleeping ? 'opacity-80' : ''}
      `}>
        {/* Title */}
        <h1 className="font-pixel text-purple-600 text-base tracking-tight text-center">
          ✦ My Pixel Pet ✦
        </h1>

        {/* Pet name — wiggle on click */}
        <p
          onClick={handleNameClick}
          className={`
            font-pixel text-sm text-purple-700 cursor-pointer select-none
            transition-transform
            ${nameWiggle ? 'animate-wiggle' : ''}
          `}
          title="Click me!"
        >
          {petName}
        </p>

        {/* Pet stage */}
        <div
          className={`relative w-52 h-52 animate-${sleeping ? 'pulse2' : petAnim}`}
          style={{ animationDuration: sleeping ? '3s' : mood === 'sad' ? '2.5s' : '1s' }}
        >
          <PetComponent mood={sleeping ? 'neutral' : mood} />
          {sleeping && <ZzzParticles />}
        </div>

        {/* Mood label */}
        {!sleeping && (
          <p className={`font-pixel text-xs text-center transition-colors duration-500 ${
            mood === 'sad'   ? 'text-indigo-400' :
            mood === 'happy' ? 'text-pink-500'   : 'text-purple-500'
          }`}>
            {moodLabel}
          </p>
        )}
        {sleeping && (
          <p className="font-pixel text-xs text-indigo-400 text-center">
            ( ˘ω˘ ) Sleeping…
          </p>
        )}

        {/* Stat bars */}
        <div className="w-full flex flex-col gap-3 px-2">
          <StatBar label="Hunger"    value={hunger}    icon="🍓" color={['#f472b6', '#fb7185']} />
          <StatBar label="Happiness" value={happiness} icon="⭐" color={['#c084fc', '#818cf8']} />
        </div>

        {/* Buttons row */}
        <div className="flex gap-3 flex-wrap justify-center">
          <ActionButton
            onClick={handleFeed}
            label="Feed"
            icon="🍓"
            gradient="linear-gradient(135deg, #f472b6, #fb7185)"
            disabled={hunger >= MAX_STAT || sleeping}
            animClass={feedAnim ? 'ring-4 ring-pink-300' : ''}
          />
          <ActionButton
            onClick={handlePlay}
            label="Play"
            icon="⭐"
            gradient="linear-gradient(135deg, #c084fc, #818cf8)"
            disabled={happiness >= MAX_STAT || sleeping}
            animClass={playAnim ? 'ring-4 ring-purple-300' : ''}
          />
          {/* Sleep toggle */}
          <button
            onClick={() => setSleeping(s => !s)}
            className={`
              flex flex-col items-center gap-1 px-4 py-3 rounded-2xl
              font-pixel text-xs shadow-lg transition-all duration-150
              active:scale-95 hover:scale-105 hover:shadow-xl
              ${sleeping
                ? 'bg-indigo-200 text-indigo-700 ring-4 ring-indigo-300'
                : 'bg-slate-200 text-slate-600'}
            `}
          >
            <span className="text-2xl">{sleeping ? '☀️' : '🌙'}</span>
            <span>{sleeping ? 'Wake' : 'Sleep'}</span>
          </button>
        </div>

        {/* Corner decorations */}
        <span className="absolute top-4 left-4  text-pink-300 text-lg select-none">✦</span>
        <span className="absolute top-4 right-4 text-purple-300 text-lg select-none">✦</span>
        <span className="absolute bottom-8 left-4  text-pink-300 text-sm select-none opacity-60">✦</span>
        <span className="absolute bottom-8 right-4 text-purple-300 text-sm select-none opacity-60">✦</span>

        {/* Footer version */}
        <p className="font-pixel text-[8px] text-gray-400 select-none mt-1">
          Version {APP_VERSION}
        </p>
      </div>
    </div>
  )
}

/* ── Root: adoption gate ── */
export default function App() {
  const [pet, setPet] = useState(null)   // null = show adoption center

  if (!pet) {
    return <AdoptionCenter onAdopt={setPet} />
  }

  return <Game petName={pet.name} animal={pet.animal} theme={pet.theme} />
}
