import { getStarRating } from '../game/constants'

export default function ResultScreen({ result, onRetry }) {
  const cleared = result.status === 'cleared'
  const stars = getStarRating(result.pizza)

  return (
    <div className="overlay-screen">
      <h1>{cleared ? '配達成功!' : 'ゲームオーバー'}</h1>
      <p className="pizza-result">🍕 残りピザ {result.pizza}枚</p>
      {cleared && <p className="stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>}
      <button className="primary-btn" onClick={onRetry}>もう一度</button>
    </div>
  )
}
