import { useState, useEffect, useCallback, useRef } from 'react'
import AdoptionCenter from './AdoptionCenter'
import PetCat   from './PetCat'
import PetDino  from './PetDino'
import PetSlime from './PetSlime'

/* global injected by vite.config.js define */
/* eslint-disable no-undef */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.0'

const DECAY_INTERVAL   = 3000
const DECAY_AMOUNT     = 2
const FEED_AMOUNT      = 15
const PLAY_AMOUNT      = 15
const MAX_STAT         = 100
const SAD_THRESHOLD    = 30
const COIN_PER_CLICK   = 5
const GAME_DURATION    = 10      // seconds
const GAME_JUMP_MS     = 1400   // how often pet teleports
const SAVE_KEY         = 'pixelPetSave_v12'

const SHOP_ITEMS = [
  { id: 'partyHat',    label: 'Party Hat',    cost: 50,  icon: '🎉' },
  { id: 'goldenCrown', label: 'Golden Crown', cost: 150, icon: '👑' },
]

const PET_COMPONENTS = { cat: PetCat, dino: PetDino, slime: PetSlime }

/* ── Persistence ── */
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)) } catch {}
}

/* ── Helpers ── */
function clamp(val, min = 0, max = MAX_STAT) {
  return Math.min(max, Math.max(min, val))
}

function getMood(hunger, happiness) {
  const avg = (hunger + happiness) / 2
  if (avg >= 60) return 'happy'
  if (avg < SAD_THRESHOLD) return 'sad'
  return 'neutral'
}

function randomPos() {
  // Percentage positions within the game overlay (leaving room for the pet sprite)
  return { x: 8 + Math.random() * 65, y: 12 + Math.random() * 55 }
}

/* ── Web Audio helpers ── */
function createAudioCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)() } catch { return null }
}

function playBlip(ctx) {
  if (!ctx) return
  const osc = ctx.createOscillator(), gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.18, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.18)
}

function playBloop(ctx) {
  if (!ctx) return
  const osc = ctx.createOscillator(), gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(0.18, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22)
}

function playChaChing(ctx) {
  if (!ctx) return
  const t = ctx.currentTime
  // Beep 1 — short high note
  const o1 = ctx.createOscillator(), g1 = ctx.createGain()
  o1.connect(g1); g1.connect(ctx.destination)
  o1.type = 'square'
  o1.frequency.setValueAtTime(880, t)
  g1.gain.setValueAtTime(0.14, t)
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.10)
  o1.start(t); o1.stop(t + 0.10)
  // Beep 2 — higher, slightly delayed
  const o2 = ctx.createOscillator(), g2 = ctx.createGain()
  o2.connect(g2); g2.connect(ctx.destination)
  o2.type = 'square'
  o2.frequency.setValueAtTime(1320, t + 0.13)
  g2.gain.setValueAtTime(0.14, t + 0.13)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
  o2.start(t + 0.13); o2.stop(t + 0.24)
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

/* ── Pet with accessory overlay ── */
function PetWithAccessory({ PetComponent, mood, accessories, size = 'lg' }) {
  // Crown takes visual priority over hat
  const badge = accessories.includes('goldenCrown')
    ? '👑'
    : accessories.includes('partyHat')
      ? '🎉'
      : null

  const emojiSize = size === 'sm' ? 'text-xl -top-3' : 'text-3xl -top-5'

  return (
    <div className="relative w-full h-full">
      {badge && (
        <div className={`absolute left-1/2 -translate-x-1/2 ${emojiSize} pointer-events-none z-10 select-none`}>
          {badge}
        </div>
      )}
      <PetComponent mood={mood} />
    </div>
  )
}

