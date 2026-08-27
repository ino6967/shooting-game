import { useEffect, useRef } from 'react'

const MAX_DT_SEC = 0.05 // タブ非アクティブ復帰時の大ジャンプを防ぐ

// requestAnimationFrameという低レベルAPIをここに隔離し、上位にはdt(秒)だけを渡す。
export function useGameLoop(onFrame, active) {
  const callbackRef = useRef(onFrame)
  callbackRef.current = onFrame

  useEffect(() => {
    if (!active) return
    let rafId
    let lastTime = performance.now()

    function tick(now) {
      const dtSec = Math.min(MAX_DT_SEC, (now - lastTime) / 1000)
      lastTime = now
      callbackRef.current(dtSec)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [active])
}
