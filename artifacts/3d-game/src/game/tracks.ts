import * as THREE from 'three';

export interface TrackDef {
  id: string;
  name: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  laps: number;
  primaryColor: string;
  secondaryColor: string;
  fogColor: string;
  ambientColor: string;
  points: [number, number, number][];
  boostPads: [number, number, number][];
  rareBoostPads?: [number, number, number][];
  legendaryBoostPad?: [number, number, number];
  chestSpots?: [number, number, number][];
  coinSpots?: [number, number, number][];
  startPos: [number, number, number];
  startYaw: number;
  flavor: string;
}

export function onTrackPositions(
  trackPoints: [number, number, number][],
  params: Array<{ t: number; side?: number }>
): [number, number, number][] {
  const pts = trackPoints.map(p => new THREE.Vector3(p[0], 0, p[2]));
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return params.map(({ t, side = 0 }) => {
    const pos = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const perp = new THREE.Vector3(-tan.z, 0, tan.x);
    const offset = side * 8;
    return [pos.x + perp.x * offset, 1, pos.z + perp.z * offset] as [number, number, number];
  });
}

// ── Track point arrays ─────────────────────────────────────────────────────
const neonPoints: [number, number, number][] = [
  [0,0,100],[100,0,100],[150,0,50],[150,0,-50],[100,0,-100],
  [-100,0,-100],[-150,0,-50],[-150,0,50],[-100,0,100],[0,0,100],
];
const volcanicPoints: [number, number, number][] = [
  [0,0,120],[120,0,120],[180,0,80],[150,0,0],[180,0,-80],
  [120,0,-120],[0,0,-120],[-50,0,-50],[-120,0,-120],[-180,0,-80],
  [-150,0,0],[-180,0,80],[-120,0,120],[0,0,120],
];
const crystalPoints: [number, number, number][] = [
  [0,0,150],[80,0,150],[150,0,200],[200,0,100],[100,0,50],
  [200,0,0],[150,0,-100],[200,0,-200],[80,0,-150],[0,0,-100],
  [-80,0,-150],[-200,0,-200],[-150,0,-100],[-200,0,0],[-100,0,50],
  [-200,0,100],[-150,0,200],[-80,0,150],[0,0,150],
];
const solarPoints: [number, number, number][] = [
  [0,0,160],[100,0,160],[180,0,100],[200,0,0],[180,0,-100],[100,0,-160],
  [0,0,-160],[-100,0,-160],[-180,0,-100],[-200,0,0],[-180,0,100],[-100,0,160],[0,0,160],
];
const voidPoints: [number, number, number][] = [
  [0,0,180],[80,0,160],[140,0,100],[160,0,20],[120,0,-60],[60,0,-120],
  [0,0,-140],[-80,0,-120],[-140,0,-60],[-160,0,20],[-120,0,100],[-60,0,160],[0,0,180],
];
const glacierPoints: [number, number, number][] = [
  [0,0,130],[90,0,140],[160,0,100],[180,0,20],[160,0,-70],
  [90,0,-140],[0,0,-160],[-90,0,-140],[-160,0,-70],[-180,0,20],
  [-160,0,100],[-90,0,140],[0,0,130],
];
const cyberPoints: [number, number, number][] = [
  [0,0,110],[80,0,110],[120,0,60],[120,0,10],[70,0,-30],[120,0,-70],
  [80,0,-120],[0,0,-140],[-80,0,-120],[-120,0,-70],[-70,0,-30],
  [-120,0,10],[-120,0,60],[-80,0,110],[0,0,110],
];
const desertPoints: [number, number, number][] = [
  [0,0,150],[130,0,140],[210,0,70],[220,0,-40],[160,0,-140],
  [0,0,-170],[-160,0,-140],[-220,0,-40],[-210,0,70],[-130,0,140],[0,0,150],
];
const stormPoints: [number, number, number][] = [
  [0,0,160],[100,0,160],[150,0,90],[100,0,20],[160,0,-50],
  [100,0,-130],[0,0,-170],[-100,0,-130],[-160,0,-50],
  [-100,0,20],[-150,0,90],[-100,0,160],[0,0,160],
];
const quantumPoints: [number, number, number][] = [
  [0,0,190],[80,0,170],[130,0,110],[160,0,30],[100,0,-50],
  [40,0,-10],[0,0,-70],[-40,0,-10],[-100,0,-50],[-160,0,30],
  [-130,0,110],[-80,0,170],[0,0,190],
];
const harborPoints: [number, number, number][] = [
  [0,0,140],[100,0,130],[170,0,70],[180,0,-20],[120,0,-110],
  [0,0,-150],[-120,0,-110],[-180,0,-20],[-170,0,70],[-100,0,130],[0,0,140],
];
const gravityPoints: [number, number, number][] = [
  [0,0,200],[110,0,160],[150,0,80],[90,0,0],[160,0,-80],
  [90,0,-160],[0,0,-200],[-90,0,-160],[-160,0,-80],
  [-90,0,0],[-150,0,80],[-110,0,160],[0,0,200],
];