/* ── Shop overlay ── */
function Shop({ coins, accessories, onBuy, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-yellow-50 via-amber-50 to-orange-50 border-4 border-yellow-400 rounded-3xl shadow-2xl w-full max-w-xs flex flex-col items-center gap-5 p-6">
        <h2 className="font-pixel text-yellow-700 text-sm text-center">🛍️ The Boutique</h2>
        <p className="font-pixel text-yellow-600 text-[9px]">💰 {coins} coins</p>

        <div className="w-full flex flex-col gap-3">
          {SHOP_ITEMS.map(item => {
            const owned   = accessories.includes(item.id)
            const canBuy  = !owned && coins >= item.cost
            return (
              <div key={item.id} className="flex items-center gap-3 bg-white/60 rounded-2xl px-4 py-3 border-2 border-yellow-200">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-pixel text-[9px] text-yellow-800">{item.label}</p>
                  <p className="font-pixel text-[8px] text-yellow-500">💰 {item.cost} coins</p>
                </div>
                {owned ? (
                  <span className="font-pixel text-[8px] text-green-600 bg-green-100 rounded-xl px-2 py-1">Owned!</span>
                ) : (
                  <button
                    onClick={() => onBuy(item)}
                    disabled={!canBuy}
                    className="font-pixel text-[8px] text-white rounded-xl px-3 py-1 shadow transition-all active:scale-95 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: canBuy ? 'linear-gradient(135deg, #f59e0b, #f97316)' : '#d1d5db' }}
                  >
                    Buy
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="font-pixel text-xs text-purple-600 underline underline-offset-2 hover:text-purple-800 transition-colors"
        >
          Close ✕
        </button>
      </div>
    </div>
  )
}

/* ── Mini-Game overlay ── */
function MiniGame({ petName, PetComponent, accessories, onEnd }) {
  const [petPos,      setPetPos]      = useState(randomPos)
  const [timeLeft,    setTimeLeft]    = useState(GAME_DURATION)
  const [earned,      setEarned]      = useState(0)
  const [clickFlash,  setClickFlash]  = useState(false)
  const audioCtxRef = useRef(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) { onEnd(earned); return }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, earned, onEnd])

  // Pet jump interval
  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setInterval(() => setPetPos(randomPos()), GAME_JUMP_MS)
    return () => clearInterval(id)
  }, [timeLeft])

  function handleCatch() {
    if (timeLeft <= 0) return
    playChaChing(getAudioCtx())
    setEarned(e => e + COIN_PER_CLICK)
    setClickFlash(true)
    setTimeout(() => setClickFlash(false), 300)
  }

  const pct = (timeLeft / GAME_DURATION) * 100

  return (
    <div className="fixed inset-0 bg-indigo-950/85 z-50 overflow-hidden select-none">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 gap-3">
        <div className="font-pixel text-yellow-300 text-xs">💰 +{earned}</div>
        {/* Timer bar */}
        <div className="flex-1 h-3 rounded-full bg-indigo-800 overflow-hidden border border-indigo-600">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: pct > 40 ? 'linear-gradient(90deg,#6ee7b7,#34d399)' : 'linear-gradient(90deg,#fbbf24,#f87171)',
            }}
          />
        </div>
        <div className="font-pixel text-indigo-200 text-xs">{timeLeft}s</div>
      </div>

      <p className="absolute top-10 left-0 right-0 font-pixel text-indigo-300 text-[9px] text-center">
        Catch {petName}!
      </p>

      {/* Jumping pet */}
      <div
        className="absolute w-24 h-24 cursor-pointer"
        style={{
          left: `${petPos.x}%`,
          top:  `${petPos.y}%`,
          transition: 'left 0.35s cubic-bezier(.34,1.56,.64,1), top 0.35s cubic-bezier(.34,1.56,.64,1)',
        }}
        onClick={handleCatch}
      >
        <div className={`relative w-full h-full ${clickFlash ? 'opacity-50 scale-90' : ''} transition-all duration-150`}>
          <PetWithAccessory PetComponent={PetComponent} mood="happy" accessories={accessories} size="sm" />
        </div>
      </div>

      {/* Coin flash */}
      {clickFlash && (
        <div
          className="absolute font-pixel text-yellow-300 text-sm pointer-events-none animate-bounce"
          style={{ left: `${petPos.x + 5}%`, top: `${petPos.y - 5}%` }}
        >
          +{COIN_PER_CLICK}💰
        </div>
      )}
    </div>
  )
}

