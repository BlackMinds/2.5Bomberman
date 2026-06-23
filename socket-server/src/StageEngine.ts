import type { GameState, PlayerState } from './types'
import { tickEnemy } from './EnemyAI'
import type { Enemy } from './EnemyAI'
import { createPlayer, createState, COLS, ROWS } from './GameEngine'
import { STAGE_CONFIG } from './stageConfig'

const ENEMY_SPAWNS = [
  { x: 4, y: ROWS - 1.5 }, { x: 7, y: ROWS - 1.5 }, { x: 10, y: ROWS - 1.5 },
  { x: 5, y: ROWS - 1.5 }, { x: 8, y: ROWS - 1.5 }, { x: 11, y: ROWS - 1.5 },
  { x: 3, y: ROWS - 1.5 }, { x: 6, y: ROWS - 1.5 }, { x: 9, y: ROWS - 1.5 }, { x: 12, y: ROWS - 1.5 },
]

export function createStageState(stageId: number, players: PlayerState[]): GameState & { enemies: Enemy[] } {
  const cfg = STAGE_CONFIG[stageId]
  const base = createState(players) as GameState & { enemies: Enemy[] }
  base.tiles = base.tiles.map((row, r) => row.map(() => (r === ROWS - 1 ? 1 : 0)))
  players.forEach((p, i) => {
    p.x = 0.5 + i
    p.y = ROWS - 1.5
    p.vx = 0
    p.vy = 0
    p.onGround = false
  })
  const count = cfg.enemyMin + Math.floor(Math.random() * (cfg.enemyMax - cfg.enemyMin + 1))

  base.enemies = Array.from({ length: count }, (_, i) => {
    const sp = ENEMY_SPAWNS[i % ENEMY_SPAWNS.length]
    const e: Enemy = {
      ...createPlayer(`enemy-${i}`, `enemy-${i}`, `Enemy ${i + 1}`, 0,
        { damage: cfg.enemyDamage, hp: cfg.enemyHp, speed: cfg.enemySpeed }),
      x: sp.x, y: sp.y,
      aiState: 'patrol',
      senseRange: cfg.senseRange,
      patrolTick: i * 2,
    }
    base.players.push(e)
    return e
  })

  return base
}

export function tickEnemies(state: GameState & { enemies?: Enemy[] }, now: number) {
  for (const e of state.enemies ?? []) tickEnemy(e, state, now)
}

export function isStageCleared(state: GameState & { enemies?: Enemy[] }): boolean {
  return (state.enemies ?? []).every(e => !e.alive)
}
