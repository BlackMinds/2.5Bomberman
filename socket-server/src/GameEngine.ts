import type { GameState, PlayerState, BombState, ItemState, TileType } from './types'

import type { PlayerInput } from './types'

export const COLS = 13
export const ROWS = 11
const BOMB_MS = 2000
const GAME_MS = 3 * 60 * 1000
const TICK_DT = 0.1
const PLAYER_W = 0.7
const PLAYER_H = 0.9
const GRAVITY = 24
const JUMP_VELOCITY = -8.5
const MAX_FALL_SPEED = 12
const FRICTION = 18

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
    id, userId, username, x: sp.x + 0.5, y: sp.y + 0.5, vx: 0, vy: 0, onGround: false,
    input: { left: false, right: false, jump: false, bomb: false },
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
  input: Partial<PlayerInput> | { type: 'move' | 'bomb'; direction?: 'up'|'down'|'left'|'right' },
  now: number
) {
  const p = state.players.find(pl => pl.id === playerId)
  if (!p?.alive) return

  if ('type' in input) {
    if (input.type === 'move' && input.direction) {
      p.input.left = input.direction === 'left'
      p.input.right = input.direction === 'right'
      p.input.jump = input.direction === 'up'
      p.direction = input.direction
      p.lastMoveAt = now
    }
    if (input.type === 'bomb') p.input.bomb = true
    return
  }

  p.input.left = Boolean(input.left)
  p.input.right = Boolean(input.right)
  p.input.jump = Boolean(input.jump)
  p.input.bomb = Boolean(input.bomb)
}

export function tick(state: GameState, now: number) {
  if (state.phase !== 'playing') return []
  state.timeLeft = Math.max(0, state.timeLeft - 100)
  const events: object[] = []
  for (const p of state.players) tickPlayer(state, p, now)

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

function tickPlayer(state: GameState, p: PlayerState, now: number) {
  if (!p.alive) return

  const dir = Number(p.input.right) - Number(p.input.left)
  const targetVx = dir * Math.max(2.5, p.speed)
  if (dir !== 0) {
    p.vx = targetVx
    p.direction = dir > 0 ? 'right' : 'left'
  } else {
    const drop = FRICTION * TICK_DT
    p.vx = Math.abs(p.vx) <= drop ? 0 : p.vx - Math.sign(p.vx) * drop
  }

  if (p.input.jump && p.onGround) {
    p.vy = JUMP_VELOCITY
    p.onGround = false
  }

  p.vy = Math.min(MAX_FALL_SPEED, p.vy + GRAVITY * TICK_DT)
  moveAxis(state, p, p.vx * TICK_DT, 'x')
  moveAxis(state, p, p.vy * TICK_DT, 'y')

  const tile = tileUnderPlayer(p)
  pickItem(state, p, tile.x, tile.y)

  if (p.input.bomb) {
    placeBomb(state, p, now)
    p.input.bomb = false
  }
}

function moveAxis(state: GameState, p: PlayerState, delta: number, axis: 'x' | 'y') {
  if (delta === 0) return
  if (axis === 'y') p.onGround = false

  const nextX = p.x + (axis === 'x' ? delta : 0)
  const nextY = p.y + (axis === 'y' ? delta : 0)
  if (!collides(state, nextX, nextY)) {
    p.x = clamp(nextX, PLAYER_W / 2, COLS - PLAYER_W / 2)
    p.y = clamp(nextY, PLAYER_H / 2, ROWS - PLAYER_H / 2)
    return
  }

  const step = Math.sign(delta) * 0.02
  let remaining = Math.abs(delta)
  while (remaining > 0.0001) {
    const d = Math.abs(step) > remaining ? Math.sign(delta) * remaining : step
    const nx = p.x + (axis === 'x' ? d : 0)
    const ny = p.y + (axis === 'y' ? d : 0)
    if (collides(state, nx, ny)) break
    p.x = clamp(nx, PLAYER_W / 2, COLS - PLAYER_W / 2)
    p.y = clamp(ny, PLAYER_H / 2, ROWS - PLAYER_H / 2)
    remaining -= Math.abs(d)
  }

  if (axis === 'x') p.vx = 0
  else {
    if (delta > 0) p.onGround = true
    p.vy = 0
  }
}

function collides(state: GameState, x: number, y: number) {
  if (x < PLAYER_W / 2 || x > COLS - PLAYER_W / 2 || y < PLAYER_H / 2 || y > ROWS - PLAYER_H / 2) return true
  const left = Math.floor(x - PLAYER_W / 2)
  const right = Math.floor(x + PLAYER_W / 2)
  const top = Math.floor(y - PLAYER_H / 2)
  const bottom = Math.floor(y + PLAYER_H / 2)
  for (let ty = top; ty <= bottom; ty++)
    for (let tx = left; tx <= right; tx++)
      if (isSolid(state, tx, ty)) return true
  return false
}

function isSolid(state: GameState, x: number, y: number) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true
  return state.tiles[y][x] !== 0
}

function placeBomb(state: GameState, p: PlayerState, now: number) {
  const { x, y } = tileUnderPlayer(p)
  if (p.activeBombs >= p.maxBombs || state.bombs.some(b => b.x === x && b.y === y)) return
  state.bombs.push({ id: `${p.id}-${now}`, x, y, ownerId: p.id, damage: p.damage, range: p.bombRange, explodeAt: now + BOMB_MS })
  p.activeBombs++
}

function tileUnderPlayer(p: PlayerState) {
  return {
    x: clamp(Math.floor(p.x), 0, COLS - 1),
    y: clamp(Math.floor(p.y), 0, ROWS - 1),
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
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

  for (const p of state.players) {
    const tile = tileUnderPlayer(p)
    if (p.alive && blasted.some(t => t.x === tile.x && t.y === tile.y)) {
      p.hp -= bomb.damage
      if (p.hp <= 0) { p.hp = 0; p.alive = false }
    }
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
