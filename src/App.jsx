import React, { useState, useEffect } from 'react';
import { version } from '../package.json';
import PixelPet from './PixelPet';

const App = () => {
  // Load initial state from LocalStorage or use defaults
  const [savedData, setSavedData] = useState(() => {
    const local = localStorage.getItem('pixel-pet-data');
    return local ? JSON.parse(local) : {
      name: 'Pet',
      type: 'cat',
      color: '#f472b6',
      coins: 0,
      inventory: []
    };
  });

  const [hunger, setHunger] = useState(100);
  const [happiness, setHappiness] = useState(100);
  const [isSleeping, setIsSleeping] = useState(false);
  const [gameMode, setGameMode] = useState(false);
  const [activeAccessory, setActiveAccessory] = useState(null);

  // Persistence: Save data whenever name, coins, or items change
  useEffect(() => {
    localStorage.setItem('pixel-pet-data', JSON.stringify(savedData));
  }, [savedData]);

  // Decay Logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSleeping) {
        setHunger(prev => Math.max(0, prev - 2));
        setHappiness(prev => Math.max(0, prev - 2));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isSleeping]);

  // Audio Helper (Web Audio API - no files needed!)
  const playSound = (freq1, freq2) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const handleAction = (type) => {
    if (type === 'feed') {
      setHunger(prev => Math.min(100, prev + 15));
      playSound(200, 400);
    } else {
      setHappiness(prev => Math.min(100, prev + 15));
      playSound(400, 600);
    }
  };

  const startMiniGame = () => {
    setGameMode(true);
    setTimeout(() => {
      setGameMode(false);
      // Award coins based on play
      setSavedData(prev => ({ ...prev, coins: prev.coins + 20 }));
      playSound(800, 1200); // Cha-ching!
    }, 5000);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-all duration-500 ${isSleeping ? 'bg-slate-900' : 'bg-gradient-to-b from-pink-200 to-purple-300'}`}>
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center border-4 border-white">
        <h1 className="text-2xl font-bold mb-2" style={{ color: savedData.color }}>{savedData.name}'s Home</h1>
        <div className="text-xl mb-4">💰 {savedData.coins} Coins</div>

        <div className={`relative transition-transform ${gameMode ? 'animate-bounce cursor-pointer' : ''}`} onClick={() => gameMode && setSavedData(prev => ({...prev, coins: prev.coins + 5}))}>
           <PixelPet type={savedData.type} color={savedData.color} mood={(hunger + happiness) / 2} accessory={activeAccessory} />
           {isSleeping && <div className="absolute -top-4 right-0 text-2xl animate-pulse">💤</div>}
        </div>

        {/* Stats Section */}
        <div className="mt-6 space-y-3 w-64">
          <StatBar label="Hunger" value={hunger} color="bg-orange-400" />
          <StatBar label="Happiness" value={happiness} color="bg-yellow-400" />
        </div>

        {/* Buttons */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button onClick={() => handleAction('feed')} className="bg-pink-500 text-white px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition">Feed</button>
          <button onClick={() => handleAction('play')} className="bg-purple-500 text-white px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition">Play</button>
          <button onClick={() => setIsSleeping(!isSleeping)} className="bg-indigo-600 text-white px-4 py-2 rounded-full col-span-2">{isSleeping ? 'Wake Up' : 'Sleep'}</button>
          <button onClick={startMiniGame} className="bg-yellow-500 text-white px-4 py-2 rounded-full col-span-2 animate-pulse">Catch the Pet! (+Coins)</button>
        </div>
      </div>

      <footer className="mt-8 text-slate-500 text-sm">Version {version}</footer>
    </div>
  );
};

const StatBar = ({ label, value, color }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>{label}</span><span>{value}%</span></div>
    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
      <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default App;
