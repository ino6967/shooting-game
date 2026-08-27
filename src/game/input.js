// キーボード/タッチ操作の低レベルAPIをここに隔離し、
// 上位層には moveLeft / moveRight / attack という意味のあるイベントだけを渡す。
const FLICK_MIN_DISTANCE_PX = 40
const FLICK_MAX_DURATION_MS = 500

const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A'])
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D'])
const ATTACK_KEYS = new Set([' ', 'Spacebar', 'Enter'])

export function attachKeyboardInput({ onLeft, onRight, onAttack }) {
  function handleKeyDown(event) {
    if (LEFT_KEYS.has(event.key)) {
      event.preventDefault()
      onLeft()
    } else if (RIGHT_KEYS.has(event.key)) {
      event.preventDefault()
      onRight()
    } else if (ATTACK_KEYS.has(event.key)) {
      event.preventDefault()
      onAttack()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}

export function attachFlickInput(element, { onLeft, onRight }) {
  let startX = 0
  let startTime = 0

  function handleTouchStart(event) {
    const touch = event.touches[0]
    startX = touch.clientX
    startTime = performance.now()
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - startX
    const deltaTime = performance.now() - startTime
    if (deltaTime > FLICK_MAX_DURATION_MS) return
    if (Math.abs(deltaX) < FLICK_MIN_DISTANCE_PX) return
    if (deltaX < 0) onLeft()
    else onRight()
  }

  element.addEventListener('touchstart', handleTouchStart, { passive: true })
  element.addEventListener('touchend', handleTouchEnd, { passive: true })
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchend', handleTouchEnd)
  }
}
