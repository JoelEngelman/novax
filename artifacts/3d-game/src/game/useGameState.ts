import { create } from 'zustand';
import { TRACKS } from './tracks';

export type GameMode = 'RACE' | 'SPRINT' | 'ENDURANCE';

const LEVEL_XP = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000, 25000, 35000, 50000];

export function xpToLevel(xp: number): number {
  let lv = 0;
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) lv = i;
  }
  return lv;
}

export function xpForNextLevel(level: number): number {
  return LEVEL_XP[Math.min(level + 1, LEVEL_XP.length - 1)];
}

export interface DailyChallenge {
  trackId: string;
  mode: GameMode;
  dateStr: string;
}

export function getDailyChallenge(): DailyChallenge {
  const dayNum = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const trackIdx = dayNum % TRACKS.length;
  const modes: GameMode[] = ['RACE', 'SPRINT', 'ENDURANCE'];
  const modeIdx = dayNum % 3;
  return {
    trackId: TRACKS[trackIdx].id,
    mode: modes[modeIdx],
    dateStr: new Date().toDateString(),
  };
}

interface GameState {
  state: 'MENU' | 'RACING' | 'FINISHED' | 'GARAGE';
  gameMode: GameMode;
  selectedTrackId: string;
  lapFlash: boolean;
  lap: number;
  maxLaps: number;
  speed: number;
  timeMs: number;
  boostActive: boolean;
  activeBoostTier: 'common' | 'rare' | 'legendary' | null;
  activeChests: string[];
  chestNotification: string | null;
  coinNotification: boolean;
  startTime: number | null;
  endTime: number | null;
  credits: number;
  ownedCars: string[];
  selectedCarId: string;
  creditsEarned: number;
  carX: number;
  carZ: number;
  collectedCoins: string[];
  // Progression
  xp: number;
  level: number;
  xpEarned: number;
  leveledUp: boolean;
  personalBests: Record<string, number>; // key: `${trackId}-${mode}`
  newPersonalBest: boolean;
  streakDays: number;
  lastPlayedDate: string;
  // Daily challenge
  dailyChallengeCompletedDate: string;
  // Actions
  setState: (state: 'MENU' | 'RACING' | 'FINISHED' | 'GARAGE') => void;
  setGameMode: (mode: GameMode) => void;
  setSelectedTrackId: (id: string) => void;
  setLapFlash: (lapFlash: boolean) => void;
  setLap: (lap: number) => void;
  setSpeed: (speed: number) => void;
  setTimeMs: (time: number) => void;
  setCarPos: (x: number, z: number) => void;
  setBoostActive: (active: boolean) => void;
  setActiveBoostTier: (tier: 'common' | 'rare' | 'legendary' | null) => void;
  setActiveChests: (ids: string[]) => void;
  collectChest: (id: string) => void;
  collectCoin: (id: string) => void;
  setChestNotification: (msg: string | null) => void;
  setCoinNotification: (v: boolean) => void;
  startGame: () => void;
  finishGame: () => void;
  resetGame: () => void;
  setSelectedCarId: (id: string) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  unlockCar: (carId: string) => void;
  setCreditsEarned: (n: number) => void;
}

