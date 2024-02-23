import React, { useRef, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import { KeyboardControls } from '@react-three/drei'
import { Bloom, Scanline, ToneMapping, EffectComposer } from '@react-three/postprocessing';
import { Canvas } from '@react-three/fiber'
import Lights from './Lights.jsx'
import Player from './Player.jsx'
import Interface from './Interface.jsx'
import Planet from './Planet.jsx'

export default function Experience()
{
    const keyboardMap = [
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
        { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
        { name: 'shoot', keys: ['Space'] },
    ]

    const [score, setScore] = useState(0)
    const [playerHP, setPlayerHP] = useState(2)
    
    const handleScoreChange = (newScore) => {
      setScore(newScore)
    }

    const handleHPChange = (newHP) => {
    setPlayerHP(newHP)
    }

    return <>
    <KeyboardControls 
          map={ keyboardMap }
    >
        <Canvas
        shadows
        camera={ {
            fov: 45,
            near: 0.1,
            far: 200,
            position: [ 0, 25, 15 ],
            rotation: [ -1, 0, 0 ],
        } }
        >
            <EffectComposer>
                <Bloom 
                    mipmapBlur
                    intensity={ 1.5 }
                    luminanceThreshold={ 0.8 }
                />
                <Scanline 
                    density={ 0.5 }
                    opacity={ 0.075 }
                />
                <ToneMapping/>
            </EffectComposer>

            {/* <OrbitControls makeDefault /> */}
            <Player onScoreChange={handleScoreChange} onHPChange={handleHPChange}/>
            <Lights />
            <Planet />
        </Canvas>
        <Interface score={score} playerHP={playerHP} />
    </KeyboardControls>
    </>
}