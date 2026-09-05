import { useMemo } from 'react';
import { useGameState } from './useGameState';
import { TRACKS } from './tracks';

export function HUD() {
  const lap = useGameState(s => s.lap);
  const maxLaps = useGameState(s => s.maxLaps);
  const speed = useGameState(s => s.speed);
  const timeMs = useGameState(s => s.timeMs);
  const boostActive = useGameState(s => s.boostActive);
  const selectedTrackId = useGameState(s => s.selectedTrackId);
  const lapFlash = useGameState(s => s.lapFlash);
  const activeBoostTier = useGameState(s => s.activeBoostTier);
  const chestNotification = useGameState(s => s.chestNotification);
  const coinNotification = useGameState(s => s.coinNotification);
  const carX = useGameState(s => s.carX);
  const carZ = useGameState(s => s.carZ);
  const gameMode = useGameState(s => s.gameMode);
  const track = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const { minimapProps, polylinePoints } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of track.points) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[2] < minZ) minZ = p[2];
      if (p[2] > maxZ) maxZ = p[2];
    }
    const pointsStr = track.points.map(p => {
      const x = ((p[0] - minX) / (maxX - minX)) * 100 + 10;
      const z = ((p[2] - minZ) / (maxZ - minZ)) * 100 + 10;
      return `${x},${z}`;
    }).join(' ');
    return { minimapProps: { minX, maxX, minZ, maxZ }, polylinePoints: pointsStr };
  }, [track.points]);

  const svgCarX = ((carX - minimapProps.minX) / (minimapProps.maxX - minimapProps.minX)) * 100 + 10;
  const svgCarZ = ((carZ - minimapProps.minZ) / (minimapProps.maxZ - minimapProps.minZ)) * 100 + 10;

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between font-['Orbitron']">
      <div className="flex justify-between items-start">
        <div className="bg-black/50 border border-cyan-500/30 p-4 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.2)]">
          <div className="text-cyan-500 text-sm tracking-widest font-bold">LAP</div>
          <div className="text-4xl text-white font-black">{lap} <span className="text-cyan-700 text-2xl">/ {maxLaps}</span></div>
          {gameMode !== 'RACE' && <div className="text-[10px] font-bold tracking-widest mt-1" style={{ color: track.primaryColor }}>{gameMode}</div>}
        </div>
        <div className="bg-black/50 border border-cyan-500/30 p-4 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.2)] text-center min-w-[200px]">
          <div className="text-cyan-500 text-sm tracking-widest font-bold">TIME</div>
          <div className="text-3xl text-white font-mono tracking-wider">{formatTime(timeMs)}</div>
        </div>
        <div className="bg-black/50 border border-cyan-500/30 p-4 backdrop-blur-sm rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.2)] text-right min-w-[150px]">
          <div className="text-cyan-500 text-sm tracking-widest font-bold">SPEED</div>
          <div className="text-4xl text-white font-black">{Math.floor(speed * 10)} <span className="text-cyan-700 text-xl">KM/H</span></div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-10 gap-4">
        {lapFlash && <>
          <div className="fixed inset-0 pointer-events-none z-50" style={{ background: track.primaryColor, animation: 'screen-flash 0.5s ease-out forwards' }} />
          <div className="flex flex-col items-center gap-2">
            <div className="text-6xl font-black tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" style={{ color: track.primaryColor }}>LAP COMPLETE!</div>
            <div className="text-5xl" style={{ display: 'inline-block', animation: 'flag-wave 0.4s ease-in-out infinite' }}>🏁</div>
          </div>
        </>}
        {coinNotification && <div className="text-lg font-bold tracking-widest text-yellow-300 animate-ping bg-black/60 px-4 py-1 rounded-full border border-yellow-400">+CR</div>}
        {boostActive && activeBoostTier === 'common' && <div className="text-2xl font-bold tracking-widest text-cyan-400 animate-pulse bg-black/60 px-8 py-2 rounded-full border border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.8)]">BOOST ACTIVE</div>}
        {boostActive && activeBoostTier === 'rare' && <div className="text-3xl font-bold tracking-widest text-yellow-400 animate-pulse bg-black/60 px-8 py-2 rounded-full border border-yellow-400 shadow-[0_0_30px_rgba(255,215,0,0.8)]">RARE BOOST!</div>}
        {boostActive && activeBoostTier === 'legendary' && <div className="text-4xl font-black tracking-widest text-white animate-pulse bg-black/60 px-10 py-3 rounded-full border-2 border-white shadow-[0_0_40px_rgba(255,255,255,1)]"><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500">LEGENDARY BOOST!!</span></div>}
        {chestNotification && <div className="text-3xl font-black animate-bounce text-yellow-400 border border-yellow-500 bg-black/70 px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.8)] mt-4">CHEST OPENED! {chestNotification}</div>}
        <div className="text-white/50 text-sm font-bold tracking-widest bg-black/40 px-4 py-1 rounded">{track.name.toUpperCase()}</div>
      </div>

      <div style={{ position: 'absolute', bottom: '24px', left: '24px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" className="bg-black/50 rounded-lg shadow-lg" style={{ border: `2px solid ${track.primaryColor}` }}>
          <polyline points={polylinePoints} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinejoin="round" />
          <circle cx={svgCarX} cy={svgCarZ} r="4" fill="white" />
          <circle cx={svgCarX} cy={svgCarZ} r="6" fill={track.primaryColor} opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
