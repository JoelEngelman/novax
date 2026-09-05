import { useState, useEffect, useRef } from 'react';
import { useGameState, getDailyChallenge } from '../game/useGameState';
import { useSubmitScore, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Leaderboard } from '../game/Leaderboard';
import { TRACKS } from '../game/tracks';

export default function Finish() {
  const { state, timeMs, resetGame, selectedTrackId, maxLaps, addCredits, setCreditsEarned, creditsEarned, gameMode, xpEarned, leveledUp, level, newPersonalBest, personalBests, streakDays, dailyChallengeCompletedDate } = useGameState();
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const submitScore = useSubmitScore();
  const track = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];
  const awardProcessed = useRef(false);

  useEffect(() => {
    if (state === 'FINISHED' && !awardProcessed.current) {
      awardProcessed.current = true;
      let base = 200 * maxLaps;
      const diffMult = track.difficulty === 'HARD' ? 1.7 : track.difficulty === 'MEDIUM' ? 1.35 : 1.0;
      let earned = base * diffMult;
      if (timeMs < 90000) earned += 500;
      else if (timeMs < 120000) earned += 250;
      
      earned = Math.round(earned / 10) * 10;
      addCredits(earned);
      setCreditsEarned(earned);
    }
  }, [state, maxLaps, track.difficulty, timeMs, addCredits, setCreditsEarned]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submitted) return;

    submitScore.mutate(
      { 
        data: { 
          playerName: playerName.trim().substring(0, 20), 
          raceTimeMs: timeMs, 
          laps: track.laps, 
          track: track.id 
        } 
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        }
      }
    );
  };

  if (state !== 'FINISHED') return null;

  const daily = getDailyChallenge();
  const todayStr = new Date().toDateString();
  const completedDaily = dailyChallengeCompletedDate === todayStr && daily.trackId === selectedTrackId && daily.mode === gameMode;

  return (
    <div className="min-h-screen w-screen bg-[#050510] flex flex-col items-center justify-center relative overflow-y-auto font-sans py-16">
      <div className="absolute inset-0 z-0 opacity-20 fixed pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at center, ${track.secondaryColor} 0%, transparent 50%)` }} />
      
      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-violet-300 to-violet-600 mb-2 font-display text-center" style={{ textShadow: `0 0 40px ${track.secondaryColor}80` }}>
          RACE COMPLETE
        </h1>
        <p className="text-violet-400 tracking-widest font-bold mb-8">TRACK: {track.name.toUpperCase()} · {gameMode}</p>
        
        <div className="text-5xl text-white font-mono tracking-wider font-bold mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black/40 px-8 py-4 rounded-xl border border-violet-500/30">
          {formatTime(timeMs)}
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-4">
          {newPersonalBest && (
            <div className="px-4 py-2 bg-green-900/30 border border-green-400/60 rounded-lg text-green-300 font-bold text-sm tracking-widest">
              🏆 NEW PERSONAL BEST!
            </div>
          )}
          {leveledUp && (
            <div className="px-4 py-2 bg-purple-900/30 border border-purple-400/60 rounded-lg text-purple-300 font-bold text-sm tracking-widest">
              ⬆ LEVEL UP → {level}
            </div>
          )}
          {completedDaily && (
            <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-400/60 rounded-lg text-yellow-300 font-bold text-sm tracking-widest">
              ⭐ DAILY CHALLENGE COMPLETE!
            </div>
          )}
          {streakDays > 1 && (
            <div className="px-4 py-2 bg-orange-900/30 border border-orange-400/60 rounded-lg text-orange-300 font-bold text-sm tracking-widest">
              🔥 {streakDays} DAY STREAK
            </div>
          )}
        </div>

        <div className="text-2xl text-yellow-400 font-black tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
          CREDITS EARNED: +{creditsEarned.toLocaleString()} CR
        </div>

        {xpEarned > 0 && (
          <div className="text-lg text-purple-300 font-bold tracking-widest mb-12">
            +{xpEarned} XP EARNED
          </div>
        )}

        {!submitted ? (
          <>
            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4 mb-4">
              <div>
                <label className="block text-violet-400 text-sm tracking-widest font-bold mb-2 uppercase">Pilot Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  placeholder="ENTER NAME"
                  className="w-full bg-black/60 border-2 border-violet-500/50 rounded-lg px-4 py-3 text-white font-bold tracking-wider focus:outline-none focus:border-violet-400 focus:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all uppercase"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={submitScore.isPending || !playerName.trim()}
                className="w-full px-8 py-4 bg-violet-600 text-white font-bold text-xl tracking-widest rounded-lg hover:bg-violet-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] uppercase disabled:opacity-50 disabled:cursor-not-allowed font-display mt-2"
              >
                {submitScore.isPending ? 'SUBMITTING...' : 'RECORD TIME'}
              </button>
            </form>
            <button onClick={resetGame} className="text-sm text-white/40 hover:text-white/70 tracking-widest underline transition-colors mb-12">
              SKIP &amp; RETURN TO MENU
            </button>
          </>
        ) : (
          <div className="w-full max-w-md mb-12 flex flex-col items-center">
            <div className="text-green-400 font-bold tracking-widest mb-6 px-6 py-3 bg-green-900/20 border border-green-500/50 rounded-lg">
              TIME RECORDED
            </div>
            <button 
              onClick={resetGame}
              className="w-full px-8 py-4 bg-cyan-600 text-white font-bold text-xl tracking-widest rounded-lg hover:bg-cyan-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] uppercase font-display"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        <Leaderboard trackId={selectedTrackId} trackColor={track.primaryColor} />
      </div>
    </div>
  );
}
