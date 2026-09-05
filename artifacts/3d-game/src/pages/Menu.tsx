import { useGameState, GameMode, getDailyChallenge } from '../game/useGameState';
import { Leaderboard } from '../game/Leaderboard';
import { TRACKS } from '../game/tracks';
import { getCarById } from '../game/cars';

const TRACK_THEME: Record<string, {
  glow: string; titleFrom: string; titleTo: string; stroke: string; shadow: string;
  subtitleColor: string; btnBg: string; btnBorder: string; btnText: string; btnHoverShadow: string;
}> = {
  'neon-circuit': {
    glow: 'radial-gradient(circle at center, #00ffff 0%, transparent 50%)',
    titleFrom: 'from-cyan-300', titleTo: 'to-cyan-600',
    stroke: 'rgba(0,255,255,0.5)', shadow: '0 0 40px rgba(0,255,255,0.4)',
    subtitleColor: 'text-cyan-400/80',
    btnBg: 'bg-cyan-500/10', btnBorder: 'border-cyan-400', btnText: 'text-cyan-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
  },
  'volcanic-rift': {
    glow: 'radial-gradient(circle at center, #ff4400 0%, transparent 50%)',
    titleFrom: 'from-red-400', titleTo: 'to-orange-600',
    stroke: 'rgba(255,68,0,0.5)', shadow: '0 0 40px rgba(255,68,0,0.5)',
    subtitleColor: 'text-orange-400/80',
    btnBg: 'bg-red-500/10', btnBorder: 'border-red-400', btnText: 'text-red-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(255,68,0,0.6)]',
  },
  'crystal-abyss': {
    glow: 'radial-gradient(circle at center, #aa00ff 0%, transparent 50%)',
    titleFrom: 'from-purple-300', titleTo: 'to-purple-700',
    stroke: 'rgba(170,0,255,0.5)', shadow: '0 0 40px rgba(170,0,255,0.5)',
    subtitleColor: 'text-purple-400/80',
    btnBg: 'bg-purple-600/10', btnBorder: 'border-purple-400', btnText: 'text-purple-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(170,0,255,0.6)]',
  },
  'solar-storm': {
    glow: 'radial-gradient(circle at center, #00ff88 0%, transparent 50%)',
    titleFrom: 'from-green-300', titleTo: 'to-green-600',
    stroke: 'rgba(0,255,136,0.5)', shadow: '0 0 40px rgba(0,255,136,0.4)',
    subtitleColor: 'text-green-400/80',
    btnBg: 'bg-green-500/10', btnBorder: 'border-green-400', btnText: 'text-green-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(0,255,136,0.6)]',
  },
  'void-serpent': {
    glow: 'radial-gradient(circle at center, #4488ff 0%, transparent 50%)',
    titleFrom: 'from-blue-300', titleTo: 'to-blue-600',
    stroke: 'rgba(68,136,255,0.5)', shadow: '0 0 40px rgba(68,136,255,0.4)',
    subtitleColor: 'text-blue-400/80',
    btnBg: 'bg-blue-500/10', btnBorder: 'border-blue-400', btnText: 'text-blue-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(68,136,255,0.6)]',
  },
  'glacier-rush': {
    glow: 'radial-gradient(circle at center, #88ddff 0%, transparent 50%)',
    titleFrom: 'from-sky-200', titleTo: 'to-sky-500',
    stroke: 'rgba(136,221,255,0.5)', shadow: '0 0 40px rgba(136,221,255,0.4)',
    subtitleColor: 'text-sky-400/80',
    btnBg: 'bg-sky-500/10', btnBorder: 'border-sky-300', btnText: 'text-sky-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(136,221,255,0.6)]',
  },
  'cyber-tokyo': {
    glow: 'radial-gradient(circle at center, #ff00cc 0%, transparent 50%)',
    titleFrom: 'from-pink-300', titleTo: 'to-pink-700',
    stroke: 'rgba(255,0,204,0.5)', shadow: '0 0 40px rgba(255,0,204,0.4)',
    subtitleColor: 'text-pink-400/80',
    btnBg: 'bg-pink-500/10', btnBorder: 'border-pink-400', btnText: 'text-pink-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(255,0,204,0.6)]',
  },
  'desert-mirage': {
    glow: 'radial-gradient(circle at center, #ff8800 0%, transparent 50%)',
    titleFrom: 'from-orange-300', titleTo: 'to-orange-600',
    stroke: 'rgba(255,136,0,0.5)', shadow: '0 0 40px rgba(255,136,0,0.4)',
    subtitleColor: 'text-orange-400/80',
    btnBg: 'bg-orange-500/10', btnBorder: 'border-orange-400', btnText: 'text-orange-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(255,136,0,0.6)]',
  },
  'storm-peaks': {
    glow: 'radial-gradient(circle at center, #ffff00 0%, transparent 50%)',
    titleFrom: 'from-yellow-200', titleTo: 'to-yellow-500',
    stroke: 'rgba(255,255,0,0.5)', shadow: '0 0 40px rgba(255,255,0,0.4)',
    subtitleColor: 'text-yellow-400/80',
    btnBg: 'bg-yellow-500/10', btnBorder: 'border-yellow-300', btnText: 'text-yellow-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(255,255,0,0.6)]',
  },
  'quantum-loop': {
    glow: 'radial-gradient(circle at center, #00ffcc 0%, transparent 50%)',
    titleFrom: 'from-teal-300', titleTo: 'to-teal-600',
    stroke: 'rgba(0,255,204,0.5)', shadow: '0 0 40px rgba(0,255,204,0.4)',
    subtitleColor: 'text-teal-400/80',
    btnBg: 'bg-teal-500/10', btnBorder: 'border-teal-400', btnText: 'text-teal-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(0,255,204,0.6)]',
  },
  'midnight-harbor': {
    glow: 'radial-gradient(circle at center, #0088ff 0%, transparent 50%)',
    titleFrom: 'from-blue-300', titleTo: 'to-blue-700',
    stroke: 'rgba(0,136,255,0.5)', shadow: '0 0 40px rgba(0,136,255,0.4)',
    subtitleColor: 'text-blue-400/80',
    btnBg: 'bg-blue-500/10', btnBorder: 'border-blue-400', btnText: 'text-blue-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(0,136,255,0.6)]',
  },
  'gravity-shift': {
    glow: 'radial-gradient(circle at center, #ff44ff 0%, transparent 50%)',
    titleFrom: 'from-fuchsia-300', titleTo: 'to-fuchsia-700',
    stroke: 'rgba(255,68,255,0.5)', shadow: '0 0 40px rgba(255,68,255,0.4)',
    subtitleColor: 'text-fuchsia-400/80',
    btnBg: 'bg-fuchsia-500/10', btnBorder: 'border-fuchsia-400', btnText: 'text-fuchsia-300',
    btnHoverShadow: 'hover:shadow-[0_0_30px_rgba(255,68,255,0.6)]',
  },
};

