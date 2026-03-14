# My Pixel Pet — Design Document

> **Living document.** Update this whenever the architecture or roadmap changes.

---

## 1. Product Vision

A browser-based virtual pet for kids that rewards **daily** (not hourly) check-ins. The loop should feel like tending a plant: visit once a day, see what changed, do a few caring actions, leave happy. Progress should be persistent and visible over weeks, not minutes.

**Core pillars:**
- **Low-pressure daily ritual** — five minutes a day is enough
- **Real stakes without cruelty** — the pet gets sad but never permanently dies
- **Visible progression** — something new to unlock or discover each week
- **Kid-safe** — no ads, no external accounts, no real money

---

## 2. Current Architecture (v1.3.0)

### Tech Stack
| Layer | Choice |
|---|---|
| UI | React 18, Vite 6 |
| Styling | Tailwind CSS 3 + custom animations |
| Fonts | Press Start 2P (pixel), system monospace |
| Audio | Web Audio API (no external dependencies) |
| Persistence | `localStorage` only |
| Deployment | Vercel (primary), GitHub Pages (legacy) |

### File Structure
```
src/
  App.jsx           — All game logic + UI (single-file architecture)
  AdoptionCenter.jsx — New-pet onboarding form
  PetCat.jsx        — SVG cat component (mood-aware)
  PetDino.jsx       — SVG dino component (mood-aware)
  PetSlime.jsx      — SVG slime component (mood-aware)
  PixelPet.jsx      — Original generic SVG pet (unused in v1.3.0)
  index.css         — Global styles + Google Font import
  main.jsx          — React root
index.html
tailwind.config.js  — Custom animations (bounce2, wiggle, pulse2) + pixel font
vite.config.js      — Injects __APP_VERSION__ at build time
```

### State Model (v1.3.0)
**localStorage key:** `pixelPetSave_v13`

```js
{
  name:        string,          // pet name
  animal:      'cat'|'dino'|'slime',
  theme:       { bg, accent, border }, // chosen at adoption
  coins:       number,
  accessories: string[],        // ['partyHat', 'goldenCrown']
  artifacts:   Artifact[],      // [{ id, biome, name, timestamp }]
}
```

**In-memory only (lost on refresh):**
- `hunger`, `happiness` — start at 100 every session
- `sleeping` state
- `missionLog` — expedition history

### Core Game Loop
1. **Decay** — every 3 seconds while not sleeping: hunger −2, morale −2
2. **Care** — Feed (+15 hunger), Play (+15 morale), Sleep (pause decay)
3. **Earn** — Mini-game: click the jumping pet for 5 coins per catch
4. **Spend** — Shop: Party Hat (50 coins), Golden Crown (150 coins)
5. **Explore** — Expedition: spend 20 morale, wait 10 seconds, maybe get an artifact

### Known Limitations

| # | Problem | Impact |
|---|---|---|
| 1 | **Stats reset to 100 on every page load** | Zero persistence of pet health — the game resets completely each visit |
| 2 | **Decay is session-based, not real-time** | Coming back the next day feels identical to opening a new tab |
| 3 | **No stakes** | Pet can't die, get sick, or be particularly distressed long-term |
| 4 | **Artifacts are inert** | Collecting them has no effect on gameplay |
| 5 | **No progression or growth** | Pet looks identical on day 1 and day 100 |
| 6 | **No daily reward** | No incentive structure for consistent return visits |
| 7 | **Single-player, single-device** | No sharing, no comparison, no social hook |
| 8 | **Body background conflicts** | `index.css` pink gradient clashes with the dark slate game UI |

---

## 3. Engagement Analysis

### What Works
- SVG pets are charming and expressive (happy/neutral/sad faces)
- Mini-game is satisfying for a minute
- Expedition theme and mission log have good personality
- Coin economy gives a sense of progress within a session

### The Core Problem: No Async Loop
A Tamagotchi is compelling because **time passes in its world while you're gone**. The current game is stateless between visits — nothing has changed when your kid comes back. There's no reason to return.

For a daily ritual to form, the game needs:
1. **Something that happened while they were away** (stat decay, expedition results, random events)
2. **A reason to come back tomorrow** (streak, upcoming unlock, pet needs care)
3. **A payoff for caring** (visible pet happiness, new items, growth milestone)

---

## 4. Proposed v1.4.0 — "The Living World Update"

### Design Goals
- Stats persist across sessions and decay in **real time** (wall-clock hours)
- A 24-hour absence leaves the pet at ~30% stats (distressed but alive)
- First visit of each day gives a **daily reward**
- Artifacts unlock something meaningful
- Pet has **visible age milestones** to celebrate

### 4.1 Real-Time Decay System

On every save write, store `lastSeen: Date.now()`.
On every game load, calculate elapsed hours and apply catch-up decay:

