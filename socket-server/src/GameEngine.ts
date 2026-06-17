import { GameState, PlayerState, BombState, ItemState, TileType } from './types'

export const COLS = 13
export const ROWS = 11
const BOMB_MS = 2000
const GAME_MS = 3 * 60 * 1000

export function createMap(): TileType[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (r % 2 === 1 && c % 2 === 1) return 1
      // Keep corner spawn areas clear
      if ((r <= 1 && c <= 1) || (r <= 1 && c >= COLS - 2) ||
          (r >= ROWS - 2 && c <= 1) || (r >= ROWS - 2 && c >= COLS - 2)) return 0
      return Math.random() < 0.5 ? 2 : 0
    }) as TileType[]
  )
}

const SPAWNS = [
  { x: 0, y: 0 }, { x: COLS - 1, y: 0 },
  { x: 0, y: ROWS - 1 }, { x: COLS - 1, y: ROWS - 1 },
]

export function createPlayer(id: string, userId: string, username: string, idx: number,
  stats: { damage: number; hp: number; speed: number }): PlayerState {
  const sp = SPAWNS[idx % 4]
  return {
    id, userId, username, x: sp.x, y: sp.y,
    hp: stats.hp, maxHp: stats.hp, alive: true,
    damage: stats.damage, speed: stats.speed,
    bombRange: 2, maxBombs: 1, activeBombs: 0,
    direction: 'down', lastMoveAt: 0,
  }
}

export function createState(players: PlayerState[]): GameState {
  return { tick: 0, phase: 'waiting', players, bombs: [], items: [], tiles: createMap(), timeLeft: GAME_MS }
}

export function processInput(
  state: GameState, playerId: string,
  input: { type: 'move' | 'bomb'; direction?: 'up'|'down'|'left'|'right' },
  now: number
) {
  const p = state.players.find(pl => pl.id === playerId)
  if (!p?.alive) return

  if (input.type === 'move' && input.direction) {
    if (now - p.lastMoveAt < 1000 / p.speed) return
    const dx = { left: -1, right: 1, up: 0, down: 0 }[input.direction]
    const dy = { left: 0, right: 0, up: -1, down: 1 }[input.direction]
    p.direction = input.direction
    const nx = p.x + dx, ny = p.y + dy
    if (canMove(state, nx, ny)) {
      p.x = nx; p.y = ny; p.lastMoveAt = now
      pickItem(state, p, nx, ny)
    }
  }

  if (input.type === 'bomb' && p.activeBombs < p.maxBombs &&
      !state.bombs.some(b => b.x === p.x && b.y === p.y)) {
    state.bombs.push({ id: `${playerId}-${now}`, x: p.x, y: p.y,
      ownerId: playerId, damage: p.damage, range: p.bombRange, explodeAt: now + BOMB_MS })
    p.activeBombs++
  }
}

export function tick(state: GameState, now: number) {
  if (state.phase !== 'playing') return []
  state.timeLeft = Math.max(0, state.timeLeft - 100)
  const events: object[] = []

  // Chain-explode ready bombs (process in order, chain may add more)
  let i = 0
  while (i < state.bombs.length) {
    if (now >= state.bombs[i].explodeAt) {
      events.push(...explode(state, state.bombs[i], now))
    } else i++
  }

  checkWin(state, events)
  state.tick++
  return events
}

function explode(state: GameState, bomb: BombState, now: number) {
  state.bombs = state.bombs.filter(b => b.id !== bomb.id)
  const owner = state.players.find(p => p.id === bomb.ownerId)
  if (owner) owner.activeBombs = Math.max(0, owner.activeBombs - 1)

  const blasted: { x: number; y: number }[] = [{ x: bomb.x, y: bomb.y }]
  for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
    for (let s = 1; s <= bomb.range; s++) {
      const tx = bomb.x + dx * s, ty = bomb.y + dy * s
      if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) break
      const tile = state.tiles[ty][tx]
      if (tile === 1) break
      blasted.push({ x: tx, y: ty })
      if (tile === 2) {
        state.tiles[ty][tx] = 0
        spawnItem(state, tx, ty, now)
        break
      }
      // Chain explode
      const chain = state.bombs.find(b => b.x === tx && b.y === ty)
      if (chain) chain.explodeAt = now
    }
  }

  for (const p of state.players)
    if (p.alive && blasted.some(t => t.x === p.x && t.y === p.y)) {
      p.hp -= bomb.damage
      if (p.hp <= 0) { p.hp = 0; p.alive = false }
    }

  return [{ type: 'explosion', tiles: blasted }]
}

function canMove(state: GameState, x: number, y: number) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS &&
    state.tiles[y][x] === 0 && !state.bombs.some(b => b.x === x && b.y === y)
}

function pickItem(state: GameState, p: PlayerState, x: number, y: number) {
  const idx = state.items.findIndex(it => it.x === x && it.y === y)
  if (idx < 0) return
  const { type } = state.items.splice(idx, 1)[0]
  if (type === 'bombup') p.maxBombs++
  else if (type === 'fireup') p.bombRange = Math.min(p.bombRange + 1, 6)
  else if (type === 'speedup') p.speed = Math.min(p.speed + 0.5, 6)
}

function spawnItem(state: GameState, x: number, y: number, now: number) {
  if (Math.random() > 0.3) return
  const types = ['bombup', 'fireup', 'speedup'] as const
  state.items.push({ id: `item-${now}-${x}-${y}`, x, y, type: types[Math.floor(Math.random() * 3)] })
}

function checkWin(state: GameState, events: object[]) {
  const alive = state.players.filter(p => p.alive)
  if (alive.length > 1 && state.timeLeft > 0) return
  state.phase = 'ended'
  state.winner = alive.length === 1 ? alive[0].userId
    : alive.length === 0 ? 'draw'
    : alive.reduce((a, b) => (a.hp / a.maxHp >= b.hp / b.maxHp ? a : b)).userId
  events.push({ type: 'end', winner: state.winner })
}
