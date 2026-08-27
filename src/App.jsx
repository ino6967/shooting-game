import { useState } from 'react'
import StartScreen from './components/StartScreen'
import GameCanvas from './components/GameCanvas'
import ResultScreen from './components/ResultScreen'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('start') // 'start' | 'playing' | 'result'
  const [result, setResult] = useState(null)
  const [runKey, setRunKey] = useState(0)

  function handleStart() {
    setRunKey((k) => k + 1)
    setScreen('playing')
  }

  function handleGameEnd(state) {
    setResult({ status: state.status, pizza: state.pizza })
    setScreen('result')
  }

  return (
    <div className="app-root">
      {screen === 'start' && <StartScreen onStart={handleStart} />}
      {screen === 'playing' && <GameCanvas key={runKey} onGameEnd={handleGameEnd} />}
      {screen === 'result' && <ResultScreen result={result} onRetry={handleStart} />}
    </div>
  )
}
