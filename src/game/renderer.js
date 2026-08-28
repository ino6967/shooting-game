// Canvas描画のプリミティブ呼び出しをここに隔離する。上位層はstateを渡すだけでよい。
import { LANE_COUNT, PLAYER_ROW_Y } from './constants'

// rotate: true の絵文字は左向きがデフォルトなので、縦スクロールの進行方向に合わせて回転させる
const ENEMY_STYLE = {
  bicycle: { color: '#7fd858', emoji: '🚲', rotate: true },
  bike: { color: '#4fb0e6', emoji: '🏍️', rotate: true },
  car: { color: '#e6c84f', emoji: '🚗', rotate: true },
  truck: { color: '#e69a4f', emoji: '🚚', rotate: true },
  bigTruck: { color: '#e66f4f', emoji: '🚛', rotate: true },
  tank: { color: '#8a8a8a', emoji: '🛞', rotate: false },
  wizard: { color: '#b06fe6', emoji: '🧙', rotate: false },
}

const PLAYER_EMOJI = '🏍️'

function laneCenterX(lane, laneSpan, laneWidth) {
  return (lane + laneSpan / 2) * laneWidth
}

function drawBackground(ctx, width, height) {
  ctx.fillStyle = '#2b2b33'
  ctx.fillRect(0, 0, width, height)

  const laneWidth = width / LANE_COUNT
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.setLineDash([14, 14])
  for (let i = 1; i < LANE_COUNT; i++) {
    ctx.beginPath()
    ctx.moveTo(i * laneWidth, 0)
    ctx.lineTo(i * laneWidth, height)
    ctx.stroke()
  }
  ctx.setLineDash([])
}

function drawIceLanes(ctx, width, height, iceLanes) {
  const laneWidth = width / LANE_COUNT
  ctx.fillStyle = 'rgba(120, 210, 255, 0.35)'
  for (const laneKey of Object.keys(iceLanes)) {
    const lane = Number(laneKey)
    ctx.fillRect(lane * laneWidth, 0, laneWidth, height)
  }
}

// 丸いホールピザを描く(スライス絵文字ではなく円形で表現する)
function drawPizza(ctx, x, y, radius, rotation = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  ctx.fillStyle = '#e8b23d'
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#c1391f'
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f2c94c'
  const pepperoniRadius = radius * 0.16
  const ringRadius = radius * 0.45
  const pepperoniCount = 5
  for (let i = 0; i < pepperoniCount; i++) {
    const angle = (i / pepperoniCount) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, pepperoniRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawPlayer(ctx, width, height, lane) {
  const laneWidth = width / LANE_COUNT
  const x = laneCenterX(lane, 1, laneWidth)
  const y = PLAYER_ROW_Y * height

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.PI / 2) // 進行方向(上向き)に合わせて回転(絵文字は左向きが基準)
  ctx.font = `${Math.floor(laneWidth * 0.6)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(PLAYER_EMOJI, 0, 0)
  ctx.restore()
}

function drawAttackFlash(ctx, width, height, lane, attackFlashMs) {
  if (attackFlashMs <= 0) return
  const laneWidth = width / LANE_COUNT
  const x = laneCenterX(lane, 1, laneWidth)
  const y = PLAYER_ROW_Y * height
  const t = attackFlashMs / 150

  ctx.save()
  ctx.globalAlpha = t
  ctx.strokeStyle = '#ffd23c'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y, laneWidth * (0.15 + 0.35 * (1 - t)), 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawEnemy(ctx, width, height, laneWidth, enemy) {
  const style = ENEMY_STYLE[enemy.type]
  const x = laneCenterX(enemy.lane, enemy.laneSpan, laneWidth)
  const y = enemy.y * height
  const boxWidth = enemy.laneSpan * laneWidth * 0.82

  ctx.save()
  if (enemy.hitFlashMs > 0) ctx.globalAlpha = 0.6
  ctx.fillStyle = style.color
  ctx.fillRect(x - boxWidth / 2, y - 22, boxWidth, 44)
  ctx.restore()

  ctx.save()
  ctx.translate(x, y - 26)
  if (style.rotate) ctx.rotate(-Math.PI / 2) // プレイヤーへ向かって進む方向(下向き)に合わせる
  ctx.font = '26px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(style.emoji, 0, 0)
  ctx.restore()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(enemy.displayHp), x, y + 4)

  if (enemy.rangedFlashMs > 0 && enemy.rangedFlashLane != null) {
    const flashX = laneCenterX(enemy.rangedFlashLane, 1, laneWidth)
    ctx.strokeStyle = enemy.inflictsIce ? 'rgba(120,210,255,0.9)' : 'rgba(255,80,80,0.9)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(flashX, y)
    ctx.lineTo(flashX, PLAYER_ROW_Y * height)
    ctx.stroke()
  }
}

function drawProjectile(ctx, width, height, laneWidth, projectile) {
  const x = laneCenterX(projectile.lane, 1, laneWidth)
  const y = projectile.y * height
  const growth = Math.min(1, (projectile.ageMs ?? 999) / 120) // 発射直後にポップインさせる
  const radius = laneWidth * 0.15 * (0.6 + 0.4 * growth)

  // 飛んできた軌跡を薄く残して、投げた勢いが分かるようにする
  ctx.globalAlpha = 0.3
  drawPizza(ctx, x, y + radius * 2, radius * 0.75, projectile.rotation ?? 0)
  ctx.globalAlpha = 1

  drawPizza(ctx, x, y, radius, projectile.rotation ?? 0)
}

function drawHitFlash(ctx, width, height, lastHitFlashMs) {
  if (lastHitFlashMs <= 0) return
  ctx.fillStyle = `rgba(255,0,0,${0.35 * (lastHitFlashMs / 200)})`
  ctx.fillRect(0, 0, width, height)
}

export function renderGame(ctx, width, height, state) {
  const laneWidth = width / LANE_COUNT

  drawBackground(ctx, width, height)
  drawIceLanes(ctx, width, height, state.iceLanes)

  for (const enemy of state.enemies) drawEnemy(ctx, width, height, laneWidth, enemy)
  for (const projectile of state.projectiles) drawProjectile(ctx, width, height, laneWidth, projectile)

  drawAttackFlash(ctx, width, height, state.lane, state.attackFlashMs)
  drawPlayer(ctx, width, height, state.lane)
  drawHitFlash(ctx, width, height, state.lastHitFlashMs)
}
