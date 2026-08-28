import { useState } from 'react'

// タップ操作の押下フィードバック(色変化・へこみ)をボタンごとに管理する
function usePressFeedback(action) {
  const [pressed, setPressed] = useState(false)
  return [
    pressed,
    {
      onPointerDown: (event) => {
        event.preventDefault()
        setPressed(true)
        action()
      },
      onPointerUp: () => setPressed(false),
      onPointerLeave: () => setPressed(false),
      onPointerCancel: () => setPressed(false),
    },
  ]
}

export default function Controls({ onLeft, onRight, onAttack, attackHintActive }) {
  const [leftPressed, leftHandlers] = usePressFeedback(onLeft)
  const [rightPressed, rightHandlers] = usePressFeedback(onRight)
  const [attackPressed, attackHandlers] = usePressFeedback(onAttack)

  return (
    <div className="controls">
      <button
        className={`control-btn${leftPressed ? ' is-pressed' : ''}`}
        aria-label="左レーンへ移動"
        {...leftHandlers}
      >
        ◀
      </button>
      <button
        className={`control-btn attack-btn${attackPressed ? ' is-pressed' : ''}${attackHintActive ? ' is-hint' : ''}`}
        aria-label="ピザを投げる"
        {...attackHandlers}
      >
        <span className="attack-btn-icon">🍕</span>投げる
      </button>
      <button
        className={`control-btn${rightPressed ? ' is-pressed' : ''}`}
        aria-label="右レーンへ移動"
        {...rightHandlers}
      >
        ▶
      </button>
    </div>
  )
}