// ── Persist helpers ────────────────────────────────────────────────────────
function ls(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

const initCredits = Number(ls('neon-credits', '0')) || 0;
const initOwnedCars = lsJson<string[]>('neon-owned', ['phantom-x1']);
const initSelectedCarId = ls('neon-selected-car', 'phantom-x1');
const initXp = Number(ls('neon-xp', '0')) || 0;
const initPersonalBests = lsJson<Record<string, number>>('neon-personal-bests', {});
const initStreakDays = Number(ls('neon-streak', '0')) || 0;
const initLastPlayedDate = ls('neon-last-played', '');
const initDailyCompletedDate = ls('neon-daily-completed', '');

export const useGameState = create<GameState>((set, get) => ({
  state: 'MENU',
  gameMode: 'RACE',
  selectedTrackId: 'neon-circuit',
  lapFlash: false,
  lap: 1,
  maxLaps: 3,
  speed: 0,
  timeMs: 0,
  boostActive: false,
  activeBoostTier: null,
  activeChests: [],
  chestNotification: null,
  coinNotification: false,
  startTime: null,
  endTime: null,
  credits: initCredits,
  ownedCars: initOwnedCars,
  selectedCarId: initSelectedCarId,
  creditsEarned: 0,
  carX: 0,
  carZ: 0,
  collectedCoins: [],
  xp: initXp,
  level: xpToLevel(initXp),
  xpEarned: 0,
  leveledUp: false,
  personalBests: initPersonalBests,
  newPersonalBest: false,
  streakDays: initStreakDays,
  lastPlayedDate: initLastPlayedDate,
  dailyChallengeCompletedDate: initDailyCompletedDate,

  setState: (state) => set({ state }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setLapFlash: (lapFlash) => set({ lapFlash }),
  setLap: (lap) => set(() => {
    const isAlt = lap % 2 === 0;
    return { lap, activeChests: isAlt ? ['chest-1','chest-3'] : ['chest-0','chest-2'], collectedCoins: [] };
  }),
  setSpeed: (speed) => set({ speed }),
  setTimeMs: (timeMs) => set({ timeMs }),
  setCarPos: (x, z) => set({ carX: x, carZ: z }),
  setBoostActive: (boostActive) => set({ boostActive }),
  setActiveBoostTier: (tier) => set({ activeBoostTier: tier }),
  setActiveChests: (ids) => set({ activeChests: ids }),
  setChestNotification: (msg) => set({ chestNotification: msg }),
  setCoinNotification: (v) => set({ coinNotification: v }),

  collectCoin: (id) => set(state => {
    if (state.collectedCoins.includes(id)) return state;
    const idx = parseInt(id.split('-')[1]);
    const base = (idx % 2 === 0) ? 25 : 50;
    const reward = state.gameMode === 'SPRINT' ? base * 2 : base;
    const next = state.credits + reward;
    lsSet('neon-credits', String(next));
    setTimeout(() => useGameState.getState().setCoinNotification(false), 1200);
    return { collectedCoins: [...state.collectedCoins, id], credits: next, coinNotification: true };
  }),

  collectChest: (id) => set(state => {
    const nextChests = state.activeChests.filter(c => c !== id);
    const mod = Date.now() % 4;
    const rewards = [250, 500, 1000, 750];
    const msgs = ['+250 CR', '+500 CR', '+1000 CR', '+750 CR'];
    const nextCredits = state.credits + rewards[mod];
    lsSet('neon-credits', String(nextCredits));
    setTimeout(() => useGameState.getState().setChestNotification(null), 2500);
    return { activeChests: nextChests, chestNotification: msgs[mod], credits: nextCredits };
  }),

  startGame: () => {
    const { selectedTrackId, gameMode } = get();
    const track = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];
    const maxLaps = gameMode === 'SPRINT' ? 1 : gameMode === 'ENDURANCE' ? track.laps + 2 : track.laps;
    set({
      state: 'RACING', lap: 1, maxLaps, speed: 0, timeMs: 0,
      startTime: Date.now(), endTime: null, boostActive: false, activeBoostTier: null,
      lapFlash: false, activeChests: ['chest-0','chest-2'], collectedCoins: [],
      xpEarned: 0, leveledUp: false, newPersonalBest: false,
    });
  },

  finishGame: () => {
    const { selectedTrackId, gameMode, timeMs, maxLaps, personalBests, xp, level, streakDays, lastPlayedDate, dailyChallengeCompletedDate, credits } = get();

    // Personal best (key = trackId-mode)
    const pbKey = `${selectedTrackId}-${gameMode.toLowerCase()}`;
    const prevBest = personalBests[pbKey];
    const newBest = !prevBest || timeMs < prevBest;
    const nextBests = newBest ? { ...personalBests, [pbKey]: timeMs } : personalBests;
    if (newBest) lsSet('neon-personal-bests', JSON.stringify(nextBests));

    // XP award
    const baseXp = gameMode === 'SPRINT' ? 75 : gameMode === 'ENDURANCE' ? maxLaps * 20 : 50 + maxLaps * 10;
    const pbBonus = newBest ? 100 : 0;
    const earnedXp = baseXp + pbBonus;
    const newXp = xp + earnedXp;
    const newLevel = xpToLevel(newXp);
    const didLevelUp = newLevel > level;
    lsSet('neon-xp', String(newXp));

    // Streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = streakDays;
    if (lastPlayedDate !== today) {
      newStreak = lastPlayedDate === yesterday ? streakDays + 1 : 1;
    }
    lsSet('neon-streak', String(newStreak));
    lsSet('neon-last-played', today);

    // Streak CR bonus
    let streakBonus = 0;
    if (lastPlayedDate !== today) {
      if (newStreak === 3) streakBonus = 300;
      else if (newStreak === 7) streakBonus = 1000;
      else if (newStreak === 30) streakBonus = 5000;
      else if (newStreak > 1) streakBonus = 100;
    }

    // Daily challenge bonus
    const daily = getDailyChallenge();
    const isDailyCompleted = dailyChallengeCompletedDate === today;
    const isDaily = daily.trackId === selectedTrackId && daily.mode === gameMode && !isDailyCompleted;
    const dailyBonus = isDaily ? 500 : 0;
    const nextDailyDate = isDaily ? today : dailyChallengeCompletedDate;

    // Level-up CR reward
    const levelCrBonus = didLevelUp ? newLevel * 500 : 0;

    const totalBonus = streakBonus + dailyBonus + levelCrBonus;
    const nextCredits = credits + totalBonus;
    if (totalBonus > 0) lsSet('neon-credits', String(nextCredits));

    set({
      state: 'FINISHED', endTime: Date.now(),
      personalBests: nextBests, newPersonalBest: newBest,
      xp: newXp, level: newLevel, xpEarned: earnedXp, leveledUp: didLevelUp,
      streakDays: newStreak, lastPlayedDate: today,
      dailyChallengeCompletedDate: nextDailyDate,
      credits: nextCredits,
    });
  },

  resetGame: () => set({
    state: 'MENU', lap: 1, speed: 0, timeMs: 0,
    startTime: null, endTime: null, boostActive: false,
    lapFlash: false, collectedCoins: [], xpEarned: 0, leveledUp: false, newPersonalBest: false,
  }),

  setSelectedCarId: (id: string) => {
    lsSet('neon-selected-car', id);
    set({ selectedCarId: id });
  },
  addCredits: (amount: number) => set(state => {
    const next = state.credits + amount;
    lsSet('neon-credits', String(next));
    return { credits: next };
  }),
  spendCredits: (amount: number) => {
    const { credits } = get();
    if (credits < amount) return false;
    const next = credits - amount;
    lsSet('neon-credits', String(next));
    set({ credits: next });
    return true;
  },
  unlockCar: (carId: string) => set(state => {
    if (state.ownedCars.includes(carId)) return state;
    const next = [...state.ownedCars, carId];
    lsSet('neon-owned', JSON.stringify(next));
    return { ownedCars: next };
  }),
  setCreditsEarned: (n: number) => set({ creditsEarned: n }),
}));
