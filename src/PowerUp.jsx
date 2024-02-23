import React from 'react';

export default function PowerUp({ id, position }) {
  return (
    <mesh key={id} position={position} rotation={[ 0, 0, Math.PI/2 ]}>
      <capsuleGeometry args={[0.25, 0.5, 2, 5]} />
      <meshStandardMaterial color="#9D41FA" />
    </mesh>
  );
}