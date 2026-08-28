export default function TutorialHint({ visible }) {
  return (
    <div className={`tutorial-hint${visible ? '' : ' is-hidden'}`}>
      <span>◀▶ で移動</span>
      <span>🍕投げる ボタンで攻撃</span>
    </div>
  )
}
