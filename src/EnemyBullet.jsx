import React from 'react';

export default function EnemyBullet({ id, position }) {
  return (
    <mesh key={id} position={position}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#ffffff" emissive="orange" emissiveIntensity={ 3 } />
      {/* <meshStandardMaterial color="#978304" /> */}
    </mesh>
  );
}