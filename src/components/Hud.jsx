const MAX_LIVES_ICONS = 5

export default function Hud({ lives, pizza, weaponName, weaponLevel, timeLeft }) {
  return (
    <div className="hud">
      <div className="hud-row">
        <span className="hud-lives">
          {Array.from({ length: MAX_LIVES_ICONS }, (_, i) => (
            <span key={i}>{i < lives ? '❤️' : '🖤'}</span>
          ))}
        </span>
        <span className="hud-time">⏱ {timeLeft}s</span>
      </div>
      <div className="hud-row">
        <span className="hud-pizza">🍕 x{pizza}</span>
        <span className="hud-weapon">Lv.{weaponLevel} {weaponName}</span>
      </div>
    </div>
  )
}
