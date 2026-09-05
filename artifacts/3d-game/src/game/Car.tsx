import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useGameState } from './useGameState';
import { getTrackCurve, TRACK_HALF_WIDTH, closestPointOnCurve, buildCurveLookup } from './trackCurve';
import { TRACKS } from './tracks';
import { getCarById } from './cars';

const TRACK_Y = 1;
const REVERSE_MAX = 14;
const BOOST_RADIUS_SQ = 81;
const CHEST_RADIUS_SQ = 36;
const COIN_RADIUS_SQ = 25;
const START_RADIUS_SQ = 196;
const HUD_UPDATE_INTERVAL = 1 / 15;

const BOOST_CONFIGS = {
  common: { mult: 1.6, duration: 1.5 },
  rare: { mult: 2.0, duration: 2.5 },
  legendary: { mult: 2.5, duration: 3.0 },
};

export function Car() {
  const groupRef = useRef<THREE.Group>(null);
  const [, get] = useKeyboardControls();
  const selectedTrackId = useGameState(s => s.selectedTrackId);
  const selectedCarId = useGameState(s => s.selectedCarId);
  const boost = useGameState(s => s.boostActive);

  const curve = useMemo(() => getTrackCurve(selectedTrackId), [selectedTrackId]);
  const curveLookup = useMemo(() => buildCurveLookup(selectedTrackId, curve), [selectedTrackId, curve]);
  const trackDef = useMemo(() => TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0], [selectedTrackId]);
  const carDef = useMemo(() => getCarById(selectedCarId), [selectedCarId]);

  const velocity = useRef(0);
  const carYaw = useRef(trackDef.startYaw);
  const carPos = useRef(new THREE.Vector3(...trackDef.startPos));
  const probe = useRef(new THREE.Vector3());
  const finishPos = useRef(new THREE.Vector3(...trackDef.startPos));
  const collisionPos = useRef(new THREE.Vector3());
  const behind = useRef(new THREE.Vector3());
  const idealCamPos = useRef(new THREE.Vector3());
  const lookAhead = useRef(new THREE.Vector3());
  const boostEndTime = useRef(0);
  const lapCooldown = useRef(true);
  const hasLeftStart = useRef(false);
  const lastHudUpdate = useRef(0);
  const lastDisplayedSpeed = useRef(-1);
  const lastDisplayedX = useRef(NaN);
  const lastDisplayedZ = useRef(NaN);

  useEffect(() => {
    carPos.current.set(...trackDef.startPos);
    finishPos.current.set(...trackDef.startPos);
    carYaw.current = trackDef.startYaw;
    velocity.current = 0;
    lapCooldown.current = true;
    hasLeftStart.current = false;
    lastHudUpdate.current = 0;
    lastDisplayedSpeed.current = -1;
    lastDisplayedX.current = NaN;
    lastDisplayedZ.current = NaN;
    const t = setTimeout(() => { lapCooldown.current = false; }, 5000);
    return () => clearTimeout(t);
  }, [trackDef]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const { forward, back, left, right } = get();
    const store = useGameState.getState();
    const dt = Math.min(delta, 0.05);
    const { boostActive, activeBoostTier } = store;
    const effectiveMax = boostActive && activeBoostTier
      ? carDef.maxSpeed * BOOST_CONFIGS[activeBoostTier].mult
      : carDef.maxSpeed;
    const drag = carDef.brakeForce * 0.4;

    if (forward) {
      velocity.current = Math.min(velocity.current + carDef.acceleration * dt, effectiveMax);
    } else if (back) {
      if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - carDef.brakeForce * dt);
      else velocity.current = Math.max(-REVERSE_MAX, velocity.current - carDef.acceleration * 0.5 * dt);
    } else if (velocity.current > 0) {
      velocity.current = Math.max(0, velocity.current - drag * dt);
    } else if (velocity.current < 0) {
      velocity.current = Math.min(0, velocity.current + drag * dt);
    }

    const now = state.clock.getElapsedTime();
    if (boostActive && now > boostEndTime.current) {
      store.setBoostActive(false);
      store.setActiveBoostTier(null);
    }

    const speedRatio = Math.abs(velocity.current) / carDef.maxSpeed;
    const steerDir = velocity.current >= 0 ? 1 : -1;
    if (left) carYaw.current += carDef.turnSpeed * speedRatio * dt * steerDir;
    if (right) carYaw.current -= carDef.turnSpeed * speedRatio * dt * steerDir;

    const sinYaw = Math.sin(carYaw.current);
    const cosYaw = Math.cos(carYaw.current);
    const newX = carPos.current.x + sinYaw * velocity.current * dt;
    const newZ = carPos.current.z + cosYaw * velocity.current * dt;

    probe.current.set(newX, 0, newZ);
    const { point: closest, distance } = closestPointOnCurve(curve, probe.current, curveLookup);
    if (distance > TRACK_HALF_WIDTH) {
      const dx = newX - closest.x;
      const dz = newZ - closest.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      const inside = TRACK_HALF_WIDTH - 0.5;
      carPos.current.x = closest.x + (dx / len) * inside;
      carPos.current.z = closest.z + (dz / len) * inside;
      velocity.current *= 0.35;
    } else {
      carPos.current.x = newX;
      carPos.current.z = newZ;
    }
    carPos.current.y = TRACK_Y;
    groupRef.current.position.copy(carPos.current);
    groupRef.current.rotation.set(0, carYaw.current, 0);

    // Physics remains frame-rate independent; HUD/minimap state only updates 15 times/sec.
    if (now - lastHudUpdate.current >= HUD_UPDATE_INTERVAL) {
      lastHudUpdate.current = now;
      const displayedSpeed = Math.floor(Math.abs(velocity.current) * 10);
      if (displayedSpeed !== lastDisplayedSpeed.current) {
        lastDisplayedSpeed.current = displayedSpeed;
        store.setSpeed(Math.abs(velocity.current));
      }
      if (carPos.current.x !== lastDisplayedX.current || carPos.current.z !== lastDisplayedZ.current) {
        lastDisplayedX.current = carPos.current.x;
        lastDisplayedZ.current = carPos.current.z;
        store.setCarPos(carPos.current.x, carPos.current.z);
      }
    }

    // Boost pads: squared-distance checks with no per-frame Vector3 allocations.
    if (!boostActive) {
      let hitTier: 'common' | 'rare' | 'legendary' | null = null;
      for (const pad of trackDef.boostPads) {
        const dx = carPos.current.x - pad[0];
        const dz = carPos.current.z - pad[2];
        if (dx * dx + dz * dz < BOOST_RADIUS_SQ) { hitTier = 'common'; break; }
      }
      if (!hitTier && trackDef.rareBoostPads) {
        for (const pad of trackDef.rareBoostPads) {
          const dx = carPos.current.x - pad[0];
          const dz = carPos.current.z - pad[2];
          if (dx * dx + dz * dz < BOOST_RADIUS_SQ) { hitTier = 'rare'; break; }
        }
      }
      if (!hitTier && trackDef.legendaryBoostPad) {
        const pad = trackDef.legendaryBoostPad;
        const dx = carPos.current.x - pad[0];
        const dz = carPos.current.z - pad[2];
        if (dx * dx + dz * dz < BOOST_RADIUS_SQ) hitTier = 'legendary';
      }
      if (hitTier) {
        store.setActiveBoostTier(hitTier);
        store.setBoostActive(true);
        boostEndTime.current = now + BOOST_CONFIGS[hitTier].duration;
      }
    }

    const chestSpots = trackDef.chestSpots || [];
    for (const chestId of store.activeChests) {
      const idx = Number(chestId.slice(chestId.indexOf('-') + 1));
      const spot = chestSpots[idx];
      if (!spot) continue;
      const dx = carPos.current.x - spot[0];
      const dz = carPos.current.z - spot[2];
      if (dx * dx + dz * dz < CHEST_RADIUS_SQ) {
        store.collectChest(chestId);
        break;
      }
    }

    const coinSpots = trackDef.coinSpots || [];
    for (let i = 0; i < coinSpots.length; i++) {
      const coinId = `coin-${i}`;
      if (store.collectedCoins.includes(coinId)) continue;
      const spot = coinSpots[i];
      const dx = carPos.current.x - spot[0];
      const dz = carPos.current.z - spot[2];
      if (dx * dx + dz * dz < COIN_RADIUS_SQ) {
        store.collectCoin(coinId);
        break;
      }
    }

    const fx = carPos.current.x - finishPos.current.x;
    const fz = carPos.current.z - finishPos.current.z;
    const distToStartSq = fx * fx + fz * fz;
    if (!hasLeftStart.current && distToStartSq > START_RADIUS_SQ) hasLeftStart.current = true;
    const nearFinish = distToStartSq < 196 && velocity.current > 2 && hasLeftStart.current;

    if (nearFinish && !lapCooldown.current) {
      lapCooldown.current = true;
      const nextLap = store.lap + 1;
      if (nextLap > store.maxLaps) {
        store.finishGame();
      } else {
        store.setLap(nextLap);
        store.setLapFlash(true);
        setTimeout(() => useGameState.getState().setLapFlash(false), 2000);
      }
      setTimeout(() => { lapCooldown.current = false; }, 4000);
    }

    behind.current.set(-sinYaw * 14, 6, -cosYaw * 14);
    idealCamPos.current.copy(carPos.current).add(behind.current);
    lookAhead.current.set(sinYaw * 10, 0, cosYaw * 10).add(carPos.current);
    state.camera.position.lerp(idealCamPos.current, 0.08);
    state.camera.lookAt(lookAhead.current);
  });

  return (
    <group ref={groupRef}>
      <mesh><boxGeometry args={[3, 1, 6]} /><meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} /></mesh>
      <mesh position={[0, 0.7, 1]}><boxGeometry args={[2, 0.5, 2.5]} /><meshStandardMaterial color="#000000" emissive="#000000" roughness={0.1} metalness={0.9} /></mesh>
      <mesh position={[-1.8, 0.3, -2.5]} rotation={[0, -0.2, 0]}><boxGeometry args={[1, 0.2, 1.5]} /><meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} /></mesh>
      <mesh position={[1.8, 0.3, -2.5]} rotation={[0, 0.2, 0]}><boxGeometry args={[1, 0.2, 1.5]} /><meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} /></mesh>
      <mesh position={[0, -0.4, 0]}><boxGeometry args={[3.2, 0.2, 6.2]} /><meshStandardMaterial color={carDef.trimColor} emissive={carDef.trimColor} emissiveIntensity={2} /></mesh>
      <mesh position={[0, 0, -3.1]}><boxGeometry args={[2, 0.8, 0.5]} /><meshStandardMaterial color={carDef.thrusterColor} emissive={carDef.thrusterColor} emissiveIntensity={boost ? 5 : 2} /></mesh>
      <pointLight position={[0, -1, -4]} color={carDef.thrusterColor} intensity={boost ? 10 : 3} distance={boost ? 25 : 10} />
    </group>
  );
}