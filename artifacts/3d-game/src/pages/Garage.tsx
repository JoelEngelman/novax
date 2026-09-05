import { useState } from 'react';
import { useGameState } from '../game/useGameState';
import { CARS } from '../game/cars';

export default function Garage() {
  const { state, setState, credits, ownedCars, selectedCarId, setSelectedCarId, spendCredits, unlockCar } = useGameState();
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  if (state !== 'GARAGE') return null;

  const handleBuy = (carId: string, price: number) => {
    if (spendCredits(price)) {
      unlockCar(carId);
      setSelectedCarId(carId);
      setPurchasedId(carId);
      setTimeout(() => setPurchasedId(null), 2000);
    }
  };

  return (
    <div className="min-w-[100vw] min-h-[100vh] overflow-y-auto bg-[#050510] flex flex-col items-center py-12 relative font-sans">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none fixed" style={{ backgroundImage: 'radial-gradient(circle at center, #a855f7 0%, transparent 60%)' }} />
      
      <div className="w-full max-w-6xl px-6 flex justify-between items-center mb-12 z-10">
        <button 
          onClick={() => setState('MENU')}
          className="px-6 py-3 bg-white/5 border border-white/20 text-white font-bold tracking-widest rounded hover:bg-white/10 transition-all uppercase text-sm"
        >
          ← BACK TO MENU
        </button>
        <div className="text-yellow-400 font-bold text-2xl tracking-widest bg-black/60 px-6 py-3 border-2 border-yellow-500/40 rounded shadow-[0_0_20px_rgba(255,215,0,0.2)] font-display">
          CREDITS: {credits.toLocaleString()} CR
        </div>
      </div>

      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-purple-600 mb-12 font-display text-center z-10" style={{ WebkitTextStroke: '1px rgba(168,85,247,0.5)', textShadow: '0 0 40px rgba(168,85,247,0.4)' }}>
        GARAGE
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full px-6 z-10 pb-16">
        {CARS.map(car => {
          const isOwned = ownedCars.includes(car.id);
          const isSelected = selectedCarId === car.id;
          const canAfford = credits >= car.price;
          const recentlyPurchased = purchasedId === car.id;

          return (
            <div 
              key={car.id}
              className={`relative flex flex-col border-2 rounded-xl p-6 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-hidden ${isSelected ? 'scale-[1.02]' : ''}`}
              style={{ 
                borderColor: isSelected ? car.trimColor : isOwned ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                boxShadow: isSelected ? `0 0 30px ${car.trimColor}60` : 'none',
                opacity: (!isOwned && !canAfford) ? 0.6 : 1
              }}
            >
              {recentlyPurchased && (
                <div className="absolute inset-0 bg-white/20 z-20 animate-pulse pointer-events-none" />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-3xl font-black font-display tracking-wider" style={{ color: car.trimColor }}>
                  {car.name}
                </h2>
                {!isOwned && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                    <span className="text-lg">🔒</span>
                  </div>
                )}
              </div>
              
              <p className="text-white/50 text-sm mb-6 h-10">
                {car.description}
              </p>

              <div className="space-y-4 mb-8 flex-1">
                <div>
                  <div className="flex justify-between text-xs font-bold tracking-widest text-white/70 mb-1">
                    <span>SPEED</span>
                    <span>{car.maxSpeed}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(car.maxSpeed / 100) * 100}%`, backgroundColor: car.trimColor }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold tracking-widest text-white/70 mb-1">
                    <span>ACCELERATION</span>
                    <span>{car.acceleration}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(car.acceleration / 70) * 100}%`, backgroundColor: car.trimColor }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold tracking-widest text-white/70 mb-1">
                    <span>HANDLING</span>
                    <span>{car.turnSpeed.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(car.turnSpeed / 2.8) * 100}%`, backgroundColor: car.trimColor }} />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/10">
                {isOwned ? (
                  isSelected ? (
                    <div className="w-full py-3 text-center border-2 rounded text-black font-bold tracking-widest bg-cyan-400 border-cyan-400 font-display shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                      ACTIVE
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedCarId(car.id)}
                      className="w-full py-3 text-center border-2 rounded font-bold tracking-widest transition-all font-display bg-white/5 border-white/30 text-white hover:bg-white/20"
                    >
                      SELECT
                    </button>
                  )
                ) : (
                  canAfford ? (
                    <button 
                      onClick={() => handleBuy(car.id, car.price)}
                      className="w-full py-3 text-center border-2 rounded font-bold tracking-widest transition-all font-display bg-yellow-500/20 border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                    >
                      BUY — {car.price.toLocaleString()} CR
                    </button>
                  ) : (
                    <div className="w-full py-3 text-center border-2 rounded font-bold tracking-widest bg-black/40 border-white/10 text-white/30 font-display cursor-not-allowed">
                      LOCKED — {car.price.toLocaleString()} CR
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}