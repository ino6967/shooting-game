export const LANE_COUNT = 5
export const MAX_LIVES = 5
export const STAGE_DURATION_SEC = 75
export const INITIAL_PIZZA = 10

export const PLAYER_ROW_Y = 0.85 // 画面高さに対する縦位置(0=上, 1=下)
export const SPAWN_ROW_Y = -0.08

export const PROJECTILE_SPEED = 1.6 // 画面高さ/秒
export const ICE_SLIP_DURATION_SEC = 3
export const ICE_INPUT_DELAY_MS = 220

// 撃破数に応じた武器進化(ラン中限定)
export const WEAPON_STAGES = [
  { level: 1, name: '手投げ', killsRequired: 0, cooldownMs: 650, pierce: false, multiLane: false },
  { level: 2, name: 'ピザガン', killsRequired: 5, cooldownMs: 400, pierce: false, multiLane: false },
  { level: 3, name: 'マシンガン', killsRequired: 15, cooldownMs: 220, pierce: false, multiLane: false },
  { level: 4, name: 'レーザーガン', killsRequired: 30, cooldownMs: 180, pierce: true, multiLane: true },
]

export function getWeaponStage(killCount) {
  let stage = WEAPON_STAGES[0]
  for (const s of WEAPON_STAGES) {
    if (killCount >= s.killsRequired) stage = s
  }
  return stage
}

// クリア時の残ピザ枚数によるスコア評価(叩き台)
export function getStarRating(pizza) {
  if (pizza >= 20) return 3
  if (pizza >= 10) return 2
  return 1
}
