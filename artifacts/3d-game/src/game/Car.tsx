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
const BOOST_CONFIGS = { common: { mult: 1.6, duration: 1.5 }, rare: { mult: 2, duration: 2.5 }, legendary: { mult: 2.5, duration: 3 } };

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
  const pushDir = useRef(new THREE.Vector3());
  const finishPos = useRef(new THREE.Vector3(...trackDef.startPos));
  const behind = useRef(new THREE.Vector3());
  const idealCamPos = useRef(new THREE.Vector3());
  const lookAhead = useRef(new THREE.Vector3());
  const hudTimer = useRef(0);
  const boostEndTime = useRef(0);
  const lapCooldown = useRef(true);
  const hasLeftStart = useRef(false);

  useEffect(() => {
    carPos.current.set(...trackDef.startPos);
    finishPos.current.set(...trackDef.startPos);
    carYaw.current = trackDef.startYaw;
    velocity.current = 0;
    lapCooldown.current = true;
    hasLeftStart.current = false;
    const timer = setTimeout(() => { lapCooldown.current = false; }, 5000);
    return () => clearTimeout(timer);
  }, [trackDef]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const { forward, back, left, right } = get();
    const store = useGameState.getState();
    const dt = Math.min(delta, 0.05);
    const effectiveMax = store.boostActive && store.activeBoostTier ? carDef.maxSpeed * BOOST_CONFIGS[store.activeBoostTier].mult : carDef.maxSpeed;
    const drag = carDef.brakeForce * 0.4;

    if (forward) velocity.current = Math.min(velocity.current + carDef.acceleration * dt, effectiveMax);
    else if (back) velocity.current = velocity.current > 0 ? Math.max(0, velocity.current - carDef.brakeForce * dt) : Math.max(-REVERSE_MAX, velocity.current - carDef.acceleration * 0.5 * dt);
    else if (velocity.current > 0) velocity.current = Math.max(0, velocity.current - drag * dt);
    else if (velocity.current < 0) velocity.current = Math.min(0, velocity.current + drag * dt);

    const now = state.clock.getElapsedTime();
    if (store.boostActive && now > boostEndTime.current) store.setBoostActive(false);

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
      pushDir.current.set(newX - closest.x, 0, newZ - closest.z).normalize();
      carPos.current.x = closest.x + pushDir.current.x * (TRACK_HALF_WIDTH - 0.5);
      carPos.current.z = closest.z + pushDir.current.z * (TRACK_HALF_WIDTH - 0.5);
      velocity.current *= 0.35;
    } else {
      carPos.current.x = newX;
      carPos.current.z = newZ;
    }
    carPos.current.y = TRACK_Y;
    groupRef.current.position.copy(carPos.current);
    groupRef.current.rotation.set(0, carYaw.current, 0);

    hudTimer.current += dt;
    if (hudTimer.current >= 1 / 15) {
      hudTimer.current = 0;
      store.setSpeed(Math.abs(velocity.current));
      store.setCarPos(carPos.current.x, carPos.current.z);
    }

    if (!store.boostActive) {
      let tier: 'common' | 'rare' | 'legendary' | null = null;
      for (const pad of trackDef.boostPads) { const dx = carPos.current.x - pad[0], dz = carPos.current.z - pad[2]; if (dx * dx + dz * dz < BOOST_RADIUS_SQ) { tier = 'common'; break; } }
      if (!tier && trackDef.rareBoostPads) for (const pad of trackDef.rareBoostPads) { const dx = carPos.current.x - pad[0], dz = carPos.current.z - pad[2]; if (dx * dx + dz * dz < BOOST_RADIUS_SQ) { tier = 'rare'; break; } }
      if (!tier && trackDef.legendaryBoostPad) { const pad = trackDef.legendaryBoostPad; const dx = carPos.current.x - pad[0], dz = carPos.current.z - pad[2]; if (dx * dx + dz * dz < BOOST_RADIUS_SQ) tier = 'legendary'; }
      if (tier) { store.setActiveBoostTier(tier); store.setBoostActive(true); boostEndTime.current = now + BOOST_CONFIGS[tier].duration; }
    }

    const chestSpots = trackDef.chestSpots || [];
    for (const id of store.activeChests) {
      const spot = chestSpots[Number(id.slice(6))];
      if (!spot) continue;
      const dx = carPos.current.x - spot[0], dz = carPos.current.z - spot[2];
      if (dx * dx + dz * dz < CHEST_RADIUS_SQ) { store.collectChest(id); break; }
    }

    const coinSpots = trackDef.coinSpots || [];
    for (let i = 0; i < coinSpots.length; i++) {
      const id = 'coin-' + i;
      if (store.collectedCoins.includes(id)) continue;
      const spot = coinSpots[i];
      const dx = carPos.current.x - spot[0], dz = carPos.current.z - spot[2];
      if (dx * dx + dz * dz < COIN_RADIUS_SQ) { store.collectCoin(id); break; }
    }

    const dxStart = carPos.current.x - finishPos.current.x, dzStart = carPos.current.z - finishPos.current.z;
    const startSq = dxStart * dxStart + dzStart * dzStart;
    if (!hasLeftStart.current && startSq > 1225) hasLeftStart.current = true;
    if (startSq < 196 && velocity.current > 2 && hasLeftStart.current && !lapCooldown.current) {
      lapCooldown.current = true;
      const nextLap = store.lap + 1;
      if (nextLap > store.maxLaps) store.finishGame();
      else { store.setLap(nextLap); store.setLapFlash(true); setTimeout(() => store.setLapFlash(false), 2000); }
      setTimeout(() => { lapCooldown.current = false; }, 4000);
    }

    behind.current.set(-sinYaw * 14, 6, -cosYaw * 14);
    idealCamPos.current.copy(carPos.current).add(behind.current);
    lookAhead.current.set(carPos.current.x + sinYaw * 10, carPos.current.y, carPos.current.z + cosYaw * 10);
    state.camera.position.lerp(idealCamPos.current, 0.08);
    state.camera.lookAt(lookAhead.current);
  });

  return <group ref={groupRef}>
    <mesh><boxGeometry args={[3, 1, 6]} /><meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} /></mesh>
    <mesh position={[0, 0.7, 1]}><boxGeometry args={[2, 0.5, 2.5]} /><meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} /></mesh>
    <mesh position={[-1.8, 0.3, -2.5]} rotation={[0, -0.2, 0]}><boxGeometry args={[1, 0.2, 1.5]} /><meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} /></mesh>
    <mesh position={[1.8, 0.3, -2.5]} rotation={[0, 0.2, 0]}><boxGeometry args={[1, 0.2, 1.5]} /><meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} /></mesh>
    <mesh position={[0, -0.4, 0]}><boxGeometry args={[3.2, 0.2, 6.2]} /><meshStandardMaterial color={carDef.trimColor} emissive={carDef.trimColor} emissiveIntensity={2} /></mesh>
    <mesh position={[0, 0, -3.1]}><boxGeometry args={[2, 0.8, 0.5]} /><meshStandardMaterial color={carDef.thrusterColor} emissive={carDef.thrusterColor} emissiveIntensity={boost ? 5 : 2} /></mesh>
    <pointLight position={[0, -1, -4]} color={carDef.thrusterColor} intensity={boost ? 10 : 3} distance={boost ? 25 : 10} />
  </group>;
}
