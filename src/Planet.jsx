import React, { useRef } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three'

// Define the shader material with initial uniform values

export default function Planet() {
  const meshRef = useRef()

  const texture = useLoader(TextureLoader, './2k_mars.jpg')


  // Update uniforms on each frame
  useFrame(({ clock, size }) => {
    meshRef.current.rotation.x += 0.0025
  })

  return (
    <mesh ref={meshRef} scale={4} position={ [0, -75, -10 ] } rotation={[0, 0, Math.PI/2]}>
      <sphereGeometry args={[ 15, 64, 32 ]}/>
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