const modes: { id: GameMode; label: string; desc: string }[] = [
  { id: 'RACE', label: 'RACE', desc: 'Standard laps' },
  { id: 'SPRINT', label: 'SPRINT', desc: '1 lap · 2× coins' },
  { id: 'ENDURANCE', label: 'ENDURANCE', desc: 'Extra laps · CR/lap' },
];

const LEVEL_THRESHOLDS = [0,100,250,500,1000,2000,3500,5500,8000,12000,17000,25000,35000,50000];

export default function Menu() {
  const { startGame, state, selectedTrackId, setSelectedTrackId, credits, selectedCarId, setState, gameMode, setGameMode, xp, level, streakDays, dailyChallengeCompletedDate, personalBests } = useGameState();

  if (state !== 'MENU') return null;

  const selectedCar = getCarById(selectedCarId);
  const theme = TRACK_THEME[selectedTrackId] ?? TRACK_THEME['neon-circuit'];
  const track = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];

  const currentLevelXp = LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length-1)];
  const nextLevelXp = LEVEL_THRESHOLDS[Math.min(level+1, LEVEL_THRESHOLDS.length-1)];
  const xpProgress = nextLevelXp > currentLevelXp ? (xp - currentLevelXp)/(nextLevelXp - currentLevelXp) : 1;

  const daily = getDailyChallenge();
  const dailyTrack = TRACKS.find(t => t.id === daily.trackId);
  const todayStr = new Date().toDateString();
  const dailyDone = dailyChallengeCompletedDate === todayStr;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms/1000); 
    const m = Math.floor(s/60);
    const ss = s%60;
    const ms2 = Math.floor((ms%1000)/10);
    return `${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}.${ms2.toString().padStart(2,'0')}`;
  };

  return (
    <div className="min-w-[100vw] min-h-[100vh] overflow-y-auto bg-[#050510] flex flex-col items-center py-16 relative font-sans transition-all duration-700">
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none fixed transition-all duration-700"
        style={{ backgroundImage: theme.glow }}
      />
      
      <div className="absolute top-6 right-8 z-20 text-yellow-400 font-bold text-xl tracking-widest bg-black/40 px-4 py-2 border border-yellow-500/30 rounded shadow-[0_0_15px_rgba(255,215,0,0.2)]">
        {credits.toLocaleString()} CR
      </div>
      
      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6">
        <h1
          className={`text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b ${theme.titleFrom} ${theme.titleTo} mb-2 font-display text-center transition-all duration-500`}
          style={{ WebkitTextStroke: `1px ${theme.stroke}`, textShadow: theme.shadow }}
        >
          {track.name.toUpperCase()}
        </h1>
        <p className={`${theme.subtitleColor} tracking-[0.3em] font-bold mb-1 transition-colors duration-500`}>HYPER-VELOCITY RACING</p>
        <p className="text-white/35 text-sm tracking-widest italic mb-8">A JizXMiz Game</p>

        {dailyTrack && (
          <div 
            onClick={() => {
              setSelectedTrackId(daily.trackId);
              setGameMode(daily.mode);
            }}
            className="mb-8 border border-yellow-500/50 bg-yellow-900/20 text-yellow-300 tracking-widest rounded-xl px-6 py-3 text-center cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:bg-yellow-900/40 transition-colors"
          >
            ⭐ DAILY CHALLENGE: {dailyTrack.name} · {daily.mode} {dailyDone && <span className="ml-2 bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">✓ COMPLETED</span>}
          </div>
        )}

        <div className="flex gap-4 mb-6 w-full justify-center">
          {modes.map(m => {
            const isSelected = gameMode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setGameMode(m.id)}
                className="cursor-pointer border-2 bg-black/40 rounded-xl px-6 py-3 flex flex-col items-center transition-all duration-300"
                style={{
                  borderColor: isSelected ? track.primaryColor : 'rgba(255,255,255,0.1)',
                  boxShadow: isSelected ? `0 0 15px ${track.primaryColor}66` : 'none',
                }}
              >
                <div className="tracking-widest font-bold text-sm" style={{ color: isSelected ? track.primaryColor : 'rgba(255,255,255,0.7)' }}>{m.label}</div>
                <div className="text-[10px] text-white/50">{m.desc}</div>
              </div>
            );
          })}
        </div>

        <div className="w-full mb-8">
          <div className="grid grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 pb-1 custom-scrollbar">
            {TRACKS.map(t => {
              const isSelected = t.id === selectedTrackId;
              const pbKey = `${t.id}-${gameMode.toLowerCase()}`;
              const pb = personalBests[pbKey];
              const isDaily = daily.trackId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`relative cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center transition-all duration-300 bg-black/40 backdrop-blur-sm ${isSelected ? 'scale-105 z-10' : 'hover:bg-white/5'}`}
                  style={{
                    borderColor: isSelected ? t.primaryColor : 'rgba(255,255,255,0.1)',
                    boxShadow: isSelected ? `0 0 20px ${t.primaryColor}80` : 'none'
                  }}
                >
                  {isDaily && <div className="absolute top-2 right-2 text-xs">⭐</div>}
                  <div className="font-display text-sm font-bold mb-1 text-center" style={{ color: t.primaryColor }}>
                    {t.name}
                  </div>
                  <div className="flex gap-1 mb-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-bold">{t.difficulty}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-bold">{t.laps} LAPS</span>
                  </div>
                  <p className="text-xs text-center text-white/50 truncate w-full mb-1">{t.flavor}</p>
                  {pb ? (
                    <div className="text-[10px] font-mono font-bold text-green-400 mt-auto">PB {formatTime(pb)}</div>
                  ) : (
                    <div className="text-[10px] text-transparent mt-auto">-</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex gap-6">
            <button
              onClick={startGame}
              className={`px-12 py-4 ${theme.btnBg} border-2 ${theme.btnBorder} ${theme.btnText} font-bold text-2xl tracking-widest rounded-lg hover:text-black transition-all duration-300 ${theme.btnHoverShadow} uppercase font-display`}
              style={{ '--hover-bg': track.primaryColor } as React.CSSProperties}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = track.primaryColor; (e.currentTarget as HTMLButtonElement).style.color = '#000'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ''; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
            >
              START ENGINE
            </button>
            <button
              onClick={() => setState('GARAGE')}
              className="px-8 py-4 bg-purple-500/10 border-2 border-purple-400 text-purple-300 font-bold text-xl tracking-widest rounded-lg hover:bg-purple-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] uppercase font-display"
            >
              GARAGE
            </button>
          </div>
          <div className="text-sm tracking-widest font-bold uppercase mt-2 transition-colors duration-500" style={{ color: track.primaryColor + 'cc' }}>
            VEHICLE: {selectedCar.name}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8 w-full max-w-2xl bg-black/40 p-4 rounded-xl border border-white/10">
          <div className="text-sm font-bold tracking-widest" style={{ color: track.primaryColor }}>LVL {level}</div>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(xpProgress*100)}%`, background: track.primaryColor }} />
          </div>
          <div className="text-xs text-white/40 font-mono">{xp} XP</div>
          {streakDays > 1 && <div className="text-xs font-bold text-orange-400">🔥 {streakDays}d</div>}
        </div>

        <Leaderboard trackId={selectedTrackId} trackColor={track.primaryColor} />
      </div>
    </div>
  );
}
