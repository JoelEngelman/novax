import { useMemo } from 'react';
import * as THREE from 'three';
import { getTrackCurve, TRACK_HALF_WIDTH } from './trackCurve';
import { TRACKS } from './tracks';

const SEGMENTS = 150;
const INNER_WALL_RADIUS = 0.8;
const OUTER_WALL_RADIUS = 2;

export function Track({ trackId }: { trackId: string }) {
  const track = useMemo(() => TRACKS.find(t => t.id === trackId) || TRACKS[0], [trackId]);
  const curve = useMemo(() => getTrackCurve(trackId), [trackId]);

  // Flat road ribbon — custom BufferGeometry sampled along the curve
  const roadGeometry = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

      positions.push(
        pt.x - right.x * TRACK_HALF_WIDTH, 0.05, pt.z - right.z * TRACK_HALF_WIDTH,
        pt.x + right.x * TRACK_HALF_WIDTH, 0.05, pt.z + right.z * TRACK_HALF_WIDTH,
      );
      uvs.push(0, t * 20, 1, t * 20);
    }

    for (let i = 0; i < SEGMENTS; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      indices.push(a, c, b, b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [curve]);

  // Left-edge barrier curve
  const leftEdgeCurve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      pts.push(new THREE.Vector3(
        pt.x - right.x * TRACK_HALF_WIDTH,
        1.2,
        pt.z - right.z * TRACK_HALF_WIDTH,
      ));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, [curve]);

  // Right-edge barrier curve
  const rightEdgeCurve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      pts.push(new THREE.Vector3(
        pt.x + right.x * TRACK_HALF_WIDTH,
        1.2,
        pt.z + right.z * TRACK_HALF_WIDTH,
      ));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, [curve]);

  // Left-edge inner strip curve
  const leftStripCurve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      pts.push(new THREE.Vector3(
        pt.x - right.x * (TRACK_HALF_WIDTH - 1.5),
        0.06,
        pt.z - right.z * (TRACK_HALF_WIDTH - 1.5),
      ));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, [curve]);

  // Right-edge inner strip curve
  const rightStripCurve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      pts.push(new THREE.Vector3(
        pt.x + right.x * (TRACK_HALF_WIDTH - 1.5),
        0.06,
        pt.z + right.z * (TRACK_HALF_WIDTH - 1.5),
      ));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, [curve]);

  // Center-line dashes (pre-calculated positions)
  const dashData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => {
      const t = i / 24;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      return { x: pt.x, z: pt.z, angle: Math.atan2(tan.x, tan.z) };
    }),
  [curve]);

  return (
    <group>
      {/* Road surface */}
      <mesh geometry={roadGeometry}>
        <meshStandardMaterial
          color="#0c0c1e"
          emissive="#08081a"
          roughness={0.9}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left barrier wall - solid */}
      <mesh>
        <tubeGeometry args={[leftEdgeCurve, 200, INNER_WALL_RADIUS, 6, true]} />
        <meshStandardMaterial
          color={track.primaryColor}
          emissive={track.primaryColor}
          emissiveIntensity={3}
        />
      </mesh>
      
      {/* Left barrier wall - glow */}
      <mesh>
        <tubeGeometry args={[leftEdgeCurve, 200, OUTER_WALL_RADIUS, 6, true]} />
        <meshStandardMaterial
          color={track.primaryColor}
          emissive={track.primaryColor}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Right barrier wall - solid */}
      <mesh>
        <tubeGeometry args={[rightEdgeCurve, 200, INNER_WALL_RADIUS, 6, true]} />
        <meshStandardMaterial
          color={track.primaryColor}
          emissive={track.primaryColor}
          emissiveIntensity={3}
        />
      </mesh>
      
      {/* Right barrier wall - glow */}
      <mesh>
        <tubeGeometry args={[rightEdgeCurve, 200, OUTER_WALL_RADIUS, 6, true]} />
        <meshStandardMaterial
          color={track.primaryColor}
          emissive={track.primaryColor}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Left inner strip */}
      <mesh>
        <tubeGeometry args={[leftStripCurve, 200, 0.3, 3, true]} />
        <meshStandardMaterial
          color={track.primaryColor}
          emissive={track.primaryColor}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Right inner strip */}
      <mesh>
        <tubeGeometry args={[rightStripCurve, 200, 0.3, 3, true]} />
        <meshStandardMaterial
          color={track.primaryColor}
          emissive={track.primaryColor}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Finish line */}
      <mesh position={[track.startPos[0], 0.1, track.startPos[2]]} rotation={[Math.PI / 2, 0, track.startYaw]}>
        <planeGeometry args={[24, 3]} />
        <meshStandardMaterial
          color={track.secondaryColor}
          emissive={track.secondaryColor}
          emissiveIntensity={3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center-line dashes */}
      {dashData.map((d, i) => (
        <mesh key={i} position={[d.x, 0.12, d.z]} rotation={[Math.PI / 2, 0, d.angle]}>
          <planeGeometry args={[1, 5]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
