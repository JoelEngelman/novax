import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function Coin({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 2;
    groupRef.current.position.y = position[1] + Math.sin(t * 3) * 0.2;
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 3;
      ringRef.current.rotation.z = t * 1.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.25, 12]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={1.5} roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[2.0, 0.1, 8, 16]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}
