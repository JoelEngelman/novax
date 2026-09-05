import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameState } from './useGameState';

export function Coin({ id, position }: { id: string; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const collected = useGameState(s => s.collectedCoins.includes(id));

  useFrame(({ clock }) => {
    if (!groupRef.current || collected) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 2;
    groupRef.current.position.y = position[1] + Math.sin(t * 3) * 0.2;
    if (matRef.current) matRef.current.emissiveIntensity = 1.5 + Math.sin(t * 5) * 0.5;
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 3;
      ringRef.current.rotation.z = t * 1.5;
    }
  });

  if (collected) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.25, 12]} />
        <meshStandardMaterial ref={matRef} color="#ffd700" emissive="#ffaa00" emissiveIntensity={1.5} roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[2.0, 0.1, 8, 20]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}
