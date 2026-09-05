import React, { useEffect } from 'react';
import { useGameState } from '../game/useGameState';
import { Canvas } from '@react-three/fiber';
import { Stars, KeyboardControls } from '@react-three/drei';
import { Track } from '../game/Track';
import { Car } from '../game/Car';
import { HUD } from '../game/HUD';
import { SpeedBoost } from '../game/SpeedBoost';
import { Chest } from '../game/Chest';
import { Coin } from '../game/Coin';
import { TRACKS } from '../game/tracks';

export default function Game() {
  const startTime = useGameState(s => s.startTime);
  const state = useGameState(s => s.state);
  const selectedTrackId = useGameState(s => s.selectedTrackId);
  const activeChests = useGameState(s => s.activeChests);
  const collectedCoins = useGameState(s => s.collectedCoins);
  const setTimeMs = useGameState(s => s.setTimeMs);
  const track = TRACKS.find(t => t.id === selectedTrackId) || TRACKS[0];

  useEffect(() => {
    if (state !== 'RACING' || !startTime) return;

    // The timer is display-only. Updating Zustand 60+ times/sec caused the
    // entire React HUD/game component tree to reconcile every frame.
    let lastUpdate = 0;
    let animationFrameId = 0;
    const updateTimer = (now: number) => {
      if (now - lastUpdate >= 100) {
        setTimeMs(Date.now() - startTime);
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(updateTimer);
    };

    animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, startTime, setTimeMs]);

  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'back', keys: ['ArrowDown', 'KeyS'] },
    { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  ];

  if (state !== 'RACING') return null;

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <KeyboardControls map={keyboardMap}>
        <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }}>
          <color attach="background" args={[track.fogColor]} />
          <ambientLight intensity={0.2} color={track.ambientColor} />
          <directionalLight position={[10, 20, 10]} intensity={1} color={track.primaryColor} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color={track.secondaryColor} />

          {/* Fewer star sprites = much less GPU/CPU work while preserving the sky. */}
          <Stars radius={100} depth={50} count={1200} factor={3} saturation={0} fade speed={0.5} />

          <Track trackId={selectedTrackId} />
          <Car />

          {track.boostPads.map((pad, i) => (
            <SpeedBoost key={i} position={[pad[0], pad[1], pad[2]]} rotation={[0, Math.PI / 4 + (i * Math.PI / 8), 0]} color={track.secondaryColor} />
          ))}
          {track.rareBoostPads?.map((pad, i) => (
            <SpeedBoost key={"rare" + i} position={[pad[0], pad[1], pad[2]]} rotation={[0, Math.PI / 3 + i * 0.5, 0]} color="#ffd700" tier="rare" />
          ))}
          {track.legendaryBoostPad && (
            <SpeedBoost position={track.legendaryBoostPad} rotation={[0, 0, 0]} color="#ffffff" tier="legendary" />
          )}
          {(track.chestSpots || []).map((spot, i) => {
            const id = "chest-" + i;
            if (!activeChests.includes(id)) return null;
            return <Chest key={id} id={id} position={[spot[0], spot[1], spot[2]]} />;
          })}
          {(track.coinSpots || []).map((spot, i) => {
            if (collectedCoins.includes("coin-" + i)) return null;
            return <Coin key={"coin-" + i} position={[spot[0], spot[1], spot[2]]} />;
          })}
        </Canvas>
      </KeyboardControls>

      <HUD />
    </div>
  );
}
