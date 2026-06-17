export type Direction = 'up' | 'down' | 'left' | 'right'
export type TileType  = 0 | 1 | 2   // floor | hard-wall | soft-wall

export interface PlayerState {
  id: string; userId: string; username: string
  x: number; y: number
  hp: number; maxHp: number; alive: boolean
  damage: number; speed: number
  bombRange: number; maxBombs: number; activeBombs: number
  direction: Direction; lastMoveAt: number
}

export interface BombState {
  id: string; x: number; y: number
  ownerId: string; damage: number; range: number; explodeAt: number
}

export interface ItemState {
  id: string; x: number; y: number
  type: 'bombup' | 'fireup' | 'speedup'
}

export interface GameState {
  tick: number
  phase: 'waiting' | 'playing' | 'ended'
  players: PlayerState[]
  bombs: BombState[]
  items: ItemState[]
  tiles: TileType[][]
  timeLeft: number
  winner?: string
}

export interface RoomMeta {
  id: string
  mode: 'pvp' | 'pve'
  stageId?: number
  maxPlayers: number
  ready: Set<string>
  state: GameState
  loop?: ReturnType<typeof setInterval>
  aiLoop?: ReturnType<typeof setInterval>
  startedAt?: number
}
