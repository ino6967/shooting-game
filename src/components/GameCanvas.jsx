import { useEffect, useMemo, useRef, useState } from 'react'
import { createGameEngine } from '../game/engine'
import { renderGame } from '../game/renderer'
import { attachKeyboardInput, attachFlickInput } from '../game/input'
import { getWeaponStage, STAGE_DURATION_SEC } from '../game/constants'
import { useGameLoop } from '../hooks/useGameLoop'
import Hud from './Hud'
import Controls from './Controls'
import TutorialHint from './TutorialHint'

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 700
const HINT_DURATION_SEC = 6

function summarize(state) {
  return {
    lives: state.lives,
    pizza: state.pizza,
    weaponName: getWeaponStage(state.killCount).name,
    weaponLevel: getWeaponStage(state.killCount).level,
    timeLeft: Math.ceil(state.timeLeftSec),
    status: state.status,
    showHint: state.attacksFired === 0 && state.elapsedSec < HINT_DURATION_SEC,
  }
}

export default function GameCanvas({ onGameEnd }) {
  const engine = useMemo(() => createGameEngine(), [])
  const canvasRef = useRef(null)
  const endedRef = useRef(false)
  const [hud, setHud] = useState(() => summarize(engine.getState()))

  useEffect(() => {
    const canvas = canvasRef.current
    const cleanupKeyboard = attachKeyboardInput({
      onLeft: engine.moveLeft,
      onRight: engine.moveRight,
      onAttack: engine.attack,
    })
    const cleanupFlick = attachFlickInput(canvas, {
      onLeft: engine.moveLeft,
      onRight: engine.moveRight,
    })
    return () => {
      cleanupKeyboard()
      cleanupFlick()
    }
  }, [engine])

  useGameLoop((dtSec) => {
    engine.update(dtSec)
    const state = engine.getState()

    const ctx = canvasRef.current.getContext('2d')
    renderGame(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, state)
    setHud(summarize(state))

    if (state.status !== 'playing' && !endedRef.current) {
      endedRef.current = true
      onGameEnd(state)
    }
  }, true)

  return (
    <div className="game-screen">
      <Hud {...hud} timeMax={STAGE_DURATION_SEC} />
      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
        />
        <TutorialHint visible={hud.showHint} />
      </div>
      <Controls
        onAttack={engine.attack}
        onLeft={engine.moveLeft}
        onRight={engine.moveRight}
        attackHintActive={hud.showHint}
      />
    </div>
  )
}
