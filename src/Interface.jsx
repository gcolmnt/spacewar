import { useKeyboardControls } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { addEffect } from '@react-three/fiber'
import useGame from './stores/useGame.jsx'


export default function Interface({ score,  playerHP })
{
    const time = useRef()
    const start = useGame((state) => state.start)
    const restart = useGame((state) => state.restart)
    const phase = useGame((state) => state.phase)

    const renderHearts = () => {
        const hearts = []
        for (let i = 0; i < playerHP + 1; i++) {
          hearts.push(<img key={i} src="./heart.png" alt="heart" style={{ width: '75px', height: '75px' }}/>);
        }
        return hearts
    }

    useEffect(() =>
    {
        const unsubscribeEffect = addEffect(() => 
        {
            const state = useGame.getState()

            if(state.phase === 'playing')
                {}
            else if(state.phase === 'ended')
                {}
        })

        return () =>
        {
            unsubscribeEffect()
        }

    }, [])


    return <div className="interface">
        {/* Score */}
        <div className="score">Score : {score}</div>

        {/* HP */}
        <div className="playerHP">{renderHearts()}</div>

        {/* Ready */}
        { phase === 'ready' ? 
            <>
                <div className="start">Press any key</div>
            </>
             : null }
        {/* { phase === 'ended' && <div className="restart" onClick={ restart } >Restart</div> } */}


        {/* Restart */}
        { phase === 'ended' ? 
            <>
                <div className="death">You died</div>
                <div className="deathScore">You Scored : {score}</div>
                <div className="restart" onClick={ restart } >Restart</div> 
            </>
             : null }
        {/* { phase === 'ended' && <div className="restart" onClick={ restart } >Restart</div> } */}

    </div>

}