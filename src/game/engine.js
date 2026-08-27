import {
  LANE_COUNT,
  MAX_LIVES,
  STAGE_DURATION_SEC,
  INITIAL_PIZZA,
  PLAYER_ROW_Y,
  PROJECTILE_SPEED,
  ICE_SLIP_DURATION_SEC,
  ICE_INPUT_DELAY_MS,
  getWeaponStage,
} from './constants'
import { createEnemy, occupiesLane, damageEnemy } from './enemies'

const HIT_RANGE_Y = 0.045
const ENEMY_SPAWN_INTERVAL_MS = [900, 1500]

function randRange([min, max]) {
  return min + Math.random() * (max - min)
}

let projectileSeq = 0

export function createGameEngine() {
  let state = null

  function reset() {
    state = {
      status: 'playing', // 'playing' | 'gameover' | 'cleared'
      lane: Math.floor(LANE_COUNT / 2),
      lives: MAX_LIVES,
      pizza: INITIAL_PIZZA,
      killCount: 0,
      elapsedSec: 0,
      timeLeftSec: STAGE_DURATION_SEC,
      attackCooldownMs: 0,
      spawnTimerMs: randRange(ENEMY_SPAWN_INTERVAL_MS),
      pendingMove: null, // { direction, remainingMs }
      iceLanes: {}, // lane -> 残り滑り時間(ms)
      enemies: [],
      projectiles: [],
      lastHitFlashMs: 0,
    }
  }

  function isLaneIcy(lane) {
    return (state.iceLanes[lane] ?? 0) > 0
  }

  function requestMove(direction) {
    if (state.status !== 'playing') return
    if (isLaneIcy(state.lane)) {
      state.pendingMove = { direction, remainingMs: ICE_INPUT_DELAY_MS }
    } else {
      state.lane = Math.min(LANE_COUNT - 1, Math.max(0, state.lane + direction))
    }
  }

  function moveLeft() {
    requestMove(-1)
  }

  function moveRight() {
    requestMove(1)
  }

  function attack() {
    if (state.status !== 'playing') return
    if (state.attackCooldownMs > 0) return
    if (state.pizza <= 0) return

    const stage = getWeaponStage(state.killCount)
    state.pizza -= 1
    state.attackCooldownMs = stage.cooldownMs

    const lanes = stage.multiLane
      ? [state.lane - 1, state.lane, state.lane + 1].filter((l) => l >= 0 && l < LANE_COUNT)
      : [state.lane]

    for (const lane of lanes) {
      state.projectiles.push({
        id: `p${projectileSeq++}`,
        lane,
        y: PLAYER_ROW_Y - 0.03,
        pierce: stage.pierce,
      })
    }
  }

  function updateIce(dtMs) {
    for (const lane of Object.keys(state.iceLanes)) {
      state.iceLanes[lane] = Math.max(0, state.iceLanes[lane] - dtMs)
      if (state.iceLanes[lane] === 0) delete state.iceLanes[lane]
    }
    if (state.pendingMove) {
      state.pendingMove.remainingMs -= dtMs
      if (state.pendingMove.remainingMs <= 0) {
        state.lane = Math.min(
          LANE_COUNT - 1,
          Math.max(0, state.lane + state.pendingMove.direction)
        )
        state.pendingMove = null
      }
    }
  }

  function updateSpawning(dtMs) {
    state.spawnTimerMs -= dtMs
    if (state.spawnTimerMs <= 0) {
      state.enemies.push(createEnemy(LANE_COUNT, state.elapsedSec))
      state.spawnTimerMs = randRange(ENEMY_SPAWN_INTERVAL_MS)
    }
  }

  function fireRangedAttack(enemy) {
    if (enemy.inflictsIce) {
      if (occupiesLane(enemy, state.lane)) {
        state.iceLanes[state.lane] = ICE_SLIP_DURATION_SEC * 1000
      }
      enemy.rangedFlashLane = state.lane
    } else {
      if (occupiesLane(enemy, state.lane)) {
        state.lives = Math.max(0, state.lives - 1)
        state.lastHitFlashMs = 200
      }
      enemy.rangedFlashLane = state.lane
    }
    enemy.rangedFlashMs = 250
  }

  function updateEnemies(dtSec, dtMs) {
    for (const enemy of state.enemies) {
      enemy.y += enemy.speed * dtSec
      if (enemy.hitFlashMs > 0) enemy.hitFlashMs = Math.max(0, enemy.hitFlashMs - dtMs)
      if (enemy.rangedFlashMs > 0) enemy.rangedFlashMs = Math.max(0, enemy.rangedFlashMs - dtMs)

      if (enemy.ranged && enemy.y >= 0.1 && enemy.y < PLAYER_ROW_Y) {
        enemy.rangedCooldownMs -= dtMs
        if (enemy.rangedCooldownMs <= 0) {
          fireRangedAttack(enemy)
          enemy.rangedCooldownMs = enemy.rangedIntervalMs
        }
      }

      if (enemy.hp > 0 && enemy.y >= PLAYER_ROW_Y && occupiesLane(enemy, state.lane)) {
        state.lives = Math.max(0, state.lives - 1)
        state.lastHitFlashMs = 200
        enemy.hp = 0
        enemy.y = 999 // 激突済みとして除去対象にする
      }
    }
    state.enemies = state.enemies.filter((e) => e.hp > 0 && e.y < 1.15)
  }

  function updateProjectiles(dtSec) {
    for (const projectile of state.projectiles) {
      projectile.y -= PROJECTILE_SPEED * dtSec
    }

    for (const projectile of state.projectiles) {
      if (projectile.hit) continue
      for (const enemy of state.enemies) {
        if (enemy.hp <= 0) continue
        if (!occupiesLane(enemy, projectile.lane)) continue
        if (Math.abs(enemy.y - projectile.y) > HIT_RANGE_Y) continue

        const defeated = damageEnemy(enemy, 1)
        if (defeated) {
          state.pizza += enemy.reward
          state.killCount += 1
        }
        if (!projectile.pierce) {
          projectile.hit = true
          break
        }
      }
    }

    state.projectiles = state.projectiles.filter((p) => !p.hit && p.y > -0.05)
  }

  function update(dtSec) {
    if (state.status !== 'playing') return
    const dtMs = dtSec * 1000

    state.elapsedSec += dtSec
    state.timeLeftSec = Math.max(0, state.timeLeftSec - dtSec)
    state.attackCooldownMs = Math.max(0, state.attackCooldownMs - dtMs)
    if (state.lastHitFlashMs > 0) state.lastHitFlashMs = Math.max(0, state.lastHitFlashMs - dtMs)

    updateIce(dtMs)
    updateSpawning(dtMs)
    updateEnemies(dtSec, dtMs)
    updateProjectiles(dtSec)

    if (state.lives <= 0) {
      state.status = 'gameover'
      return
    }
    if (state.timeLeftSec <= 0) {
      state.status = 'cleared'
    }
  }

  function getState() {
    return state
  }

  reset()

  return { reset, moveLeft, moveRight, attack, update, getState }
}
