import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface SpeedBoostProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  tier?: 'common' | 'rare' | 'legendary';
}

export function SpeedBoost({ position, rotation, color, tier = 'common' }: SpeedBoostProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  const isRare = tier === 'rare';
  const isLegendary = tier === 'legendary';
  
  const args = isLegendary ? [14, 0.3, 6] : isRare ? [12, 0.2, 5] : [10, 0.2, 4];
  const pulseSpeed = isLegendary ? 20 : isRare ? 15 : 10;
  
  const colors = isLegendary ? ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"] : [];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 1.5 + Math.sin(t * pulseSpeed) * 0.5;
      if (isLegendary) {
        const colorIdx = Math.floor(t * 5) % colors.length;
        const nextColor = new THREE.Color(colors[colorIdx]);
        materialRef.current.color.lerp(nextColor, 0.1);
        materialRef.current.emissive.lerp(nextColor, 0.1);
      }
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * 2;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x = t * 2;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={args as any} />
        <meshStandardMaterial 
          ref={materialRef}
          color={new THREE.Color(color)} 
          emissive={new THREE.Color(color)} 
          emissiveIntensity={2} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
      {(isRare || isLegendary) && (
        <mesh ref={ringRef1} position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[args[0] / 2, 0.1, 16, 32]} />
          <meshStandardMaterial color={isLegendary ? "#ffffff" : "#ffd700"} emissive={isLegendary ? "#ffffff" : "#ffd700"} emissiveIntensity={2} />
        </mesh>
      )}
      {isLegendary && (
        <mesh ref={ringRef2} position={[0, 2, 0]}>
          <torusGeometry args={[args[0] / 2, 0.1, 16, 32]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  );
}
