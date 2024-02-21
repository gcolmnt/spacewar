import React from 'react';

export default function PowerUp({ id, position }) {
  return (
    <mesh key={id} position={position}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}