const phantomPoints: [number, number, number][] = [
  [0,0,120],[80,0,140],[140,0,100],[160,0,40],[120,0,-20],[80,0,-80],
  [40,0,-120],[0,0,-140],[-40,0,-120],[-80,0,-80],[-120,0,-20],[-160,0,40],
  [-140,0,100],[-80,0,140],[0,0,120],
];
const oasisPoints: [number, number, number][] = [
  [0,0,180],[80,0,170],[150,0,130],[190,0,70],[200,0,0],[190,0,-70],
  [150,0,-130],[80,0,-170],[0,0,-180],[-80,0,-170],[-150,0,-130],[-190,0,-70],
  [-200,0,0],[-190,0,70],[-150,0,130],[-80,0,170],[0,0,180],
];
const eclipsePoints: [number, number, number][] = [
  [0,0,220],[120,0,180],[180,0,100],[200,0,0],[180,0,-100],[120,0,-180],
  [0,0,-220],[-120,0,-180],[-180,0,-100],[-200,0,0],[-180,0,100],[-120,0,180],[0,0,220],
];
const tundraPoints: [number, number, number][] = [
  [0,0,140],[60,0,160],[130,0,120],[170,0,60],[160,0,0],[170,0,-60],[130,0,-120],
  [60,0,-160],[0,0,-140],[-60,0,-120],[-120,0,-60],[-140,0,0],[-120,0,60],[-60,0,120],[0,0,140],
];
const nebulaPoints: [number, number, number][] = [
  [0,0,170],[50,0,190],[120,0,180],[170,0,140],[190,0,80],[160,0,20],[120,0,-20],
  [80,0,-70],[40,0,-120],[0,0,-140],[-40,0,-120],[-80,0,-70],[-120,0,-20],[-160,0,20],
  [-190,0,80],[-170,0,140],[-120,0,180],[-50,0,190],[0,0,170],
];
const canyonPoints: [number, number, number][] = [
  [0,0,180],[90,0,160],[160,0,120],[200,0,60],[170,0,0],[200,0,-60],[160,0,-120],
  [90,0,-160],[0,0,-180],[-90,0,-160],[-160,0,-120],[-200,0,-60],[-170,0,0],[-200,0,60],
  [-160,0,120],[-90,0,160],[0,0,180],
];
const auroraPoints: [number, number, number][] = [
  [0,0,130],[70,0,150],[120,0,120],[160,0,80],[200,0,20],[180,0,-60],[150,0,-110],
  [100,0,-150],[40,0,-170],[0,0,-160],[-40,0,-170],[-100,0,-150],[-150,0,-110],[-180,0,-60],
  [-200,0,20],[-160,0,80],[-120,0,120],[-70,0,150],[0,0,130],
];
const infernoPoints: [number, number, number][] = [
  [0,0,140],[80,0,170],[150,0,160],[180,0,120],[170,0,60],[140,0,10],[120,0,-40],
  [160,0,-90],[180,0,-150],[120,0,-170],[60,0,-150],[0,0,-120],[-60,0,-150],[-120,0,-170],
  [-180,0,-150],[-160,0,-90],[-120,0,-40],[-140,0,10],[-170,0,60],[-180,0,120],
  [-150,0,160],[-80,0,170],[0,0,140],
];

// ── Helper for consistent item placement ──────────────────────────────────
function standardItems(pts: [number,number,number][], boostCount = 3, coinCount = 8, chestCount = 4, rare = 1, legendary = true) {
  const step = 1 / boostCount;
  const boostTs = Array.from({length: boostCount}, (_, i) => ({ t: 0.1 + i * step, side: 0 }));
  const coinStep = 1 / coinCount;
  const coinTs = Array.from({length: coinCount}, (_, i) => ({ t: 0.04 + i * coinStep, side: (i % 2 === 0 ? 0.5 : -0.5) }));
  const chestStep = 1 / chestCount;
  const chestTs = Array.from({length: chestCount}, (_, i) => ({ t: 0.15 + i * chestStep, side: (i % 2 === 0 ? 0.6 : -0.6) }));
  const rareTs = Array.from({length: rare}, (_, i) => ({ t: 0.25 + i * 0.4, side: 0.5 }));
  return {
    boostPads: onTrackPositions(pts, boostTs),
    rareBoostPads: onTrackPositions(pts, rareTs),
    legendaryBoostPad: legendary ? onTrackPositions(pts, [{ t: 0.72, side: -0.5 }])[0] : undefined,
    chestSpots: onTrackPositions(pts, chestTs),
    coinSpots: onTrackPositions(pts, coinTs),
  };
}

