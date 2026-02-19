import { useState, useEffect, useCallback, useRef } from 'react'
import AdoptionCenter from './AdoptionCenter'
import PetCat   from './PetCat'
import PetDino  from './PetDino'
import PetSlime from './PetSlime'

/* global injected by vite.config.js define */
/* eslint-disable no-undef */
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.3.0'

/* ── Constants ── */
const DECAY_INTERVAL      = 3000
const DECAY_AMOUNT        = 2
const FEED_AMOUNT         = 15
const PLAY_AMOUNT         = 15
const MAX_STAT            = 100
const SAD_THRESHOLD       = 30
const COIN_PER_CLICK      = 5
const GAME_DURATION       = 10
const GAME_JUMP_MS        = 1400
const SAVE_KEY            = 'pixelPetSave_v13'
const EXPEDITION_DURATION = 10   // seconds
const MORALE_COST         = 20   // happiness cost to launch

const BIOMES = [
  { id: 'crystalCaves', name: 'Crystal Caves', icon: '💎', rate: 0.80, artifact: 'Crystal',  textColor: 'text-indigo-300',  borderColor: 'border-indigo-500'  },
  { id: 'neonJungle',   name: 'Neon Jungle',   icon: '🌿', rate: 0.50, artifact: 'Bio-Link', textColor: 'text-emerald-300', borderColor: 'border-emerald-500' },
  { id: 'theVoid',      name: 'The Void',       icon: '⚛️', rate: 0.20, artifact: 'Quark',   textColor: 'text-fuchsia-300', borderColor: 'border-fuchsia-500' },
]

// Timed log messages keyed by seconds-remaining during a mission
const MISSION_LOG_TIMED = {
  9: '● Entering zone...',
  7: '● Scanning perimeter...',
  5: '● Anomaly signature detected.',
  3: '● Bio-scanner calibrating...',
  1: '● Signal acquired.',
}

const SHOP_ITEMS = [
  { id: 'partyHat',    label: 'Party Hat',    cost: 50,  icon: '🎉' },
  { id: 'goldenCrown', label: 'Golden Crown', cost: 150, icon: '👑' },
]

const PET_COMPONENTS = { cat: PetCat, dino: PetDino, slime: PetSlime }

// Static map so Tailwind's content scanner can detect all animation classes
const ANIM_CLASS = {
  bounce2: 'animate-bounce2',
  pulse2:  'animate-pulse2',
  wiggle:  'animate-wiggle',
}

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
  const o1 = ctx.createOscillator(), g1 = ctx.createGain()
  o1.connect(g1); g1.connect(ctx.destination)
  o1.type = 'square'
  o1.frequency.setValueAtTime(880, t)
  g1.gain.setValueAtTime(0.14, t)
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.10)
  o1.start(t); o1.stop(t + 0.10)
  const o2 = ctx.createOscillator(), g2 = ctx.createGain()
  o2.connect(g2); g2.connect(ctx.destination)
  o2.type = 'square'
  o2.frequency.setValueAtTime(1320, t + 0.13)
  g2.gain.setValueAtTime(0.14, t + 0.13)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
  o2.start(t + 0.13); o2.stop(t + 0.24)
}

/* ── StatBar ── */
function StatBar({ label, value, color, icon }) {
  const pct    = Math.round(value)
  const isCrit = value < SAD_THRESHOLD
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-400">
          <span>{icon}</span><span>{label}</span>
        </span>
        <span className={`text-[10px] font-mono font-bold ${isCrit ? 'text-red-400 animate-pulse' : 'text-indigo-200'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-700 border border-slate-600 overflow-hidden">
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

/* ── ActionButton ── */
function ActionButton({ onClick, label, icon, gradient, disabled, animClass }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl
        font-mono text-[10px] text-white shadow-lg border border-white/10
        transition-all duration-150
        active:scale-95 hover:scale-105 hover:shadow-xl
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
        ${animClass ?? ''}
      `}
      style={{ background: gradient }}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

/* ── ZzzParticles ── */
function ZzzParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {['top-2 right-6 text-base', 'top-6 right-2 text-xs opacity-70', '-top-1 right-10 text-xs opacity-50'].map((cls, i) => (
        <span
          key={i}
          className={`absolute font-mono text-indigo-400 select-none animate-bounce2 ${cls}`}
          style={{ animationDelay: `${i * 0.3}s`, animationDuration: '1.8s' }}
        >
          z
        </span>
      ))}
    </div>
  )
}

