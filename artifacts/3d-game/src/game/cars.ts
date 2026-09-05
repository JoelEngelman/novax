export interface CarDef {
  id: string;
  name: string;
  description: string;
  price: number;
  maxSpeed: number;
  acceleration: number;
  brakeForce: number;
  turnSpeed: number;
  bodyColor: string;
  trimColor: string;
  thrusterColor: string;
}

export const CARS: CarDef[] = [
  { id: 'phantom-x1', name: 'PHANTOM X1', description: 'Reliable entry-level racer. Forgiving handling.', price: 0, maxSpeed: 40, acceleration: 28, brakeForce: 22, turnSpeed: 2.0, bodyColor: '#1a1a2e', trimColor: '#00ffff', thrusterColor: '#ff00ff' },
  { id: 'blaze-mk2', name: 'BLAZE MK2', description: 'Aggressive speed with responsive steering.', price: 2000, maxSpeed: 58, acceleration: 38, brakeForce: 28, turnSpeed: 2.3, bodyColor: '#1a0800', trimColor: '#ff8800', thrusterColor: '#ff4400' },
  { id: 'apex-vortex', name: 'APEX VORTEX', description: 'Elite machine built for circuit dominance.', price: 7000, maxSpeed: 78, acceleration: 52, brakeForce: 36, turnSpeed: 2.55, bodyColor: '#0a001a', trimColor: '#bb00ff', thrusterColor: '#ff00cc' },
  { id: 'shadow-prime', name: 'SHADOW PRIME', description: 'The pinnacle of futuristic engineering.', price: 18000, maxSpeed: 100, acceleration: 70, brakeForce: 48, turnSpeed: 2.8, bodyColor: '#050510', trimColor: '#e0e0ff', thrusterColor: '#00eeff' },
];

export function getCarById(id: string): CarDef { return CARS.find(c => c.id === id) ?? CARS[0]; }
