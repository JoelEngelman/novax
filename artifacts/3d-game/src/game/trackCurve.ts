import * as THREE from 'three';
import { TRACKS } from './tracks';

export const TRACK_HALF_WIDTH = 12;
export const TRACK_TUBE_RADIUS = 15;

export const TRACK_POINTS = [
  new THREE.Vector3(0, 0, 100), new THREE.Vector3(100, 0, 100), new THREE.Vector3(150, 0, 50),
  new THREE.Vector3(150, 0, -50), new THREE.Vector3(100, 0, -100), new THREE.Vector3(-100, 0, -100),
  new THREE.Vector3(-150, 0, -50), new THREE.Vector3(-150, 0, 50), new THREE.Vector3(-100, 0, 100),
  new THREE.Vector3(0, 0, 100),
];

export function getTrackCurve(trackId: string): THREE.CatmullRomCurve3 {
  const track = TRACKS.find(t => t.id === trackId) || TRACKS[0];
  return new THREE.CatmullRomCurve3(track.points.map(p => new THREE.Vector3(p[0], p[1], p[2])), true);
}

export function makeTrackCurve(): THREE.CatmullRomCurve3 {
  return getTrackCurve('neon-circuit');
}

const CURVE_CACHE = new Map<string, THREE.Vector3[]>();
const LOOKUP_SEGMENTS = 128;

export function buildCurveLookup(trackId: string, curve: THREE.CatmullRomCurve3): THREE.Vector3[] {
  const cached = CURVE_CACHE.get(trackId);
  if (cached) return cached;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= LOOKUP_SEGMENTS; i++) pts.push(curve.getPointAt(i / LOOKUP_SEGMENTS));
  CURVE_CACHE.set(trackId, pts);
  return pts;
}

export function closestPointOnCurve(
  curve: THREE.CatmullRomCurve3,
  pos: THREE.Vector3,
  lookupTable?: THREE.Vector3[]
): { point: THREE.Vector3; distance: number } {
  const table = lookupTable ?? buildCurveLookup('fallback', curve);
  let bestSq = Infinity;
  let bestPt = table[0];
  for (let i = 0; i < table.length; i++) {
    const pt = table[i];
    const dx = pos.x - pt.x;
    const dz = pos.z - pt.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestSq) { bestSq = dSq; bestPt = pt; }
  }
  return { point: bestPt, distance: Math.sqrt(bestSq) };
}
