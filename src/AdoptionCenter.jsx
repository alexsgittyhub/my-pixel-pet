import { useState } from 'react'
import PetCat   from './PetCat'
import PetDino  from './PetDino'
import PetSlime from './PetSlime'

const ANIMALS = [
  { id: 'cat',   label: 'Cat',   Component: PetCat },
  { id: 'dino',  label: 'Dino',  Component: PetDino },
  { id: 'slime', label: 'Slime', Component: PetSlime },
]

const THEMES = [
  { id: 'pink',  label: 'Sakura Pink',  bg: 'from-pink-100 via-fuchsia-100 to-violet-100', accent: '#f472b6', border: 'border-pink-300' },
  { id: 'blue',  label: 'Sky Blue',     bg: 'from-sky-100 via-cyan-100 to-blue-100',        accent: '#38bdf8', border: 'border-sky-300'  },
  { id: 'green', label: 'Slime Green',  bg: 'from-green-100 via-emerald-100 to-teal-100',   accent: '#4ade80', border: 'border-green-300' },
]

export default function AdoptionCenter({ onAdopt }) {
  const [name,     setName]     = useState('')
  const [animal,   setAnimal]   = useState('cat')
  const [themeId,  setThemeId]  = useState('pink')

  const theme    = THEMES.find(t => t.id === themeId)
  const canStart = name.trim().length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canStart) return
    onAdopt({ name: name.trim(), animal, theme })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className={`
          w-full max-w-sm rounded-3xl
          bg-gradient-to-b ${theme.bg}
          border-4 ${theme.border} shadow-2xl
          flex flex-col items-center gap-6 p-6
          transition-all duration-500
        `}
      >
        {/* Header */}
        <h1 className="font-pixel text-purple-600 text-sm tracking-tight text-center leading-loose">
          ✦ Adoption Center ✦
        </h1>
        <p className="font-pixel text-xs text-purple-400 text-center -mt-3">
          Find your perfect pixel pal!
        </p>

        {/* Name input */}
        <div className="w-full flex flex-col gap-2">
          <label className="font-pixel text-xs text-purple-700">
            What is your pet&apos;s name?
          </label>
          <input
            type="text"
            maxLength={16}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mochi"
            className={`
              w-full px-4 py-2 rounded-xl border-2 ${theme.border}
              bg-white/70 font-pixel text-xs text-purple-800
              placeholder-purple-300 outline-none
              focus:ring-2 focus:ring-purple-300 transition
            `}
          />
        </div>

        {/* Animal picker */}
        <div className="w-full flex flex-col gap-2">
          <label className="font-pixel text-xs text-purple-700">
            Which friend would you like to adopt?
          </label>
          <div className="flex gap-3 justify-center">
            {ANIMALS.map(({ id, label, Component }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAnimal(id)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all
                  ${animal === id
                    ? `border-purple-500 bg-white/80 scale-105 shadow-lg`
                    : 'border-transparent bg-white/40 hover:bg-white/60'}
                `}
              >
                <div className="w-16 h-16">
                  <Component mood="happy" />
                </div>
                <span className="font-pixel text-[8px] text-purple-700">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme picker */}
        <div className="w-full flex flex-col gap-2">
          <label className="font-pixel text-xs text-purple-700">
            Pick a theme color
          </label>
          <div className="flex gap-2 justify-center">
            {THEMES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all
                  ${themeId === t.id ? 'border-purple-500 bg-white/80 scale-105 shadow' : 'border-transparent bg-white/40 hover:bg-white/60'}
                `}
              >
                <span
                  className="w-6 h-6 rounded-full border-2 border-white shadow"
                  style={{ background: t.accent }}
                />
                <span className="font-pixel text-[7px] text-purple-700 text-center leading-tight">
                  {t.label.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={!canStart}
          className={`
            w-full py-3 rounded-2xl font-pixel text-xs text-white shadow-lg
            transition-all duration-150 active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
          style={{
            background: canStart
              ? `linear-gradient(135deg, ${theme.accent}, #c084fc)`
              : '#d1d5db',
          }}
        >
          Let&apos;s Go! ✦
        </button>

        <span className="text-purple-300 text-lg select-none">✦</span>
      </form>
    </div>
  )
}
