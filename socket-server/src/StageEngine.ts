import { GameState, PlayerState } from './types'
import { Enemy, tickEnemy } from './EnemyAI'
import { createPlayer, createState, COLS, ROWS } from './GameEngine'
import { STAGE_CONFIG } from '../../server/utils/stageConfig'

const ENEMY_SPAWNS = [
  { x: 6, y: 5 }, { x: 8, y: 3 }, { x: 4, y: 7 },
  { x: 10, y: 2 }, { x: 2, y: 8 }, { x: 9, y: 6 },
  { x: 5, y: 2 }, { x: 7, y: 8 }, { x: 11, y: 4 }, { x: 3, y: 4 },
]

export function createStageState(stageId: number, players: PlayerState[]): GameState & { enemies: Enemy[] } {
  const cfg = STAGE_CONFIG[stageId]
  const base = createState(players) as GameState & { enemies: Enemy[] }
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
