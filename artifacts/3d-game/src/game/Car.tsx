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
const PICKUP_RADIUS_SQ = 36;
const FINISH_RADIUS_SQ = 196;

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

  const curve = useMemo(() => getTrackCurve(selectedTrackId), [selectedTrackId]);
  const curveLookup = useMemo(() => buildCurveLookup(selectedTrackId, curve), [selectedTrackId, curve]);
  const trackDef = useMemo(() => TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0], [selectedTrackId]);
  const carDef = useMemo(() => getCarById(selectedCarId), [selectedCarId]);

  const velocity = useRef(0);
  const carYaw = useRef(trackDef.startYaw);
  const carPos = useRef(new THREE.Vector3(...trackDef.startPos));
  const boostEndTime = useRef(0);
  const lapCooldown = useRef(true);
  const hasLeftStart = useRef(false);
  const lastHudSpeed = useRef(-1);
  const lastHudPosUpdate = useRef(0);

  useEffect(() => {
    carPos.current.set(...trackDef.startPos);
    carYaw.current = trackDef.startYaw;
    velocity.current = 0;
    lapCooldown.current = true;
    hasLeftStart.current = false;
    lastHudSpeed.current = -1;
    lastHudPosUpdate.current = 0;
    const t = setTimeout(() => { lapCooldown.current = false; }, 5000);
    return () => clearTimeout(t);
  }, [trackDef]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const { forward, back, left, right } = get();
    const store = useGameState.getState();
    const dt = Math.min(delta, 0.05);
    const effectiveMax = store.boostActive && store.activeBoostTier
      ? carDef.maxSpeed * BOOST_CONFIGS[store.activeBoostTier].mult
      : carDef.maxSpeed;
    const DRAG = carDef.brakeForce * 0.4;

    if (forward) {
      velocity.current = Math.min(velocity.current + carDef.acceleration * dt, effectiveMax);
    } else if (back) {
      if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - carDef.brakeForce * dt);
      else velocity.current = Math.max(-REVERSE_MAX, velocity.current - carDef.acceleration * 0.5 * dt);
    } else {
      if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - DRAG * dt);
      else if (velocity.current < 0) velocity.current = Math.min(0, velocity.current + DRAG * dt);
    }

    if (store.boostActive && state.clock.getElapsedTime() > boostEndTime.current) {
      store.setBoostActive(false);
      store.setActiveBoostTier(null);
    }

    // Only publish speed when the visible value changes. Physics stays 60+ FPS.
    const displayedSpeed = Math.floor(Math.abs(velocity.current) * 10);
    if (displayedSpeed !== lastHudSpeed.current) {
      lastHudSpeed.current = displayedSpeed;
      store.setSpeed(Math.abs(velocity.current));
    }

    const speedRatio = Math.abs(velocity.current) / carDef.maxSpeed;
    const steerDir = velocity.current >= 0 ? 1 : -1;
    if (left) carYaw.current += carDef.turnSpeed * speedRatio * dt * steerDir;
    if (right) carYaw.current -= carDef.turnSpeed * speedRatio * dt * steerDir;

    const newX = carPos.current.x + Math.sin(carYaw.current) * velocity.current * dt;
    const newZ = carPos.current.z + Math.cos(carYaw.current) * velocity.current * dt;

    const probe = carPos.current;
    probe.set(newX, 0, newZ);
    const { point: closest, distance } = closestPointOnCurve(curve, probe, curveLookup);

    if (distance > TRACK_HALF_WIDTH) {
      const dx = newX - closest.x;
      const dz = newZ - closest.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      carPos.current.x = closest.x + (dx / len) * (TRACK_HALF_WIDTH - 0.5);
      carPos.current.z = closest.z + (dz / len) * (TRACK_HALF_WIDTH - 0.5);
      velocity.current *= 0.35;
    } else {
      carPos.current.x = newX;
      carPos.current.z = newZ;
    }
    carPos.current.y = TRACK_Y;

    groupRef.current.position.copy(carPos.current);
    groupRef.current.rotation.set(0, carYaw.current, 0);

    // The minimap only needs ~15 updates/sec, not one React update per frame.
    const now = state.clock.elapsedTime;
    if (now - lastHudPosUpdate.current >= 0.066) {
      lastHudPosUpdate.current = now;
      store.setCarPos(carPos.current.x, carPos.current.z);
    }

    // Pickup checks use squared distances and no temporary Vector3 allocations.
    const px = carPos.current.x;
    const pz = carPos.current.z;
    if (!store.boostActive) {
      let hitTier: 'common' | 'rare' | 'legendary' | null = null;
      for (const pad of trackDef.boostPads) {
        const dx = px - pad[0], dz = pz - pad[2];
        if (dx * dx + dz * dz < BOOST_RADIUS_SQ) { hitTier = 'common'; break; }
      }
      if (!hitTier && trackDef.rareBoostPads) {
        for (const pad of trackDef.rareBoostPads) {
          const dx = px - pad[0], dz = pz - pad[2];
          if (dx * dx + dz * dz < BOOST_RADIUS_SQ) { hitTier = 'rare'; break; }
        }
      }
      if (!hitTier && trackDef.legendaryBoostPad) {
        const pad = trackDef.legendaryBoostPad;
        const dx = px - pad[0], dz = pz - pad[2];
        if (dx * dx + dz * dz < BOOST_RADIUS_SQ) hitTier = 'legendary';
      }
      if (hitTier) {
        store.setActiveBoostTier(hitTier);
        store.setBoostActive(true);
        boostEndTime.current = state.clock.getElapsedTime() + BOOST_CONFIGS[hitTier].duration;
      }
    }

    const chestSpots = trackDef.chestSpots || [];
    for (const chestId of store.activeChests) {
      const idx = parseInt(chestId.split('-')[1]);
      const spot = chestSpots[idx];
      if (!spot) continue;
      const dx = px - spot[0], dz = pz - spot[2];
      if (dx * dx + dz * dz < PICKUP_RADIUS_SQ) {
        store.collectChest(chestId);
        break;
      }
    }

    const coinSpotsList = trackDef.coinSpots || [];
    for (let i = 0; i < coinSpotsList.length; i++) {
      const coinId = 'coin-' + i;
      if (store.collectedCoins.includes(coinId)) continue;
      const spot = coinSpotsList[i];
      const dx = px - spot[0], dz = pz - spot[2];
      if (dx * dx + dz * dz < PICKUP_RADIUS_SQ) {
        store.collectCoin(coinId);
        break;
      }
    }

    const startX = trackDef.startPos[0], startZ = trackDef.startPos[2];
    const finishDx = px - startX, finishDz = pz - startZ;
    const distToStartSq = finishDx * finishDx + finishDz * finishDz;
    if (!hasLeftStart.current && distToStartSq > 35 * 35) hasLeftStart.current = true;

    const nearFinish = distToStartSq < FINISH_RADIUS_SQ && velocity.current > 2 && hasLeftStart.current;
    if (nearFinish && !lapCooldown.current) {
      lapCooldown.current = true;
      const nextLap = store.lap + 1;
      if (nextLap > store.maxLaps) store.finishGame();
      else {
        store.setLap(nextLap);
        store.setLapFlash(true);
        setTimeout(() => useGameState.getState().setLapFlash(false), 2000);
      }
      setTimeout(() => { lapCooldown.current = false; }, 4000);
    }

    const behind = new THREE.Vector3(
      -Math.sin(carYaw.current) * 14,
      6,
      -Math.cos(carYaw.current) * 14,
    );
    const idealCamPos = carPos.current.clone().add(behind);
    const lookAhead = carPos.current.clone().add(new THREE.Vector3(
      Math.sin(carYaw.current) * 10, 0, Math.cos(carYaw.current) * 10
    ));
    state.camera.position.lerp(idealCamPos, 0.08);
    state.camera.lookAt(lookAhead);
  });

  const boost = useGameState(s => s.boostActive);

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[3, 1, 6]} />
        <meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, 1]}>
        <boxGeometry args={[2, 0.5, 2.5]} />
        <meshStandardMaterial color="#000000" emissive="#000000" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[-1.8, 0.3, -2.5]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[1, 0.2, 1.5]} />
        <meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[1.8, 0.3, -2.5]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[1, 0.2, 1.5]} />
        <meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[3.2, 0.2, 6.2]} />
        <meshStandardMaterial color={carDef.trimColor} emissive={carDef.trimColor} emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 0, -3.1]}>
        <boxGeometry args={[2, 0.8, 0.5]} />
        <meshStandardMaterial color={carDef.thrusterColor} emissive={carDef.thrusterColor} emissiveIntensity={boost ? 5 : 2} />
      </mesh>
      <pointLight position={[0, -1, -4]} color={carDef.thrusterColor} intensity={boost ? 10 : 3} distance={boost ? 25 : 10} />
    </group>
  );
}
