import React, { useState, useEffect } from 'react';
import { version } from '../package.json';
import PixelPet from './PixelPet';

const App = () => {
  // 1. STATE MANAGEMENT (Loaded from LocalStorage)
  const [petData, setPetData] = useState(() => {
    const saved = localStorage.getItem('pixel-pet-v2');
    return saved ? JSON.parse(saved) : null; // null means show Adoption Center
  });

  const [hunger, setHunger] = useState(100);
  const [happiness, setHappiness] = useState(100);
  const [isSleeping, setIsSleeping] = useState(false);
  const [gameMode, setGameMode] = useState(false);
  
  // Adoption Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('cat');
  const [formColor, setFormColor] = useState('#f472b6');

  // 2. PERSISTENCE
  useEffect(() => {
    if (petData) {
      localStorage.setItem('pixel-pet-v2', JSON.stringify(petData));
    }
  }, [petData]);

  // 3. GAME LOGIC (Hunger/Happiness Decay)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSleeping && petData) {
        setHunger(h => Math.max(0, h - 2));
        setHappiness(hp => Math.max(0, hp - 2));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isSleeping, petData]);

  // 4. AUDIO (Web Audio API)
  const playSound = (f1, f2) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.setValueAtTime(f1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  };

  const handleAdopt = (e) => {
    e.preventDefault();
    if (!formName) return;
    setPetData({
      name: formName,
      type: formType,
      color: formColor,
      coins: 0,
      accessories: []
    });
    playSound(400, 800);
  };

  // ADOPTION CENTER UI
  if (!petData) {
    return (
      <div className="min-h-screen bg-pink-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border-4 border-pink-300 text-center">
          <h1 className="text-3xl font-bold text-pink-500 mb-6">Pet Adoption Center</h1>
          <form onSubmit={handleAdopt} className="space-y-4">
            <input 
              type="text" placeholder="Name your pet..." 
              className="w-full p-3 border-2 border-pink-200 rounded-xl focus:outline-pink-400"
              value={formName} onChange={(e) => setFormName(e.target.value)}
            />
            <div className="flex justify-center gap-4">
              {['cat', 'dino', 'slime'].map(t => (
                <button 
                  key={t} type="button" onClick={() => setFormType(t)}
                  className={`p-2 rounded-xl border-2 transition ${formType === t ? 'border-pink-500 bg-pink-50' : 'border-transparent'}`}
                >
                  <span className="capitalize">{t}</span>
                </button>
              ))}
            </div>
            <input 
              type="color" className="w-full h-12 rounded-lg cursor-pointer"
              value={formColor} onChange={(e) => setFormColor(e.target.value)}
            />
            <button className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600">Adopt My Friend! ✨</button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN GAME UI
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-all ${isSleeping ? 'bg-slate-900' : 'bg-gradient-to-b from-blue-100 to-purple-200'}`}>
      <div className="bg-white/90 p-8 rounded-3xl shadow-2xl text-center border-4 border-white w-80">
        <div className="flex justify-between items-center mb-4">
           <span className="font-bold text-slate-600">{petData.name}</span>
           <span className="bg-yellow-100 px-3 py-1 rounded-full text-sm font-bold">💰 {petData.coins}</span>
        </div>

        <div 
          className={`relative transition-all ${gameMode ? 'animate-bounce cursor-crosshair' : ''}`}
          onClick={() => gameMode && setPetData(p => ({...p, coins: p.coins + 5}))}
        >
          <PixelPet type={petData.type} color={petData.color} mood={(hunger + happiness) / 2} />
          {isSleeping && <div className="absolute top-0 right-0 animate-bounce text-2xl">💤</div>}
        </div>

        <div className="mt-6 space-y-4">
          <StatBar label="Hunger" value={hunger} color="bg-orange-400" />
          <StatBar label="Happiness" value={happiness} color="bg-yellow-400" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2">
          <button onClick={() => { setHunger(h => Math.min(100, h+15)); playSound(300, 500); }} className="bg-pink-400 text-white p-2 rounded-xl">Feed</button>
          <button onClick={() => { setHappiness(h => Math.min(100, h+15)); playSound(500, 700); }} className="bg-purple-400 text-white p-2 rounded-xl">Play</button>
          <button onClick={() => setIsSleeping(!isSleeping)} className="col-span-2 bg-slate-700 text-white p-2 rounded-xl">{isSleeping ? 'Wake Up' : 'Sleep'}</button>
          <button onClick={() => { setGameMode(true); setTimeout(() => setGameMode(false), 8000); }} className="col-span-2 bg-yellow-500 text-white p-2 rounded-xl font-bold animate-pulse">Catch the Pet! (Game)</button>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="col-span-2 text-xs text-slate-400 mt-4 underline">Reset All Data</button>
        </div>
      </div>
      <footer className="mt-4 text-slate-400 text-xs text-center">Version {version}</footer>
    </div>
  );
};

const StatBar = ({ label, value, color }) => (
  <div className="w-full">
    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>{label}</span><span>{value}%</span></div>
    <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default App;