export const TRACKS: TrackDef[] = [
  {
    id: 'neon-circuit', name: 'Neon Circuit', difficulty: 'EASY', laps: 3,
    primaryColor: '#00ffff', secondaryColor: '#ff00ff',
    fogColor: '#050510', ambientColor: '#001a1a',
    points: neonPoints,
    ...standardItems(neonPoints, 3, 8, 4),
    startPos: [0,1,100], startYaw: Math.PI/2,
    flavor: 'A balanced track with wide turns. Perfect for beginners.',
  },
  {
    id: 'volcanic-rift', name: 'Volcanic Rift', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#ff4400', secondaryColor: '#ffaa00',
    fogColor: '#100505', ambientColor: '#1a0800',
    points: volcanicPoints,
    ...standardItems(volcanicPoints, 4, 10, 4),
    startPos: [0,1,120], startYaw: Math.PI/2,
    flavor: 'A twisting, fiery circuit with interior chicanes.',
  },
  {
    id: 'crystal-abyss', name: 'Crystal Abyss', difficulty: 'HARD', laps: 4,
    primaryColor: '#aa00ff', secondaryColor: '#ff00aa',
    fogColor: '#080010', ambientColor: '#0d001a',
    points: crystalPoints,
    ...standardItems(crystalPoints, 5, 12, 5),
    startPos: [0,1,150], startYaw: Math.PI/2,
    flavor: 'Complex flowing paths with tight corners in the deep.',
  },
  {
    id: 'solar-storm', name: 'Solar Storm', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#00ff88', secondaryColor: '#ffff00',
    fogColor: '#001a0a', ambientColor: '#001a0a',
    points: solarPoints,
    ...standardItems(solarPoints, 4, 10, 4),
    startPos: [0,1,160], startYaw: Math.PI/2,
    flavor: 'A blazing oval with sweeping S-bends. Built for pure speed.',
  },
  {
    id: 'void-serpent', name: 'Void Serpent', difficulty: 'HARD', laps: 4,
    primaryColor: '#4488ff', secondaryColor: '#ff4488',
    fogColor: '#000810', ambientColor: '#000820',
    points: voidPoints,
    ...standardItems(voidPoints, 5, 12, 4, 2),
    startPos: [0,1,180], startYaw: Math.PI/2,
    flavor: 'A tight serpentine nightmare. Only the best survive the deep.',
  },
  {
    id: 'glacier-rush', name: 'Glacier Rush', difficulty: 'EASY', laps: 3,
    primaryColor: '#88ddff', secondaryColor: '#ffffff',
    fogColor: '#080f18', ambientColor: '#0a1820',
    points: glacierPoints,
    ...standardItems(glacierPoints, 3, 8, 4),
    startPos: [0,1,130], startYaw: Math.PI/2,
    flavor: 'Smooth ice-carved curves on a frozen tundra.',
  },
  {
    id: 'cyber-tokyo', name: 'Cyber Tokyo', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#ff00cc', secondaryColor: '#00ccff',
    fogColor: '#0a0010', ambientColor: '#100018',
    points: cyberPoints,
    ...standardItems(cyberPoints, 4, 10, 4),
    startPos: [0,1,110], startYaw: Math.PI/2,
    flavor: 'Race through neon-drenched streets of the mega-city.',
  },
  {
    id: 'desert-mirage', name: 'Desert Mirage', difficulty: 'EASY', laps: 3,
    primaryColor: '#ff8800', secondaryColor: '#ffdd00',
    fogColor: '#140a00', ambientColor: '#1a0e00',
    points: desertPoints,
    ...standardItems(desertPoints, 3, 8, 4),
    startPos: [0,1,150], startYaw: Math.PI/2,
    flavor: 'Blistering speeds across open desert sands.',
  },
  {
    id: 'storm-peaks', name: 'Storm Peaks', difficulty: 'HARD', laps: 4,
    primaryColor: '#ffff00', secondaryColor: '#ff8800',
    fogColor: '#0a0a00', ambientColor: '#141400',
    points: stormPoints,
    ...standardItems(stormPoints, 5, 12, 5, 2),
    startPos: [0,1,160], startYaw: Math.PI/2,
    flavor: 'Lightning-fast mountain hairpins. One mistake ends it all.',
  },
  {
    id: 'quantum-loop', name: 'Quantum Loop', difficulty: 'HARD', laps: 4,
    primaryColor: '#00ffcc', secondaryColor: '#ff0088',
    fogColor: '#001010', ambientColor: '#001818',
    points: quantumPoints,
    ...standardItems(quantumPoints, 5, 12, 5, 2),
    startPos: [0,1,190], startYaw: Math.PI/2,
    flavor: 'Quantum physics bending circuits. Defy what you know.',
  },
  {
    id: 'midnight-harbor', name: 'Midnight Harbor', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#0088ff', secondaryColor: '#00ffcc',
    fogColor: '#000810', ambientColor: '#000a14',
    points: harborPoints,
    ...standardItems(harborPoints, 4, 10, 4),
    startPos: [0,1,140], startYaw: Math.PI/2,
    flavor: 'Flowing dockside curves under a glitching midnight sky.',
  },
  {
    id: 'gravity-shift', name: 'Gravity Shift', difficulty: 'HARD', laps: 4,
    primaryColor: '#ff44ff', secondaryColor: '#44ffff',
    fogColor: '#080010', ambientColor: '#0d001a',
    points: gravityPoints,
    ...standardItems(gravityPoints, 5, 12, 5, 2),
    startPos: [0,1,200], startYaw: Math.PI/2,
    flavor: 'Reality warps on this unstable course. Trust nothing.',
  },
  {
    id: 'phantom-arc', name: 'Phantom Arc', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#77ddff', secondaryColor: '#ff77dd',
    fogColor: '#070816', ambientColor: '#0c0a16',
    points: phantomPoints,
    ...standardItems(phantomPoints, 4, 10, 4),
    startPos: [0,1,120], startYaw: Math.PI/2,
    flavor: 'A spectral loop with graceful arcs and tighter inner bends.',
  },
  {
    id: 'oasis-run', name: 'Oasis Run', difficulty: 'EASY', laps: 3,
    primaryColor: '#00cc99', secondaryColor: '#ccff77',
    fogColor: '#08130d', ambientColor: '#0c1710',
    points: oasisPoints,
    ...standardItems(oasisPoints, 3, 10, 4),
    startPos: [0,1,180], startYaw: Math.PI/2,
    flavor: 'Wide open ripples around the shimmering desert oasis.',
  },
  {
    id: 'eclipse-loop', name: 'Eclipse Loop', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#4444ff', secondaryColor: '#ffff44',
    fogColor: '#081820', ambientColor: '#0f1020',
    points: eclipsePoints,
    ...standardItems(eclipsePoints, 4, 10, 4),
    startPos: [0,1,220], startYaw: Math.PI/2,
    flavor: 'A long high-speed oval with sweeping eclipsed arcs.',
  },
  {
    id: 'tundra-bend', name: 'Tundra Bend', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#88ffff', secondaryColor: '#88aaff',
    fogColor: '#07101a', ambientColor: '#0a1320',
    points: tundraPoints,
    ...standardItems(tundraPoints, 4, 10, 4),
    startPos: [0,1,140], startYaw: Math.PI/2,
    flavor: 'Cold, long sweeps with alternating tight and wide turns.',
  },
  {
    id: 'nebula-veil', name: 'Nebula Veil', difficulty: 'HARD', laps: 4,
    primaryColor: '#aa88ff', secondaryColor: '#88ffcc',
    fogColor: '#070814', ambientColor: '#090b18',
    points: nebulaPoints,
    ...standardItems(nebulaPoints, 5, 12, 5, 2),
    startPos: [0,1,170], startYaw: Math.PI/2,
    flavor: 'A dreamy, twisting path through the glowing nebula.',
  },
  {
    id: 'canyon-charge', name: 'Canyon Charge', difficulty: 'HARD', laps: 4,
    primaryColor: '#ff8844', secondaryColor: '#ff4444',
    fogColor: '#120908', ambientColor: '#180d0a',
    points: canyonPoints,
    ...standardItems(canyonPoints, 5, 12, 5, 2),
    startPos: [0,1,180], startYaw: Math.PI/2,
    flavor: 'Rocky canyon rushes with fast straights and hard-edged turns.',
  },
  {
    id: 'aurora-drive', name: 'Aurora Drive', difficulty: 'MEDIUM', laps: 3,
    primaryColor: '#66ffdd', secondaryColor: '#4488ff',
    fogColor: '#08111a', ambientColor: '#0b1220',
    points: auroraPoints,
    ...standardItems(auroraPoints, 4, 10, 4),
    startPos: [0,1,130], startYaw: Math.PI/2,
    flavor: 'Glacial ridges and hypnotic lights create a flowing route.',
  },
  {
    id: 'inferno-circle', name: 'Inferno Circle', difficulty: 'HARD', laps: 4,
    primaryColor: '#ff3333', secondaryColor: '#ffcc33',
    fogColor: '#100505', ambientColor: '#1a0905',
    points: infernoPoints,
    ...standardItems(infernoPoints, 5, 12, 5, 2),
    startPos: [0,1,140], startYaw: Math.PI/2,
    flavor: 'A volatile infernal loop where speed meets perilous corners.',
  },
];
