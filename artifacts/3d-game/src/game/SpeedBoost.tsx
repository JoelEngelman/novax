import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface SpeedBoostProps {
  position: [number, number, number]; rotation: [number, number, number]; color: string; tier?: 'common' | 'rare' | 'legendary';
}

const LEGENDARY_COLORS = ['#ff0000','#ff7f00','#ffff00','#00ff00','#0000ff','#4b0082','#9400d3'].map(c => new THREE.Color(c));

export function SpeedBoost({ position, rotation, color, tier = 'common' }: SpeedBoostProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const lastColorIndex = useRef(-1);
  const targetColor = useRef(new THREE.Color(color));
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const isRare = tier === 'rare';
  const isLegendary = tier === 'legendary';
  const args = isLegendary ? [14, 0.3, 6] : isRare ? [12, 0.2, 5] : [10, 0.2, 4];
  const pulseSpeed = isLegendary ? 20 : isRare ? 15 : 10;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 1.5 + Math.sin(t * pulseSpeed) * 0.5;
      if (isLegendary) {
        const colorIndex = Math.floor(t * 5) % LEGENDARY_COLORS.length;
        if (colorIndex !== lastColorIndex.current) {
          lastColorIndex.current = colorIndex;
          targetColor.current.copy(LEGENDARY_COLORS[colorIndex]);
        }
        materialRef.current.color.lerp(targetColor.current, 0.12);
        materialRef.current.emissive.lerp(targetColor.current, 0.12);
      }
    }
    if (ringRef1.current) ringRef1.current.rotation.z = t * 2;
    if (ringRef2.current) ringRef2.current.rotation.x = t * 2;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={args as any} /><meshStandardMaterial ref={materialRef} color={baseColor} emissive={baseColor} emissiveIntensity={2} transparent opacity={0.8} /></mesh>
      {(isRare || isLegendary) && <mesh ref={ringRef1} position={[0,2,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[args[0]/2,0.1,12,20]} /><meshStandardMaterial color={isLegendary ? '#ffffff' : '#ffd700'} emissive={isLegendary ? '#ffffff' : '#ffd700'} emissiveIntensity={2} /></mesh>}
      {isLegendary && <mesh ref={ringRef2} position={[0,2,0]}><torusGeometry args={[args[0]/2,0.1,12,20]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} /></mesh>}
    </group>
  );
}