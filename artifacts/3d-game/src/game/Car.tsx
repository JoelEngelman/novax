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
const BOOST_RADIUS = 9;

const BOOST_CONFIGS = {
  common: { mult: 1.6, duration: 1.5 },
  rare:   { mult: 2.0, duration: 2.5 },
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

  useEffect(() => {
    carPos.current = new THREE.Vector3(...trackDef.startPos);
    carYaw.current = trackDef.startYaw;
    velocity.current = 0;
    lapCooldown.current = true;
    hasLeftStart.current = false;
    // Grace period: prevent lap/finish trigger for first 5 seconds
    const t = setTimeout(() => { lapCooldown.current = false; }, 5000);
    return () => clearTimeout(t);
  }, [trackDef]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const { forward, back, left, right } = get();
    const {
      setSpeed,
      lap,
      setLap,
      maxLaps,
      finishGame,
      boostActive,
      setBoostActive,
      setLapFlash,
      activeBoostTier,
      setActiveBoostTier,
      activeChests,
      collectChest,
      collectedCoins,
      collectCoin
    } = useGameState.getState();

    const dt = Math.min(delta, 0.05);
    const effectiveMax = boostActive && activeBoostTier ? carDef.maxSpeed * BOOST_CONFIGS[activeBoostTier].mult : carDef.maxSpeed;
    const DRAG = carDef.brakeForce * 0.4;

    // Acceleration / braking
    if (forward) {
      velocity.current = Math.min(velocity.current + carDef.acceleration * dt, effectiveMax);
    } else if (back) {
      if (velocity.current > 0) {
        velocity.current = Math.max(0, velocity.current - carDef.brakeForce * dt);
      } else {
        velocity.current = Math.max(-REVERSE_MAX, velocity.current - carDef.acceleration * 0.5 * dt);
      }
    } else {
      if (velocity.current > 0) {
        velocity.current = Math.max(0, velocity.current - DRAG * dt);
      } else if (velocity.current < 0) {
        velocity.current = Math.min(0, velocity.current + DRAG * dt);
      }
    }

    // Boost timer
    if (boostActive && state.clock.getElapsedTime() > boostEndTime.current) {
      setBoostActive(false);
    }

    setSpeed(Math.abs(velocity.current));

    // Steering — proportional to speed; yaw PERSISTS (no spring-back)
    const speedRatio = Math.abs(velocity.current) / carDef.maxSpeed;
    const steerDir = velocity.current >= 0 ? 1 : -1;
    if (left)  carYaw.current += carDef.turnSpeed * speedRatio * dt * steerDir;
    if (right) carYaw.current -= carDef.turnSpeed * speedRatio * dt * steerDir;

    // Move in heading direction
    const newX = carPos.current.x + Math.sin(carYaw.current) * velocity.current * dt;
    const newZ = carPos.current.z + Math.cos(carYaw.current) * velocity.current * dt;

    // --- Track boundary constraint ---
    const probe = new THREE.Vector3(newX, 0, newZ);
    const { point: closest, distance } = closestPointOnCurve(curve, probe, curveLookup);

    if (distance > TRACK_HALF_WIDTH) {
      // Push car back inside the track wall
      const dir = new THREE.Vector3(newX - closest.x, 0, newZ - closest.z).normalize();
      carPos.current.x = closest.x + dir.x * (TRACK_HALF_WIDTH - 0.5);
      carPos.current.z = closest.z + dir.z * (TRACK_HALF_WIDTH - 0.5);
      // Kill most of the speed on wall impact
      velocity.current *= 0.35;
    } else {
      carPos.current.x = newX;
      carPos.current.z = newZ;
    }
    carPos.current.y = TRACK_Y;

    useGameState.getState().setCarPos(carPos.current.x, carPos.current.z);

    groupRef.current.position.copy(carPos.current);
    groupRef.current.rotation.set(0, carYaw.current, 0);

    // Boost pad pickup
    if (!boostActive) {
      let hitTier: 'common' | 'rare' | 'legendary' | null = null;
      for (const pad of trackDef.boostPads) {
        if (carPos.current.distanceTo(new THREE.Vector3(pad[0], TRACK_Y, pad[2])) < BOOST_RADIUS) {
          hitTier = 'common'; break;
        }
      }
      if (!hitTier && trackDef.rareBoostPads) {
        for (const pad of trackDef.rareBoostPads) {
          if (carPos.current.distanceTo(new THREE.Vector3(pad[0], TRACK_Y, pad[2])) < BOOST_RADIUS) {
            hitTier = 'rare'; break;
          }
        }
      }
      if (!hitTier && trackDef.legendaryBoostPad) {
        if (carPos.current.distanceTo(new THREE.Vector3(trackDef.legendaryBoostPad[0], TRACK_Y, trackDef.legendaryBoostPad[2])) < BOOST_RADIUS) {
          hitTier = 'legendary';
        }
      }

      if (hitTier) {
        setActiveBoostTier(hitTier);
        setBoostActive(true);
        boostEndTime.current = state.clock.getElapsedTime() + BOOST_CONFIGS[hitTier].duration;
      }
    }

    // Chest collision
    const chestSpots = trackDef.chestSpots || [];
    for (const chestId of activeChests) {
      const idx = parseInt(chestId.split('-')[1]);
      const spot = chestSpots[idx];
      if (!spot) continue;
      const dist = carPos.current.distanceTo(new THREE.Vector3(spot[0], TRACK_Y, spot[2]));
      if (dist < 6) {
        collectChest(chestId);
        break;
      }
    }

    // Coin collision
    const coinSpotsList = trackDef.coinSpots || [];
    for (let i = 0; i < coinSpotsList.length; i++) {
      const coinId = "coin-" + i;
      if (collectedCoins.includes(coinId)) continue;
      const spot = coinSpotsList[i];
      const dist = carPos.current.distanceTo(new THREE.Vector3(spot[0], TRACK_Y, spot[2]));
      if (dist < 5) {
        collectCoin(coinId);
        break;
      }
    }

    // Lap detection
    const finishPos = new THREE.Vector3(...trackDef.startPos);
    const distToStart = carPos.current.distanceTo(finishPos);

    // Must leave the start zone before a lap can be counted
    if (!hasLeftStart.current && distToStart > 35) {
      hasLeftStart.current = true;
    }

    const nearFinish = distToStart < 14 && velocity.current > 2 && hasLeftStart.current;

    if (nearFinish && !lapCooldown.current) {
      lapCooldown.current = true;
      const nextLap = lap + 1;
      if (nextLap > maxLaps) {
        finishGame();
      } else {
        setLap(nextLap);
        setLapFlash(true);
        setTimeout(() => setLapFlash(false), 2000);
      }
      setTimeout(() => { lapCooldown.current = false; }, 4000);
    }

    // Follow camera — behind the car, lerped smoothly
    const behind = new THREE.Vector3(
      -Math.sin(carYaw.current) * 14,
      6,
      -Math.cos(carYaw.current) * 14,
    );
    const idealCamPos = carPos.current.clone().add(behind);
    const lookAhead = carPos.current.clone().add(
      new THREE.Vector3(Math.sin(carYaw.current) * 10, 0, Math.cos(carYaw.current) * 10)
    );
    state.camera.position.lerp(idealCamPos, 0.08);
    state.camera.lookAt(lookAhead);
  });

  const boost = useGameState(s => s.boostActive);

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[3, 1, 6]} />
        <meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Cockpit */}
      <mesh position={[0, 0.7, 1]}>
        <boxGeometry args={[2, 0.5, 2.5]} />
        <meshStandardMaterial color="#000000" emissive="#000000" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Left Wing */}
      <mesh position={[-1.8, 0.3, -2.5]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[1, 0.2, 1.5]} />
        <meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Right Wing */}
      <mesh position={[1.8, 0.3, -2.5]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[1, 0.2, 1.5]} />
        <meshStandardMaterial color={carDef.bodyColor} emissive="#0f0f1a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Neon underside trim */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[3.2, 0.2, 6.2]} />
        <meshStandardMaterial color={carDef.trimColor} emissive={carDef.trimColor} emissiveIntensity={2} />
      </mesh>
      
      {/* Engine thruster */}
      <mesh position={[0, 0, -3.1]}>
        <boxGeometry args={[2, 0.8, 0.5]} />
        <meshStandardMaterial
          color={carDef.thrusterColor}
          emissive={carDef.thrusterColor}
          emissiveIntensity={boost ? 5 : 2}
        />
      </mesh>

      <pointLight position={[0, -1, -4]} color={carDef.thrusterColor} intensity={boost ? 10 : 3} distance={boost ? 25 : 10} />
    </group>
  );
}