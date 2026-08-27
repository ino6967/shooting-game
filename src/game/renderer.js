// Canvas描画のプリミティブ呼び出しをここに隔離する。上位層はstateを渡すだけでよい。
import { LANE_COUNT, PLAYER_ROW_Y } from './constants'

const ENEMY_STYLE = {
  bicycle: { color: '#7fd858', emoji: '🚲' },
  bike: { color: '#4fb0e6', emoji: '🏍️' },
  car: { color: '#e6c84f', emoji: '🚗' },
  truck: { color: '#e69a4f', emoji: '🚚' },
  bigTruck: { color: '#e66f4f', emoji: '🚛' },
  tank: { color: '#8a8a8a', emoji: '🛞' },
  wizard: { color: '#b06fe6', emoji: '🧙' },
}

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

function drawPlayer(ctx, width, height, lane) {
  const laneWidth = width / LANE_COUNT
  const x = laneCenterX(lane, 1, laneWidth)
  const y = PLAYER_ROW_Y * height
  ctx.font = `${Math.floor(laneWidth * 0.6)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🍕🏍️', x, y)
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

  ctx.font = '26px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(style.emoji, x, y - 26)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px sans-serif'
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
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🍕', x, y)
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

  drawPlayer(ctx, width, height, state.lane)
  drawHitFlash(ctx, width, height, state.lastHitFlashMs)
}
