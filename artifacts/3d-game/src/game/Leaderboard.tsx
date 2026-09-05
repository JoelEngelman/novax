import { useGetLeaderboard } from '@workspace/api-client-react';

const GHOST_PILOTS: Record<string, { name: string; timeMs: number }[]> = {
  'neon-circuit': [
    { name: 'NOVA_X',    timeMs: 94230 },
    { name: 'BLAZE_99',  timeMs: 98410 },
    { name: 'SPECTR',    timeMs: 103780 },
    { name: 'RYZE',      timeMs: 108200 },
    { name: 'LUMIN',     timeMs: 115900 },
  ],
  'volcanic-rift': [
    { name: 'INFERNO',   timeMs: 127450 },
    { name: 'PYREX',     timeMs: 131230 },
    { name: 'ASHWING',   timeMs: 138700 },
    { name: 'CINDER',    timeMs: 144010 },
    { name: 'MAGMAR',    timeMs: 151880 },
  ],
  'crystal-abyss': [
    { name: 'VOIDRUN',   timeMs: 198340 },
    { name: 'NEXORA',    timeMs: 204210 },
    { name: 'PHNTM',     timeMs: 211650 },
    { name: 'ABYSSAL',   timeMs: 219900 },
    { name: 'CRYST_X',   timeMs: 228440 },
  ],
  'solar-storm': [
    { name: 'SOLAR_FLR', timeMs: 125000 },
    { name: 'SUNSPOT',   timeMs: 130000 },
    { name: 'HELIO',     timeMs: 135000 },
    { name: 'CORONA',    timeMs: 140000 },
    { name: 'APOLLO',    timeMs: 145000 },
  ],
  'void-serpent': [
    { name: 'VOID_W',    timeMs: 205000 },
    { name: 'SERPENT_X', timeMs: 215000 },
    { name: 'DARK_M',    timeMs: 220000 },
    { name: 'NULL_P',    timeMs: 225000 },
    { name: 'ABYSS',     timeMs: 230000 },
  ],
  'glacier-rush': [
    { name: 'FROST_X',   timeMs: 90000 },
    { name: 'ICE_RUN',   timeMs: 95000 },
    { name: 'BLIZZARD',  timeMs: 100000 },
    { name: 'CHILL',     timeMs: 105000 },
    { name: 'GLACIER_9', timeMs: 110000 },
  ],
  'cyber-tokyo': [
    { name: 'NEON_SAM',  timeMs: 125000 },
    { name: 'CYBER_X',   timeMs: 130000 },
    { name: 'RONIN',     timeMs: 135000 },
    { name: 'GLITCH',    timeMs: 140000 },
    { name: 'BYTE',      timeMs: 145000 },
  ],
  'desert-mirage': [
    { name: 'SAND_ST',   timeMs: 85000 },
    { name: 'DUNE_R',    timeMs: 90000 },
    { name: 'OASIS',     timeMs: 95000 },
    { name: 'MIRAGE_X',  timeMs: 100000 },
    { name: 'SCORCH',    timeMs: 105000 },
  ],
  'storm-peaks': [
    { name: 'THUNDER',   timeMs: 195000 },
    { name: 'LIGHTNING', timeMs: 205000 },
    { name: 'STORM_W',   timeMs: 215000 },
    { name: 'VOLT',      timeMs: 225000 },
    { name: 'SPARK',     timeMs: 235000 },
  ],
  'quantum-loop': [
    { name: 'QUARK',     timeMs: 200000 },
    { name: 'ENTANG',    timeMs: 210000 },
    { name: 'WAVE_P',    timeMs: 220000 },
    { name: 'PARTICLE',  timeMs: 230000 },
    { name: 'Q_JUMP',    timeMs: 240000 },
  ],
  'midnight-harbor': [
    { name: 'NIGHT_R',   timeMs: 120000 },
    { name: 'DOCK_X',    timeMs: 125000 },
    { name: 'WAVE_R',    timeMs: 130000 },
    { name: 'TIDE',      timeMs: 135000 },
    { name: 'MOON_B',    timeMs: 140000 },
  ],
  'gravity-shift': [
    { name: 'ZERO_G',    timeMs: 205000 },
    { name: 'GRAV_X',    timeMs: 215000 },
    { name: 'FALL_N',    timeMs: 225000 },
    { name: 'MASS_W',    timeMs: 235000 },
    { name: 'WARP',      timeMs: 245000 },
  ],
};

export function Leaderboard({ trackId, trackColor }: { trackId: string; trackColor: string }) {
  const { data: entries, isLoading } = useGetLeaderboard();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="text-cyan-500 animate-pulse text-center">Loading Leaderboard...</div>;
  }

  const trackEntries = entries?.filter(e => e.track === trackId).sort((a, b) => a.raceTimeMs - b.raceTimeMs) ?? [];
  const displayEntries = trackEntries.length > 0 
    ? trackEntries.slice(0, 5).map(e => ({ name: e.playerName, timeMs: e.raceTimeMs, isGhost: false, id: e.id }))
    : (GHOST_PILOTS[trackId] || []).slice(0, 5).map((e, idx) => ({ name: e.name, timeMs: e.timeMs, isGhost: true, id: `ghost-${idx}` }));

  if (displayEntries.length === 0) {
    return <div className="text-slate-400 text-center">No times recorded yet. Be the first!</div>;
  }

  return (
    <div className="w-full max-w-md bg-black/60 rounded-xl overflow-hidden backdrop-blur-md" style={{ border: `1px solid ${trackColor}4d` }}>
      <div className="p-3" style={{ backgroundColor: `${trackColor}26`, borderBottom: `1px solid ${trackColor}4d` }}>
        <h3 className="font-bold tracking-widest text-center" style={{ color: trackColor }}>TOP PILOTS</h3>
      </div>
      <div className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: `${trackColor}1a`, color: trackColor }}>
              <th className="px-4 py-2 text-left">RANK</th>
              <th className="px-4 py-2 text-left">NAME</th>
              <th className="px-4 py-2 text-right">TIME</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map((entry, idx) => (
              <tr key={entry.id} className="border-b transition-colors" style={{ borderColor: `${trackColor}1a` }}>
                <td className="px-4 py-3 font-bold" style={{ color: trackColor }}>#{idx + 1}</td>
                <td className="px-4 py-3 text-white font-medium truncate max-w-[120px]">
                  {entry.isGhost ? <span className="mr-1 text-xs opacity-50" style={{ color: trackColor }}>◈</span> : null}
                  {entry.name}
                </td>
                <td className="px-4 py-3 text-right font-mono tracking-wider" style={{ color: trackColor }}>{formatTime(entry.timeMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
