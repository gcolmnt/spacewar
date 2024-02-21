import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import Bullet from './Bullet.jsx'
import EnemyBullet from './EnemyBullet.jsx'
import useGame from './stores/useGame.jsx'

export default function Player({ onScoreChange, onHPChange }) {

  const { nodes: playerModel } = useGLTF('./SpaceshipQuaternius.glb') 
  const { nodes: targetModel } = useGLTF('./SpaceshipTarget.glb')
   

  /**
   * Const Setting
   */
  const playerRef = useRef()
  const canShoot = useRef(true)
  const canTargetShoot = useRef(true)

  const playerBaseHP = 3

  const [subscribeKeys, getKeys] = useKeyboardControls()

  const [playerBullets, setPlayerBullets] = useState([])
  const [targetBullets, setTargetBullets] = useState([])
  const [targets, setTargets] = useState([])

  const [score, setScore] = useState(0)

  const [playerHP, setPlayerHP] = useState(playerBaseHP)
  const [canDecreaseHP, setCanDecreaseHP] = useState(true)
  const [opacitySwitch, setOpacitySwitch] = useState(true)

  const [playerRotation, setPlayerRotation] = useState([0, Math.PI, 0])

  const [ firstInput, setFirstInput] = useState(false)

  const hpDecreaseCooldown = 1000 // Invincibility in seconds
  const maxTargets = 9 // Array size max of targets (number of targets + 1)

  const gameState = useGame.getState()

  const traverseAndSetOpacity = (object, opacity) => {
    if (object.isMesh) {
      object.material.opacity = opacity
      object.material.transparent = true
    }
  
    if (object.children) {
      object.children.forEach((child) => {
        traverseAndSetOpacity(child, opacity)
      })
    }
  }

  /**
   * Game Variables
   */
  
  let speedModifier = 1
  const speedPlayer = 10
  const speedTarget = 5
  const bulletSpeedPlayer = 20
  const bulletSpeedTarget = 15
  let shotSpeedPlayer = 5   // Number of shot per second
  const shotSpeedTarget = 0.5

  const waveSpeed = 0.5
  const waveIntensity = 7

  // Define screen boundaries
  const minX = -20; // Minimum x-coordinate
  const maxX = 20;  // Maximum x-coordinate
  const minZ = -20; // Minimum z-coordinate
  const maxZ = 10;  // Maximum z-coordinate



  // Enemy mesh
  const Target = ({ position }) => {
    // Clone the Spaceship_BarbaraTheBee model
    const clonedModel = useMemo(() => targetModel.Spaceship_BarbaraTheBee.clone(), [])
  
    return (
      <group position={position}>
        <primitive object={clonedModel} scale={ 30 } />
      </group>
    )
  }

  /**
   * Enemy Creation function
   */
  const spawnRandomTarget = () => {
    const randomX = (Math.random() - 0.5) * 10
    const randomY = 0
    const randomZ = -20 - (Math.random() * 10)
  
    const newTarget = {
      id: Math.random(),
      position: [randomX, randomY, randomZ],
      canShoot: true,
    }
  
    setTargetBullets((prevTargetBullets) => [...prevTargetBullets, { id: newTarget.id, position: newTarget.position }])
    return newTarget
  }

  const start = useGame((state) => state.start)
  const end = useGame((state) => state.end)
  const restart = useGame((state) => state.restart)

  const reset = () =>
  {
    playerRef.current.position.z = 0
    playerRef.current.position.x = 0
    playerRef.current.position.z = 9
    setPlayerHP((prevHP) => {
      const newHP = playerBaseHP
      onHPChange(newHP)
      return newHP
    })
    traverseAndSetOpacity(playerRef.current, 1)
    setFirstInput(false)
      // startMusic.pause()
  }

  const hasPressedKey = () => {
    if (!firstInput) {
        setFirstInput(true)
        setScore((prevScore) => {
          const newScore = 0
          onScoreChange(newScore)
          return newScore
        })
        setOpacitySwitch(false)
        traverseAndSetOpacity(playerRef.current, 1)
        setTimeout(() => {
          setTargets(Array.from({ length: 5 }, () => spawnRandomTarget()))
            // startMusic.currentTime = 0
            // startMusic.loop = true
            // startMusic.volume = 0.25
            // startMusic.play()
        }, 500)
    }
  }

  const startGame = () => {
    start()
    hasPressedKey()
  }

  /**
   * Enemy initialisation
   */ 
  useEffect(() => {
    
    

    const unsubscribeReset = useGame.subscribe(
      (state) => state.phase,
      (value) => {
          if(value === 'ready') reset()
      }
    )


    const unsubscribeAny = subscribeKeys(startGame)

    return () =>
    {
      unsubscribeReset()
      unsubscribeAny()
    }
  }, [firstInput])


  /*
   * USE FRAME
   */

  useFrame((state, delta) => {

    console.log(playerRef.current.position)

    const { forward, backward, leftward, rightward, shoot } = getKeys()

    /**
     * Player
     * - Movement
     * - HP
     * - Shooting
     * - Collision
     */
    if (forward) playerRef.current.position.z = Math.max(playerRef.current.position.z - speedModifier * speedPlayer * delta, minZ)

    if (backward) playerRef.current.position.z = Math.min(playerRef.current.position.z + speedModifier * speedPlayer * delta, maxZ)

    if (rightward) {
      playerRef.current.position.x = Math.min(playerRef.current.position.x + speedModifier * speedPlayer * delta, maxX)
      setPlayerRotation([0, Math.PI, Math.PI / 5])
    }
    
    if (leftward) {
      playerRef.current.position.x = Math.max(playerRef.current.position.x - speedModifier * speedPlayer * delta, minX)
      setPlayerRotation([0, Math.PI, -Math.PI / 5])
    }

    if (!rightward && !leftward) {
      setPlayerRotation([0, Math.PI, 0])
    }

    if (rightward && leftward) {
      setPlayerRotation([0, Math.PI, 0])
    }

    playerRef.current.rotation.x += (playerRotation[0] - playerRef.current.rotation.x) * 0.1
    playerRef.current.rotation.y += (playerRotation[1] - playerRef.current.rotation.y) * 0.1
    playerRef.current.rotation.z += (playerRotation[2] - playerRef.current.rotation.z) * 0.1

    // console.log(playerRef.current.position)
    /**
     * Player HP Management
     */

    if (playerHP < 0) {
      setOpacitySwitch(false)
      traverseAndSetOpacity(playerRef.current, 0)
      setPlayerBullets([])
      setTargetBullets([])
      setTargets([])
      end()
    } else { 
      if (!canDecreaseHP) {
        setOpacitySwitch((prevSwitch) => !prevSwitch)
        traverseAndSetOpacity(playerRef.current, opacitySwitch ? 1 : 0)
      } else {
        setOpacitySwitch(false)
        traverseAndSetOpacity(playerRef.current, 1)
     }
  }

    /**
     * Player Shooting
     */
    if (shoot && canShoot.current && playerHP >= 0) {
      const newBullet = {
        id: Math.random(),
        position: [playerRef.current.position.x, playerRef.current.position.y, playerRef.current.position.z - 2],
      }
  
      setPlayerBullets((prevBullets) => [...prevBullets, newBullet])

  
      // Cooldown setting
      canShoot.current = false
      setTimeout(() => {
        canShoot.current = true
      }, (1 / shotSpeedPlayer) * 1000) // Shooting speed in milliseconds
    }
    
    // Update player bullet positions
    setPlayerBullets((prevBullets) =>
      prevBullets
        .map((bullet) => {
          const newPosition = new THREE.Vector3().fromArray(bullet.position)
          newPosition.z -= bulletSpeedPlayer * delta // Update the z position directly
          return {
            ...bullet,
            position: [newPosition.x, newPosition.y, newPosition.z],
          }
        })
      .filter((bullet) => bullet.position[2] > - 20)
    )
  
    // Check if bullets have reached the target
    setPlayerBullets((prevBullets) =>
      prevBullets.filter((bullet) => {
        // Get the bulletPosition as a Vector 3
        const bulletPosition = new THREE.Vector3(...bullet.position)

        // Check collision for each target
        for (const target of targets) {
          // Get the bulletPosition as a Vector 3
          const targetPosition = new THREE.Vector3(...target.position)
          if (targetPosition && bulletPosition.distanceTo(targetPosition) < 1) {
            // Remove the target if a bullet hit the target
            const updatedTargets = targets.filter((t) => t.id !== target.id)
            if (updatedTargets.length > 4) {
              // If there is more than "updatedTargets.length + 1" targets remove 1 targets
              setTargets([...updatedTargets, ...Array.from({ length: 0 }, () => spawnRandomTarget())])
              setScore((prevScore) => {
                const newScore = prevScore + 100
                onScoreChange(newScore)
                return newScore
              })
            } else {
              // If there is more than "updatedTargets.length + 1" targets spawn 1 targets
              setTargets([...updatedTargets, ...Array.from({ length: 1 }, () => spawnRandomTarget())])
              setScore((prevScore) => {
                const newScore = prevScore + 100
                onScoreChange(newScore)
                return newScore
              })
            }
            return false
          }
        }
        return true
      })
    )

    /**
     * Collision check between Player and Enemy
     */
    for (const target of targets) {
      const targetPosition = new THREE.Vector3(...target.position)
      const playerPosition = playerRef.current.position

      if (targetPosition.distanceTo(playerPosition) < 1.5) {
        if (canDecreaseHP) {

          setPlayerHP((prevHP) => {
            const newHP = prevHP - 1
            onHPChange(newHP)
            return newHP
          })

          // Set the cooldown for HP decrease
          setCanDecreaseHP(false)
          setTimeout(() => {
            setCanDecreaseHP(true)
          }, hpDecreaseCooldown)
        }
        setTargets((prevTargets) => {
          const updatedTargets = prevTargets.filter((t) => t.id !== target.id)
          return [...updatedTargets, spawnRandomTarget()]
        })
        break // No need to check further once a collision is detected
      } else {
      }
    }

    /**
     * Enemy Management
     * -Movement
     * --Shooting
     * -Clear
     */
    // Enemy movement

    setTargets((prevTargets) =>
      prevTargets.map((target, index) => {
        const [x, y, z] = target.position
        const newX = x + Math.sin(z * waveSpeed ) * waveIntensity * delta
        const newZ = z + speedTarget * delta // Adjust the speed as needed

        // Target shooting logic
        if (target.canShoot && canTargetShoot.current) {
          const newTargetBullet = {
            id: Math.random(),
            position: [...target.position],
          }
          setTargetBullets((prevTargetBullets) => [...prevTargetBullets, newTargetBullet])

          // Set the cooldown for this target using updatedTargets
          setTargets((prevTargets) =>
            prevTargets.map((t, i) => {
              if (i === index) {
                return { ...t, canShoot: false }
              }
              return t
            })
          )

          setTimeout(() => {
            setTargets((prevTargets) =>
              prevTargets.map((t, i) => {
                if (i === index) {
                  return { ...t, canShoot: true }
                }
                return t
              })
            )
          }, ((1 / shotSpeedTarget))  * 1000)
        }


        // Remove the target if its position.z is greater than 11
        if (newZ > 11) {
          const updatedTargets = targets.filter((t) => t.id !== target.id)
          // Add 1 target if position.z is greater than 11 up to maxTargets
          if (updatedTargets.length > maxTargets) {
            setTargets([...updatedTargets, ...Array.from({ length: 0 }, () => spawnRandomTarget())])
          } else {
            setTargets([...updatedTargets, ...Array.from({ length: 2 }, () => spawnRandomTarget())])
          }
          
        }
        return { ...target, position: [newX, y, newZ] }

      })
    )

    // Update target bullet positions
    setTargetBullets((prevTargetBullets) =>
      prevTargetBullets
        .map((bullet) => {
          const newPosition = new THREE.Vector3().fromArray(bullet.position)
          newPosition.z += bulletSpeedTarget * delta // Update the z position directly
          return {
            ...bullet,
            position: [newPosition.x, newPosition.y, newPosition.z],
          }
        })
        .filter((bullet) => bullet.position[2] > - 20)
        .filter((bullet) => bullet.position[2] < 11)
    )    

    // Check if target bullets collide with the player
    for (const targetBullet of targetBullets) {
      const targetBulletPosition = new THREE.Vector3(...targetBullet.position)
      const playerPosition = playerRef.current.position

      if (targetBulletPosition.distanceTo(playerPosition) < 1) {
        // Player is hit by a target bullet
        if (canDecreaseHP) {

          setPlayerHP((prevHP) => {
            const newHP = prevHP - 1
            onHPChange(newHP)
            return newHP
          })

          // Set the cooldown for HP decrease
          setCanDecreaseHP(false)
          setTimeout(() => {
            setCanDecreaseHP(true)
          }, hpDecreaseCooldown)
        }

        // Remove the target bullet
        setTargetBullets((prevTargetBullets) =>
          prevTargetBullets.filter((bullet) => bullet.id !== targetBullet.id)
        )
      }
    }

    // Log bullet positions
    // console.log("Bullet Positions:", bullets.map((bullet) => new THREE.Vector3().fromArray(bullet.position)))
  })

  return (
    <> 
      {/* Render Player */}
      <primitive ref={playerRef} object={playerModel.Spaceship_FernandoTheFlamingo} scale={40} rotation={[ 0, Math.PI, 0 ]} position={[0, 0, 9]} />

      {/* Render targets */}
      {targets.map((target, index) => (
        <Target key={index} position={target.position} />
      ))}

      {/* Player Bullet */}
      {playerBullets.map((bullet) => (
        <Bullet key={bullet.id} {...bullet} />
      ))}

      {/* Target Bullet */}
      {targetBullets.map((bullet) => (
        <EnemyBullet key={bullet.id} {...bullet} />
      ))}

    </>
  )
}