import { GameState, PlayerState } from './types'
import { COLS, ROWS, processInput } from './GameEngine'

export interface Enemy extends PlayerState {
  aiState: 'patrol' | 'chase' | 'flee'
  senseRange: number
  patrolTick: number
}

const DIRS: ['up','down','left','right'] = ['up','down','left','right']
const D = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] } as const

export function tickEnemy(e: Enemy, state: GameState, now: number) {
  if (!e.alive) return
  const players = state.players.filter(p => p.alive && !(p as any).aiState)

  // Decide state
  const nearBomb = state.bombs.find(b =>
    dist(e, b) <= b.range + 1 && b.explodeAt - now < 1500)

  if (nearBomb) {
    e.aiState = 'flee'
  } else {
    const nearest = players.sort((a, b) => dist(e, a) - dist(e, b))[0]
    e.aiState = nearest && dist(e, nearest) <= e.senseRange ? 'chase' : 'patrol'
  }

  // Act
  if (e.aiState === 'chase') {
    const target = players.sort((a, b) => dist(e, a) - dist(e, b))[0]
    if (target) {
      // Try to place bomb if aligned
      if ((e.x === target.x || e.y === target.y) && dist(e, target) <= e.bombRange)
        processInput(state, e.id, { type: 'bomb' }, now)
      // Move toward
      const dir = Math.abs(target.x - e.x) >= Math.abs(target.y - e.y)
        ? (target.x > e.x ? 'right' : 'left')
        : (target.y > e.y ? 'down' : 'up')
      processInput(state, e.id, { type: 'move', direction: dir }, now)
    }
  } else if (e.aiState === 'flee') {
    const nb = state.bombs.reduce((a, b) => dist(e, a) < dist(e, b) ? a : b)
    const dir = DIRS.find(d => {
      const [dx, dy] = D[d]
      const nx = e.x + dx, ny = e.y + dy
      return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
        state.tiles[ny][nx] === 0 && dist({ x: nx, y: ny }, nb) > dist(e, nb)
    }) ?? DIRS[(e.patrolTick) % 4]
    processInput(state, e.id, { type: 'move', direction: dir }, now)
  } else {
    // Patrol: cycle directions
    if (e.patrolTick % 8 === 0) e.patrolTick++
    const dir = DIRS[e.patrolTick % 4]
    processInput(state, e.id, { type: 'move', direction: dir }, now)
    e.patrolTick++
  }
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}
