// 敵種別の定義(内部HPはピザ1枚=1ダメージのカウント、表示HPは演出用の見せかけ数値)
export const ENEMY_TYPES = {
  bicycle: { key: 'bicycle', label: '自転車', laneSpan: 1, hp: 1, reward: 2, speed: 0.22 },
  bike: { key: 'bike', label: 'バイク', laneSpan: 1, hp: 2, reward: 3, speed: 0.19 },
  car: { key: 'car', label: '車', laneSpan: 1, hp: 2, reward: 4, speed: 0.17 },
  truck: { key: 'truck', label: 'トラック', laneSpan: null, hp: 3, reward: 6, speed: 0.14 }, // laneSpanは1か2をランダム
  bigTruck: { key: 'bigTruck', label: '大型トラック', laneSpan: 2, hp: 4, reward: 8, speed: 0.12 },
  tank: {
    key: 'tank',
    label: '戦車',
    laneSpan: 2,
    hp: 5,
    reward: 12,
    speed: 0.1,
    ranged: true,
    rangedIntervalMs: 1800,
  },
  wizard: {
    key: 'wizard',
    label: '魔法使い',
    laneSpan: 1,
    hp: 2,
    reward: 4,
    speed: 0.15,
    ranged: true,
    rangedIntervalMs: 2200,
    inflictsIce: true,
  },
}

const SPAWN_TABLE = [
  'bicycle', 'bicycle', 'bike', 'bike', 'car',
  'truck', 'bigTruck', 'wizard', 'tank',
]

let spawnSeq = 0

function displayHpMax(hp) {
  return hp * 20 - 1
}

export function createEnemy(laneCount, elapsedSec) {
  const typeKey = SPAWN_TABLE[Math.floor(Math.random() * SPAWN_TABLE.length)]
  const def = ENEMY_TYPES[typeKey]
  const laneSpan = def.laneSpan ?? (Math.random() < 0.5 ? 1 : 2)
  const maxStartLane = laneCount - laneSpan
  const lane = Math.floor(Math.random() * (maxStartLane + 1))

  // 経過時間に応じてわずかに速度を上げる(緩やかな難易度上昇)
  const speedUp = 1 + Math.min(elapsedSec / 120, 0.4)

  return {
    id: `e${spawnSeq++}`,
    type: def.key,
    label: def.label,
    lane,
    laneSpan,
    hp: def.hp,
    maxHp: def.hp,
    displayHp: displayHpMax(def.hp),
    displayHpMax: displayHpMax(def.hp),
    reward: def.reward,
    speed: def.speed * speedUp,
    y: -0.08,
    ranged: !!def.ranged,
    rangedIntervalMs: def.rangedIntervalMs ?? 0,
    rangedCooldownMs: def.rangedIntervalMs ?? 0,
    inflictsIce: !!def.inflictsIce,
    hitFlashMs: 0,
  }
}

export function occupiesLane(enemy, lane) {
  return lane >= enemy.lane && lane < enemy.lane + enemy.laneSpan
}

export function damageEnemy(enemy, amount) {
  enemy.hp = Math.max(0, enemy.hp - amount)
  enemy.displayHp = Math.round(enemy.displayHpMax * (enemy.hp / enemy.maxHp))
  enemy.hitFlashMs = 200
  return enemy.hp <= 0
}