/* ── Main game ── */
function Game({ petName, animal, theme, initialCoins, initialAccessories, onSave }) {
  const [hunger,      setHunger]      = useState(100)
  const [happiness,   setHappiness]   = useState(100)
  const [coins,       setCoins]       = useState(initialCoins)
  const [accessories, setAccessories] = useState(initialAccessories)
  const [feedAnim,    setFeedAnim]    = useState(false)
  const [playAnim,    setPlayAnim]    = useState(false)
  const [petAnim,     setPetAnim]     = useState('bounce2')
  const [sleeping,    setSleeping]    = useState(false)
  const [nameWiggle,  setNameWiggle]  = useState(false)
  const [shopOpen,    setShopOpen]    = useState(false)
  const [gameActive,  setGameActive]  = useState(false)
  const [gameResult,  setGameResult]  = useState(null) // null | number

  const audioCtxRef = useRef(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const mood = getMood(hunger, happiness)
  const PetComponent = PET_COMPONENTS[animal] ?? PetCat

  // Persist coins & accessories whenever they change
  useEffect(() => {
    onSave({ coins, accessories })
  }, [coins, accessories]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (mood === 'sad') setPetAnim('pulse2')
    else                setPetAnim('bounce2')
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

  const handleBuy = useCallback((item) => {
    if (accessories.includes(item.id) || coins < item.cost) return
    playChaChing(getAudioCtx())
    setCoins(c => c - item.cost)
    setAccessories(a => [...a, item.id])
  }, [accessories, coins])

  const handleGameEnd = useCallback((earned) => {
    setGameActive(false)
    if (earned > 0) {
      playChaChing(getAudioCtx())
      setCoins(c => c + earned)
    }
    setGameResult(earned)
    setTimeout(() => setGameResult(null), 2500)
  }, [])

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

        {/* Coin badge — top-right corner */}
        <div className="absolute top-4 right-10 font-pixel text-[9px] text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-xl px-2 py-0.5 shadow-sm select-none">
          💰 {coins}
        </div>

        {/* Pet name */}
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
          <PetWithAccessory PetComponent={PetComponent} mood={sleeping ? 'neutral' : mood} accessories={accessories} />
          {sleeping && <ZzzParticles />}
        </div>

        {/* Game-end result toast */}
        {gameResult !== null && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 font-pixel text-yellow-700 bg-yellow-100 border-2 border-yellow-400 rounded-2xl px-5 py-3 shadow-xl text-xs text-center animate-bounce">
            🎉 +{gameResult} coins!
          </div>
        )}

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

        {/* Primary action buttons */}
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

        {/* Secondary buttons — mini-game & shop */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => { if (!sleeping) setGameActive(true) }}
            disabled={sleeping}
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-pixel text-xs text-white shadow-lg transition-all duration-150 active:scale-95 hover:scale-105 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            <span className="text-2xl">🎮</span>
            <span>Mini-Game</span>
          </button>
          <button
            onClick={() => setShopOpen(true)}
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-pixel text-xs text-white shadow-lg transition-all duration-150 active:scale-95 hover:scale-105 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
          >
            <span className="text-2xl">🛍️</span>
            <span>Shop</span>
          </button>
        </div>

        {/* Corner decorations */}
        <span className="absolute top-4 left-4  text-pink-300 text-lg select-none">✦</span>
        <span className="absolute bottom-8 left-4  text-pink-300 text-sm select-none opacity-60">✦</span>
        <span className="absolute bottom-8 right-4 text-purple-300 text-sm select-none opacity-60">✦</span>

        {/* Footer version */}
        <p className="font-pixel text-[8px] text-gray-400 select-none mt-1">
          Version {APP_VERSION}
        </p>
      </div>

      {/* Shop overlay */}
      {shopOpen && (
        <Shop
          coins={coins}
          accessories={accessories}
          onBuy={handleBuy}
          onClose={() => setShopOpen(false)}
        />
      )}

      {/* Mini-game overlay */}
      {gameActive && (
        <MiniGame
          petName={petName}
          PetComponent={PetComponent}
          accessories={accessories}
          onEnd={handleGameEnd}
        />
      )}
    </div>
  )
}

/* ── Root: adoption gate + persistence ── */
export default function App() {
  const [pet, setPet] = useState(() => loadSave())

  function handleAdopt(petData) {
    const full = { ...petData, coins: 0, accessories: [] }
    writeSave(full)
    setPet(full)
  }

  function handleSave(updates) {
    setPet(prev => {
      const next = { ...prev, ...updates }
      writeSave(next)
      return next
    })
  }

  if (!pet) {
    return <AdoptionCenter onAdopt={handleAdopt} />
  }

  return (
    <Game
      petName={pet.name}
      animal={pet.animal}
      theme={pet.theme}
      initialCoins={pet.coins ?? 0}
      initialAccessories={pet.accessories ?? []}
      onSave={handleSave}
    />
  )
}
