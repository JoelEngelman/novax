import * as THREE from 'three';
import { TRACKS } from './tracks';

export const TRACK_HALF_WIDTH = 12;
export const TRACK_TUBE_RADIUS = 15;

export const TRACK_POINTS = [
  new THREE.Vector3(0, 0, 100),
  new THREE.Vector3(100, 0, 100),
  new THREE.Vector3(150, 0, 50),
  new THREE.Vector3(150, 0, -50),
  new THREE.Vector3(100, 0, -100),
  new THREE.Vector3(-100, 0, -100),
  new THREE.Vector3(-150, 0, -50),
  new THREE.Vector3(-150, 0, 50),
  new THREE.Vector3(-100, 0, 100),
  new THREE.Vector3(0, 0, 100),
];

export function getTrackCurve(trackId: string): THREE.CatmullRomCurve3 {
  const track = TRACKS.find(t => t.id === trackId) || TRACKS[0];
  const pts = track.points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  return new THREE.CatmullRomCurve3(pts, true);
}

export function makeTrackCurve(): THREE.CatmullRomCurve3 {
  return getTrackCurve('neon-circuit');
}

const CURVE_CACHE = new Map<string, THREE.Vector3[]>();
const LOOKUP_SEGMENTS = 300;

export function buildCurveLookup(trackId: string, curve: THREE.CatmullRomCurve3): THREE.Vector3[] {
  if (CURVE_CACHE.has(trackId)) return CURVE_CACHE.get(trackId)!;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= LOOKUP_SEGMENTS; i++) {
    pts.push(curve.getPointAt(i / LOOKUP_SEGMENTS));
  }
  CURVE_CACHE.set(trackId, pts);
  return pts;
}

export function closestPointOnCurve(
  curve: THREE.CatmullRomCurve3,
  pos: THREE.Vector3,
  lookupTable?: THREE.Vector3[]
): { point: THREE.Vector3; distance: number } {
  const table = lookupTable ?? (() => { const pts: THREE.Vector3[] = []; for (let i=0; i<=LOOKUP_SEGMENTS; i++) pts.push(curve.getPointAt(i/LOOKUP_SEGMENTS)); return pts; })();
  let best = Infinity;
  let bestPt = table[0];
  for (const pt of table) {
    const d = Math.hypot(pos.x - pt.x, pos.z - pt.z);
    if (d < best) { best = d; bestPt = pt; }
  }
  return { point: bestPt, distance: best };
}
