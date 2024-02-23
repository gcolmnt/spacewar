import React from 'react';

export default function Bullet({ id, position }) {
  return (
    <mesh key={id} position={position}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="mediumpurple" emissive="mediumpurple" emissiveIntensity={ 3 } />
    </mesh>
  );
}