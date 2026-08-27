export default function StartScreen({ onStart }) {
  return (
    <div className="overlay-screen">
      <h1>🍕 ピザ宅配シューティング</h1>
      <p>悪のピザ店の妨害をかわして、できるだけ多くピザを届けよう。</p>
      <ul className="rules">
        <li>← → / フリック : レーン移動</li>
        <li>スペース / 🍕ボタン : ピザを投げて攻撃</li>
        <li>倒すか避けるか、ぶつかるとダメージ(5回でゲームオーバー)</li>
      </ul>
      <button className="primary-btn" onClick={onStart}>スタート</button>
    </div>
  )
}
