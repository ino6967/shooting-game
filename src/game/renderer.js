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

  ctx.fillStyle = style.color
  ctx.fillRect(x - boxWidth / 2, y - 22, boxWidth, 44)

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

  // 被弾直後は白く点滅させて、当たったことがはっきり分かるようにする
  if (enemy.hitFlashMs > 0) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, enemy.hitFlashMs / 200) * 0.85
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - boxWidth / 2, y - 22, boxWidth, 44)
    ctx.restore()
  }

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
  const radius = laneWidth * 0.24 * (0.6 + 0.4 * growth)
  const rotation = projectile.rotation ?? 0

  // 飛んできた軌跡を複数残して、移動しているのがはっきり分かるようにする
  const trailOffsets = [radius * 1.6, radius * 3.0, radius * 4.4]
  const trailAlphas = [0.35, 0.22, 0.12]
  for (let i = 0; i < trailOffsets.length; i++) {
    ctx.globalAlpha = trailAlphas[i]
    drawPizza(ctx, x, y + trailOffsets[i], radius * 0.8, rotation)
  }
  ctx.globalAlpha = 1

  drawPizza(ctx, x, y, radius, rotation)
}

function drawPickup(ctx, width, height, laneWidth, pickup) {
  const x = laneCenterX(pickup.lane, 1, laneWidth)
  const y = pickup.y * height
  const radius = laneWidth * 0.18
  const bob = Math.sin(pickup.y * 40) * 3 // 落ちているピザを少し揺らして目立たせる

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 210, 60, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y + bob, radius + 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  drawPizza(ctx, x, y + bob, radius, 0)
}

function drawHitEffects(ctx, width, height, laneWidth, hitEffects) {
  for (const effect of hitEffects) {
    const x = laneCenterX(effect.lane, 1, laneWidth)
    const y = effect.y * height
    const t = effect.ms / 220 // 1(発生直後) -> 0(消滅直前)

    ctx.save()
    ctx.globalAlpha = t
    ctx.strokeStyle = '#ffe27a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, laneWidth * (0.1 + 0.3 * (1 - t)), 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#ffe27a'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💥', x, y)
    ctx.restore()
  }
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

  for (const pickup of state.pickups) drawPickup(ctx, width, height, laneWidth, pickup)
  for (const enemy of state.enemies) drawEnemy(ctx, width, height, laneWidth, enemy)
  for (const projectile of state.projectiles) drawProjectile(ctx, width, height, laneWidth, projectile)
  drawHitEffects(ctx, width, height, laneWidth, state.hitEffects)

  drawAttackFlash(ctx, width, height, state.lane, state.attackFlashMs)
  drawPlayer(ctx, width, height, state.lane)
  drawHitFlash(ctx, width, height, state.lastHitFlashMs)
}
