export default function Controls({ onLeft, onRight, onAttack }) {
  return (
    <div className="controls">
      <button className="control-btn" onClick={onLeft} aria-label="左レーンへ移動">◀</button>
      <button className="control-btn attack-btn" onClick={onAttack} aria-label="ピザを投げる">🍕投げる</button>
      <button className="control-btn" onClick={onRight} aria-label="右レーンへ移動">▶</button>
    </div>
  )
}