/* ── PetWithAccessory ── */
function PetWithAccessory({ PetComponent, mood, accessories, size = 'lg', themeColor }) {
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
      <PetComponent mood={mood} themeColor={themeColor} />
    </div>
  )
}

/* ── Shop overlay ── */
function Shop({ coins, accessories, onBuy, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-indigo-500/50 rounded-2xl shadow-2xl w-full max-w-xs flex flex-col items-center gap-4 p-6">
        <h2 className="font-mono text-indigo-300 text-xs text-center tracking-widest">🛍 SUPPLY DEPOT</h2>
        <p className="font-mono text-yellow-400 text-[10px]">💰 {coins} credits</p>

        <div className="w-full flex flex-col gap-3">
          {SHOP_ITEMS.map(item => {
            const owned  = accessories.includes(item.id)
            const canBuy = !owned && coins >= item.cost
            return (
              <div key={item.id} className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-4 py-3 border border-slate-600">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-mono text-[10px] text-slate-200">{item.label}</p>
                  <p className="font-mono text-[9px] text-yellow-400">💰 {item.cost}</p>
                </div>
                {owned ? (
                  <span className="font-mono text-[9px] text-emerald-400 bg-emerald-900/30 rounded-lg px-2 py-1 border border-emerald-700/50">
                    OWNED
                  </span>
                ) : (
                  <button
                    onClick={() => onBuy(item)}
                    disabled={!canBuy}
                    className="font-mono text-[9px] text-white rounded-lg px-3 py-1 border border-indigo-500/60 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: canBuy ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#374151' }}
                  >
                    BUY
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="font-mono text-[10px] text-slate-500 hover:text-indigo-300 transition-colors"
        >
          [ CLOSE ]
        </button>
      </div>
    </div>
  )
}

/* ── MiniGame overlay ── */
function MiniGame({ petName, PetComponent, accessories, onEnd }) {
  const [petPos,     setPetPos]     = useState(randomPos)
  const [timeLeft,   setTimeLeft]   = useState(GAME_DURATION)
  const [earned,     setEarned]     = useState(0)
  const [clickFlash, setClickFlash] = useState(false)
  const audioCtxRef = useRef(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  useEffect(() => {
    if (timeLeft <= 0) { onEnd(earned); return }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft, earned, onEnd])

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
    <div className="fixed inset-0 bg-slate-900/92 z-50 overflow-hidden select-none">
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 gap-3">
        <div className="font-mono text-yellow-300 text-xs">💰 +{earned}</div>
        <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: pct > 40 ? 'linear-gradient(90deg,#6ee7b7,#34d399)' : 'linear-gradient(90deg,#fbbf24,#f87171)',
            }}
          />
        </div>
        <div className="font-mono text-slate-300 text-xs">{timeLeft}s</div>
      </div>

      <p className="absolute top-10 left-0 right-0 font-mono text-indigo-400 text-[9px] text-center tracking-widest">
        CATCH {petName.toUpperCase()}!
      </p>

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

      {clickFlash && (
        <div
          className="absolute font-mono text-yellow-300 text-sm pointer-events-none animate-bounce"
          style={{ left: `${petPos.x + 5}%`, top: `${petPos.y - 5}%` }}
        >
          +{COIN_PER_CLICK}💰
        </div>
      )}
    </div>
  )
}

/* ── Science Lab tab ── */
function ScienceLab({ happiness, artifacts, missionLog, onExpedition, expeditionBiome, expeditionTimeLeft, onLaunch, logRef }) {
  const [selectedBiome, setSelectedBiome] = useState(BIOMES[0].id)
  const canLaunch = !onExpedition && happiness >= MORALE_COST

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Biome selector */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] text-indigo-500 tracking-widest">// SELECT BIOME</p>
        <div className="flex flex-col gap-2">
          {BIOMES.map(biome => (
            <button
              key={biome.id}
              onClick={() => !onExpedition && setSelectedBiome(biome.id)}
              disabled={onExpedition}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left
                font-mono text-[10px] disabled:opacity-40 disabled:cursor-not-allowed
                ${selectedBiome === biome.id
                  ? `${biome.borderColor} bg-slate-700/80 ${biome.textColor}`
                  : 'border-slate-700 bg-slate-700/20 text-slate-500 hover:border-slate-600 hover:text-slate-400'}
              `}
            >
              <span className="text-lg leading-none">{biome.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold tracking-wide">{biome.name}</p>
                <p className="text-[9px] opacity-60 mt-0.5">
                  SUCCESS: {Math.round(biome.rate * 100)}% · FINDS: {biome.artifact}
                </p>
              </div>
              {selectedBiome === biome.id && !onExpedition && (
                <span className="opacity-70 text-[9px]">►</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Launch button */}
      <button
        onClick={() => canLaunch && onLaunch(selectedBiome)}
        disabled={!canLaunch}
        className={`
          w-full py-3 rounded-xl font-mono text-[10px] tracking-widest border
          transition-all duration-150 active:scale-95
          ${canLaunch
            ? 'bg-indigo-600 border-indigo-400/60 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/40'
            : 'bg-slate-700/50 border-slate-600 text-slate-500 cursor-not-allowed'}
        `}
      >
        {onExpedition
          ? `► MISSION IN PROGRESS... ${expeditionTimeLeft}s`
          : happiness < MORALE_COST
            ? `✗ MORALE TOO LOW (need ${MORALE_COST}%)`
            : '► LAUNCH EXPEDITION'}
      </button>

      {/* Mission log */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[10px] text-indigo-500 tracking-widest">// MISSION LOG</p>
        <div
          ref={logRef}
          className="h-36 overflow-y-auto bg-slate-900 rounded-xl border border-slate-700 p-3 flex flex-col gap-0.5 scroll-smooth"
        >
          {missionLog.length === 0 ? (
            <p className="font-mono text-[9px] text-slate-600 italic">
              No missions recorded. Launch an expedition to begin.
            </p>
          ) : (
            missionLog.map((msg, i) => (
              <p
                key={i}
                className={`font-mono text-[9px] leading-relaxed ${
                  msg.startsWith('✓') ? 'text-emerald-400' :
                  msg.startsWith('✗') ? 'text-red-400'     :
                  msg.startsWith('►') ? 'text-indigo-400'  :
                  'text-green-400'
                }`}
              >
                {msg}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Artifact collection */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[10px] text-indigo-500 tracking-widest">
          // ARTIFACT COLLECTION [{artifacts.length}]
        </p>
        {artifacts.length === 0 ? (
          <p className="font-mono text-[9px] text-slate-600 italic">
            No artifacts collected. Send an expedition to find them.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {artifacts.map((art, i) => {
              const biome = BIOMES.find(b => b.id === art.biome)
              return (
                <div
                  key={i}
                  title={new Date(art.timestamp).toLocaleString()}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border
                    bg-slate-700/50 cursor-default
                    ${biome?.borderColor ?? 'border-slate-600'}
                  `}
                >
                  <span className="text-sm leading-none">{biome?.icon ?? '❓'}</span>
                  <span className={`font-mono text-[9px] ${biome?.textColor ?? 'text-slate-300'}`}>
                    {art.name}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Game ── */
function Game({ petName, animal, theme, initialCoins, initialAccessories, initialArtifacts, onSave }) {
  const [activeTab,          setActiveTab]          = useState('command')
  const [hunger,             setHunger]             = useState(100)
  const [happiness,          setHappiness]          = useState(100)
  const [coins,              setCoins]              = useState(initialCoins)
  const [accessories,        setAccessories]        = useState(initialAccessories)
  const [artifacts,          setArtifacts]          = useState(initialArtifacts)
  const [feedAnim,           setFeedAnim]           = useState(false)
  const [playAnim,           setPlayAnim]           = useState(false)
  const [petAnim,            setPetAnim]            = useState('bounce2')
  const [sleeping,           setSleeping]           = useState(false)
  const [nameWiggle,         setNameWiggle]         = useState(false)
  const [shopOpen,           setShopOpen]           = useState(false)
  const [gameActive,         setGameActive]         = useState(false)
  const [gameResult,         setGameResult]         = useState(null)
  const [onExpedition,       setOnExpedition]       = useState(false)
  const [expeditionBiome,    setExpeditionBiome]    = useState(null)
  const [expeditionTimeLeft, setExpeditionTimeLeft] = useState(0)
  const [missionLog,         setMissionLog]         = useState([])

  const audioCtxRef = useRef(null)
  const logRef      = useRef(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const mood         = getMood(hunger, happiness)
  const PetComponent = PET_COMPONENTS[animal] ?? PetCat

  /* Auto-scroll mission log */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [missionLog])

  /* Persist coins, accessories, artifacts */
  useEffect(() => {
    onSave({ coins, accessories, artifacts })
  }, [coins, accessories, artifacts]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Passive decay — paused while sleeping */
  useEffect(() => {
    if (sleeping) return
    const id = setInterval(() => {
      setHunger(h => clamp(h - DECAY_AMOUNT))
      setHappiness(p => clamp(p - DECAY_AMOUNT))
    }, DECAY_INTERVAL)
    return () => clearInterval(id)
  }, [sleeping])

  /* Sync idle animation with mood */
  useEffect(() => {
    if (mood === 'sad') setPetAnim('pulse2')
    else                setPetAnim('bounce2')
  }, [mood])

  /* Expedition countdown + resolution */
  useEffect(() => {
    if (!onExpedition) return

    if (expeditionTimeLeft <= 0) {
      const biome   = BIOMES.find(b => b.id === expeditionBiome)
      const success = Math.random() < biome.rate
      if (success) {
        const newArtifact = {
          id:        Date.now().toString(),
          biome:     biome.id,
          name:      biome.artifact,
          timestamp: Date.now(),
        }
        setMissionLog(prev => [...prev.slice(-49), `✓ ARTIFACT DETECTED! ${biome.artifact} recovered.`])
        setArtifacts(prev => [...prev, newArtifact])
        playChaChing(getAudioCtx())
      } else {
        setMissionLog(prev => [...prev.slice(-49), '✗ Mission failed. No artifacts found.'])
      }
      setOnExpedition(false)
      setExpeditionBiome(null)
      return
    }

    const msg = MISSION_LOG_TIMED[expeditionTimeLeft]
    if (msg) setMissionLog(prev => [...prev.slice(-49), msg])

    const id = setTimeout(() => setExpeditionTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [onExpedition, expeditionTimeLeft, expeditionBiome]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLaunchExpedition(biomeId) {
    if (onExpedition || happiness < MORALE_COST) return
    const biome = BIOMES.find(b => b.id === biomeId)
    setHappiness(h => clamp(h - MORALE_COST))
    setOnExpedition(true)
    setExpeditionBiome(biomeId)
    setExpeditionTimeLeft(EXPEDITION_DURATION)
    setMissionLog(prev => [...prev.slice(-49), `► Initiating launch sequence... [${biome.name}]`])
  }

  const handleFeed = useCallback(() => {
    if (hunger >= MAX_STAT || sleeping || onExpedition) return
    playBlip(getAudioCtx())
    setHunger(h => clamp(h + FEED_AMOUNT))
    setFeedAnim(true)
    setPetAnim('wiggle')
    setTimeout(() => {
      setFeedAnim(false)
      setPetAnim(mood === 'sad' ? 'pulse2' : 'bounce2')
    }, 1200)
  }, [hunger, mood, sleeping, onExpedition])

  const handlePlay = useCallback(() => {
    if (happiness >= MAX_STAT || sleeping || onExpedition) return
    playBloop(getAudioCtx())
    setHappiness(p => clamp(p + PLAY_AMOUNT))
    setPlayAnim(true)
    setPetAnim('wiggle')
    setTimeout(() => {
      setPlayAnim(false)
      setPetAnim(mood === 'sad' ? 'pulse2' : 'bounce2')
    }, 1200)
  }, [happiness, mood, sleeping, onExpedition])

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
    happy:   '>> STATUS: OPTIMAL',
    neutral: '>> STATUS: NOMINAL',
    sad:     '>> STATUS: CRITICAL',
  }[mood]

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-800 border border-indigo-500/30 shadow-2xl shadow-indigo-900/40 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/80 bg-slate-900/50">
          <h1 className="font-mono text-indigo-300 text-[11px] tracking-widest">MY PIXEL PET</h1>
          <div className="font-mono text-[9px] text-yellow-400 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-2 py-0.5">
            💰 {coins}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-700/80">
          {[
            { id: 'command', label: 'COMMAND'     },
            { id: 'scilab',  label: 'SCIENCE LAB' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2.5 font-mono text-[10px] tracking-wider transition-all
                ${activeTab === tab.id
                  ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'}
              `}
            >
              {tab.label}
              {tab.id === 'scilab' && onExpedition && (
                <span className="ml-1.5 text-yellow-400 animate-pulse text-[8px]">●</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">

          {/* ══ COMMAND TAB ══ */}
          {activeTab === 'command' && (
            <div className="flex flex-col items-center gap-4">

              {/* Pet name */}
              <p
                onClick={handleNameClick}
                className={`font-mono text-xs text-indigo-200 cursor-pointer select-none tracking-widest ${nameWiggle ? 'animate-wiggle' : ''}`}
                title="Click me!"
              >
                {petName.toUpperCase()}
              </p>

              {/* Pet stage */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`
                    relative w-44 h-44
                    ${onExpedition ? 'opacity-25 grayscale' : ''}
                    ${!onExpedition && sleeping ? 'animate-pulse2' : ''}
                    ${!onExpedition && !sleeping ? (ANIM_CLASS[petAnim] ?? 'animate-bounce2') : ''}
                  `}
                  style={{ animationDuration: sleeping ? '3s' : mood === 'sad' ? '2.5s' : '1s' }}
                >
                  <PetWithAccessory
                    PetComponent={PetComponent}
                    mood={sleeping || onExpedition ? 'neutral' : mood}
                    accessories={accessories}
                    themeColor={theme?.accent}
                  />
                  {sleeping && !onExpedition && <ZzzParticles />}
                </div>

                {/* AWAY overlay during expedition */}
                {onExpedition && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                    <p className="font-mono text-sm text-yellow-300 tracking-widest">AWAY</p>
                    <p className="font-mono text-[9px] text-slate-400 animate-pulse">
                      {expeditionTimeLeft}s remaining
                    </p>
                  </div>
                )}
              </div>

              {/* Game-end coin toast */}
              {gameResult !== null && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 font-mono text-yellow-300 bg-slate-900 border border-yellow-500/60 rounded-xl px-5 py-3 shadow-xl text-xs text-center animate-bounce">
                  +{gameResult} credits!
                </div>
              )}

              {/* Status line */}
              {onExpedition ? (
                <p className="font-mono text-[10px] text-yellow-400 text-center animate-pulse tracking-wider">
                  {'>> ON EXPEDITION'}
                </p>
              ) : sleeping ? (
                <p className="font-mono text-[10px] text-indigo-400 text-center tracking-wider">
                  {'>> SLEEP MODE ACTIVE'}
                </p>
              ) : (
                <p className={`font-mono text-[10px] text-center tracking-wider transition-colors duration-500 ${
                  mood === 'sad'   ? 'text-red-400'     :
                  mood === 'happy' ? 'text-emerald-400' : 'text-indigo-300'
                }`}>
                  {moodLabel}
                </p>
              )}

              {/* Stat bars */}
              <div className="w-full flex flex-col gap-2.5">
                <StatBar label="HUNGER" value={hunger}    icon="🍓" color={['#f472b6', '#fb7185']} />
                <StatBar label="MORALE" value={happiness} icon="⚡" color={['#818cf8', '#6366f1']} />
              </div>

              {/* Primary actions */}
              <div className="flex gap-2.5 flex-wrap justify-center">
                <ActionButton
                  onClick={handleFeed}
                  label="FEED"
                  icon="🍓"
                  gradient="linear-gradient(135deg, #f472b6, #fb7185)"
                  disabled={hunger >= MAX_STAT || sleeping || onExpedition}
                  animClass={feedAnim ? 'ring-2 ring-pink-400/70' : ''}
                />
                <ActionButton
                  onClick={handlePlay}
                  label="PLAY"
                  icon="⚡"
                  gradient="linear-gradient(135deg, #818cf8, #6366f1)"
                  disabled={happiness >= MAX_STAT || sleeping || onExpedition}
                  animClass={playAnim ? 'ring-2 ring-indigo-400/70' : ''}
                />
                {/* Sleep toggle */}
                <button
                  onClick={() => !onExpedition && setSleeping(s => !s)}
                  disabled={onExpedition}
                  className={`
                    flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl
                    font-mono text-[10px] shadow-lg transition-all duration-150 border
                    active:scale-95 hover:scale-105
                    disabled:opacity-30 disabled:cursor-not-allowed
                    ${sleeping
                      ? 'bg-indigo-900/60 border-indigo-500/60 text-indigo-300 ring-2 ring-indigo-500/30'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'}
                  `}
                >
                  <span className="text-xl">{sleeping ? '☀️' : '🌙'}</span>
                  <span>{sleeping ? 'WAKE' : 'SLEEP'}</span>
                </button>
              </div>

              {/* Secondary actions */}
              <div className="flex gap-2.5 flex-wrap justify-center">
                <button
                  onClick={() => { if (!sleeping && !onExpedition) setGameActive(true) }}
                  disabled={sleeping || onExpedition}
                  className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl font-mono text-[10px] text-white shadow-lg transition-all active:scale-95 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed border border-amber-700/40"
                  style={{ background: 'linear-gradient(135deg, #b45309, #92400e)' }}
                >
                  <span className="text-xl">🎮</span>
                  <span>MINI-GAME</span>
                </button>
                <button
                  onClick={() => setShopOpen(true)}
                  className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl font-mono text-[10px] text-white shadow-lg transition-all active:scale-95 hover:scale-105 border border-violet-700/40"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  <span className="text-xl">🛍️</span>
                  <span>SHOP</span>
                </button>
              </div>
            </div>
          )}

          {/* ══ SCIENCE LAB TAB ══ */}
          {activeTab === 'scilab' && (
            <ScienceLab
              happiness={happiness}
              artifacts={artifacts}
              missionLog={missionLog}
              onExpedition={onExpedition}
              expeditionBiome={expeditionBiome}
              expeditionTimeLeft={expeditionTimeLeft}
              onLaunch={handleLaunchExpedition}
              logRef={logRef}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-700/80 bg-slate-900/30">
          <span className="font-mono text-[8px] text-slate-600 tracking-widest">
            v{APP_VERSION} · THE EXPEDITION UPDATE
          </span>
          <button
            onClick={() => {
              if (window.confirm('Reset all data?')) {
                localStorage.clear()
                window.location.reload()
              }
            }}
            className="font-mono text-[8px] text-slate-600 hover:text-red-400 transition-colors"
          >
            [RESET]
          </button>
        </div>
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
    const full = { ...petData, coins: 0, accessories: [], artifacts: [] }
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
      initialArtifacts={pet.artifacts ?? []}
      onSave={handleSave}
    />
  )
}
