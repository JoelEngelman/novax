import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function Chest({ id, position }: { id: string; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t;
    groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.3;
    
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 1 + Math.sin(t * 4) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial ref={materialRef} color="#ffd700" emissive="#ffd700" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.1, 16, 32]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#ffd700" intensity={2} distance={10} position={[0, -1, 0]} />
    </group>
  );
}
