import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import Bullet from './Bullet.jsx'
import EnemyBullet from './EnemyBullet.jsx'
import useGame from './stores/useGame.jsx'
import PowerUp from './PowerUp.jsx'

export default function Player({ onScoreChange, onHPChange }) {

  const { nodes: playerModel } = useGLTF('./SpaceshipQuaternius.glb') 
  const { nodes: targetModel } = useGLTF('./SpaceshipTarget.glb')
   

  /**
   * Const Setting
   */

  const playerBaseHP = 2
  const playerBaseShootSpeed = 5
  const speedModifier = 1
  const speedPlayer = 10
  const speedTarget = 5
  const bulletSpeedPlayer = 20
  const bulletSpeedTarget = 15
  const shotSpeedTarget = 0.5
  const waveSpeed = 0.5
  const waveIntensity = 7
  const powerUpChance = 10/100 

  const playerRef = useRef()
  const canShoot = useRef(true)
  const canTargetShoot = useRef(true)

  const [subscribeKeys, getKeys] = useKeyboardControls()

  const [ startMusic ] = useState(() => new Audio('./OldschoolMain.mp3'))
  const [ fireMusic ] = useState(() => new Audio('./Fire.mp3'))
  const [ hitMusic ] = useState(() => new Audio('./Hit.mp3'))
  const [ gameOverMusic ] = useState(() => new Audio('./GameOver.mp3'))
  const [ powerUpMusic ] = useState(() => new Audio('./SFX_Powerup_01.wav'))

  const [ gameOverMusicON, setGameOverMusicON ] = useState(true)
  const [playerBullets, setPlayerBullets] = useState([])
  const [targetBullets, setTargetBullets] = useState([])
  const [powerUps, setPowerUps] = useState([])
  const [targets, setTargets] = useState([])

  const [score, setScore] = useState(0)

  const [playerHP, setPlayerHP] = useState(playerBaseHP)
  const [shotSpeedPlayer, setShotSpeedPlayer] = useState(playerBaseShootSpeed)
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

  /**
   * Power Up Creation Function
   */

  const spawnPowerUP = (position) => {
    const newPowerUP = {
      id: Math.random(),
      position: [...position],
    }

    setPowerUps((prevPowerUps) => [...prevPowerUps, { id: newPowerUP.id, position: newPowerUP.position }])
    return newPowerUP
  }

  const start = useGame((state) => state.start)
  const end = useGame((state) => state.end)
  const restart = useGame((state) => state.restart)

  const reset = () =>
  {
    playerRef.current.position.z = 0
    playerRef.current.position.x = 0
    playerRef.current.position.z = 9
    setGameOverMusicON(true)
    startMusic.pause()
    setPlayerHP((prevHP) => {
      const newHP = playerBaseHP
      onHPChange(newHP)
      return newHP
    })
    setShotSpeedPlayer((prevShotSpeed) => {
      const newShotSpeed = playerBaseShootSpeed
      return newShotSpeed
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
            startMusic.playbackRate = 0.92
            startMusic.currentTime = 0
            startMusic.loop = true
            startMusic.volume = 0.20
            startMusic.play()
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

    console.log(shotSpeedPlayer)

    const { forward, backward, leftward, rightward, shoot } = getKeys()

    /**
     * Player
     * - Movement
     * - HP
     * - Shooting
     * - Collision
     */
    if (forward) playerRef.current.position.z = Math.max(playerRef.current.position.z - speedModifier * speedPlayer * delta, minZ)

    if (backward) playerRef.current.position.z = Math.min(playerRef.current.position.z + speedModifier * 1.5 * speedPlayer * delta, maxZ)

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
      setPowerUps([])
      startMusic.pause()
      if ( gameOverMusicON ) {
        gameOverMusic.currentTime = 0
        gameOverMusic.volume = 0.25
        gameOverMusic.play()
        setGameOverMusicON(false)
      }
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
      fireMusic.currentTime = 0
      fireMusic.volume = 0.15
      fireMusic.play()
  
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

        // Loop collision check for each bullets collide with the targets
        for (const target of targets) {
          // Get the bulletPosition as a Vector 3
          const targetPosition = new THREE.Vector3(...target.position)
          // Check bullet position distance to target position
          if (targetPosition && bulletPosition.distanceTo(targetPosition) < 1) {
            // Remove the target if a bullet hit the target
            const updatedTargets = targets.filter((t) => t.id !== target.id)
            // 1/10 chance of dropping a power UP
            if (Math.random() < powerUpChance) {
              console.log("powerUP")
              spawnPowerUP(target.position)
            }
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
          hitMusic.currentTime = 0
          hitMusic.volume = 0.4
          hitMusic.play()
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
     * Power Up
     */
    // Movement
    setPowerUps((prevPowerUps) =>
    prevPowerUps
      .map((powerUp) => {
        const newPosition = new THREE.Vector3().fromArray(powerUp.position)
        newPosition.z += bulletSpeedTarget * 0.5 * delta // Update the z position directly
        return {
          ...powerUp,
          position: [newPosition.x, newPosition.y, newPosition.z],
        }
      })
      .filter((powerUp) => powerUp.position[2] > - 20)
      .filter((powerUp) => powerUp.position[2] < 11)
    )

    // Loop collision check for each powerUp collide with the player
    for (const powerUp of powerUps) {
      const powerUpPosition = new THREE.Vector3(...powerUp.position)
      const playerPosition = playerRef.current.position

      if (powerUpPosition.distanceTo(playerPosition) < 1.5) {
        // Player is hit by a target bullet
        powerUpMusic.currentTime = 0
        powerUpMusic.volume = 0.2
        powerUpMusic.play()
        setShotSpeedPlayer((prevSpeed) => prevSpeed + 0.5)

        // Remove the target bullet
        setPowerUps((prevPowerUps) =>
        prevPowerUps.filter((p) => p.id !== powerUp.id)
        )
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

    // Loop collision check for each bullets collide with the targets
    for (const targetBullet of targetBullets) {
      const targetBulletPosition = new THREE.Vector3(...targetBullet.position)
      const playerPosition = playerRef.current.position

      if (targetBulletPosition.distanceTo(playerPosition) < 1) {
        // Player is hit by a target bullet
        if (canDecreaseHP) {
          hitMusic.currentTime = 0
          hitMusic.volume = 0.4
          hitMusic.play()
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

      {/* Power Up */}
      {powerUps.map((powerUp) => (
        <PowerUp key={powerUp.id} {...powerUp} />
      ))}


    </>
  )
}