```js
const HOURLY_DECAY = 3.5          // % per hour (reaches ~16% after 24h)
const MAX_CATCHUP_HOURS = 26      // cap so a 3-day absence = ~26h of decay

const hoursAway = Math.min(
  (Date.now() - save.lastSeen) / 3_600_000,
  MAX_CATCHUP_HOURS
)
const decayApplied = Math.floor(hoursAway * HOURLY_DECAY)

// Apply at load time, then show "Your pet missed you!" message
hunger    = clamp(save.hunger    - decayApplied)
happiness = clamp(save.happiness - decayApplied)
```

**Active-session decay** stays slow (~1% per 30s) so a 5-minute visit doesn't drain stats.

### 4.2 Pet Age & Life Stages

Track `adoptedAt: timestamp` in the save. Derive age in days on each load.

| Days | Stage | Visual Change |
|---|---|---|
| 0 | Hatchling 🥚 | Smaller sprite, extra cute |
| 1–3 | Baby | Current small size |
| 4–9 | Juvenile | Full size, no extras |
| 10–20 | Adult | Subtle glow effect |
| 21+ | Elder | Star-sparkle idle animation |

Stage-ups show a celebration toast: *"🎉 [name] is now an Adult!"*

### 4.3 Daily Check-In System

```js
// Save: lastCheckIn: datestring (YYYY-MM-DD), streak: number
const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

if (save.lastCheckIn !== today) {
  const streakContinues = save.lastCheckIn === yesterday
  streak = streakContinues ? save.streak + 1 : 1
  coinsEarned = 10 + streak * 5    // Day 1: +15, Day 7: +45, etc.
  // Show: "Day 3 streak! +25 coins 🔥"
}
```

### 4.4 Artifacts That Matter

Use expedition artifacts as **crafting ingredients**:

| Recipe | Ingredients | Result |
|---|---|---|
| Energy Drink | 3 × Crystal | Instantly fills Hunger to 100 |
| Joy Booster | 3 × Bio-Link | Instantly fills Morale to 100 |
| Void Orb | 2 × Quark | Unlocks a new pet accessory |
| Elder Serum | 1 of each | Grants a permanent +10% coin bonus |

Crafting panel lives in the Science Lab tab, below Artifact Collection.

### 4.5 Proposed Save Schema (v1.4.0)

```js
// localStorage key: pixelPetSave_v14
{
  // Identity
  name:          string,
  animal:        'cat' | 'dino' | 'slime',
  theme:         ThemeObject,
  adoptedAt:     number,         // timestamp — for age calculation

  // Stats (persisted)
  hunger:        number,         // 0–100
  happiness:     number,         // 0–100
  lastSeen:      number,         // timestamp — for real-time decay

  // Economy
  coins:         number,
  accessories:   string[],

  // Expeditions
  artifacts:     Artifact[],

  // Engagement
  lastCheckIn:   string,         // 'YYYY-MM-DD'
  streak:        number,
}
```

### 4.6 Updated App.jsx Architecture

With stats now persisted, the `Game` component initializes with real values:

```
App (root)
 ├── loads save → applies real-time decay → shows catch-up message
 ├── checks daily reward → grants coins/morale if new day
 └── Game
      ├── COMMAND tab  (unchanged + life-stage indicator)
      ├── SCIENCE LAB tab  (+ Crafting panel)
      └── CatchUpModal  (shown once on load if pet was hungry)
```

### 4.7 New Files to Create
- `src/usePetSave.js` — custom hook encapsulating all load/save/decay logic
- `src/CatchUpModal.jsx` — "You were away X hours, your pet is hungry!" screen
- `src/Crafting.jsx` — artifact crafting panel

---

## 5. Future Ideas (Post-v1.4.0 Backlog)

| Idea | Notes |
|---|---|
| **Push notifications** | Web Push API — "Mochi is hungry!" banner on the phone (requires a service worker) |
| **Pet photo export** | Canvas snapshot of the SVG pet as a PNG to share |
| **Mini-game variety** | A second or third mini-game to earn coins differently |
| **Seasonal events** | Holiday-themed biomes or accessories (Halloween, Winter) |
| **Multiple pets** | Adopt a second pet; they can interact |
| **Sound toggle** | Persist mute preference; add ambient background music |

---

## 6. Deployment

### Vercel (Primary — v1.3.0+)
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- No environment variables required
- `vercel.json` provides SPA rewrite rule
- Vite `base` is `/` (root)

### GitHub Pages (Legacy)
To re-enable: set `base: '/my-pixel-pet/'` in `vite.config.js` and run `npm run deploy`.
The `homepage` field in `package.json` remains as a reference.

---

*Last updated: v1.3.0 — The Expedition Update*
