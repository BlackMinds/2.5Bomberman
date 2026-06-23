import { Server, Socket } from 'socket.io'
import type { RoomMeta, PlayerState, PlayerInput } from './types'
import { createPlayer, createState, processInput, tick } from './GameEngine'
import { createStageState, tickEnemies, isStageCleared } from './StageEngine'

const rooms = new Map<string, RoomMeta>()

function genId() { return Math.random().toString(36).slice(2, 8).toUpperCase() }

export function createRoom(
  io: Server, socket: Socket,
  opts: { mode: 'pvp' | 'pve'; stageId?: number; isPrivate?: boolean },
  playerData: { userId: string; username: string; stats: { damage: number; hp: number; speed: number } }
) {
  const id = genId()
  const max = opts.mode === 'pve' ? 2 : 4
  const state = createState([])
  const room: RoomMeta = { id, mode: opts.mode, stageId: opts.stageId, maxPlayers: max, ready: new Set(), state }
  rooms.set(id, room)
  joinRoom(io, socket, id, playerData)
  socket.emit('room:created', { roomId: id, mode: room.mode, stageId: room.stageId })
}

export function joinRoom(
  io: Server, socket: Socket, roomId: string,
  playerData: { userId: string; username: string; stats: { damage: number; hp: number; speed: number } }
) {
  const room = rooms.get(roomId)
  if (!room || room.state.phase !== 'waiting') {
    socket.emit('error', 'Room not available'); return
  }
  const existing = room.state.players.find(p => p.id === socket.id)
  if (existing) {
    existing.userId = playerData.userId
    existing.username = playerData.username
    existing.damage = playerData.stats.damage
    existing.hp = Math.min(existing.hp, playerData.stats.hp)
    existing.maxHp = playerData.stats.hp
    existing.speed = playerData.stats.speed
    socket.join(roomId)
    ;(socket as any).roomId = roomId
    io.to(roomId).emit('room:state', { players: room.state.players, roomId, mode: room.mode, stageId: room.stageId })
    return
  }
  if (room.state.players.length >= room.maxPlayers) {
    socket.emit('error', 'Room full'); return
  }
  const idx = room.state.players.length
  const p = createPlayer(socket.id, playerData.userId, playerData.username, idx, playerData.stats)
  room.state.players.push(p)
  socket.join(roomId)
  ;(socket as any).roomId = roomId
  io.to(roomId).emit('room:state', { players: room.state.players, roomId, mode: room.mode, stageId: room.stageId })
}

export function setReady(io: Server, socket: Socket) {
  const roomId: string = (socket as any).roomId
  const room = rooms.get(roomId)
  if (!room) return
  room.ready.add(socket.id)
  const minPlayers = room.mode === 'pvp' ? 2 : 1
  if (room.ready.size === room.state.players.length && room.state.players.length >= minPlayers) {
    startGame(io, room)
  }
}

function startGame(io: Server, room: RoomMeta) {
  if (room.mode === 'pve' && room.stageId != null) {
    const stageState = createStageState(room.stageId, room.state.players)
    room.state = stageState as any
  }
  room.state.phase = 'playing'
  room.startedAt = Date.now()
  io.to(room.id).emit('game:start', { tiles: room.state.tiles, roomId: room.id, mode: room.mode, stageId: room.stageId })

  room.loop = setInterval(() => {
    const now = Date.now()
    const events = tick(room.state, now)

    if (room.mode === 'pve') tickEnemies(room.state as any, now)

    io.to(room.id).emit('game:state', {
      players: room.state.players,
      bombs: room.state.bombs,
      items: room.state.items,
      tick: room.state.tick,
      timeLeft: room.state.timeLeft,
      roomId: room.id,
      mode: room.mode,
      stageId: room.stageId,
    })

    for (const ev of events) io.to(room.id).emit('game:event', ev)

    // PVE clear check
    if (room.mode === 'pve' && isStageCleared(room.state as any)) {
      room.state.phase = 'ended'
      io.to(room.id).emit('stage:clear', {
        stageId: room.stageId,
        duration: Math.floor((now - room.startedAt!) / 1000),
        kills: (room.state as any).enemies?.length ?? 0,
        players: room.state.players.filter(p => !(p as any).aiState).map(p => ({ userId: p.userId })),
      })
    }

    if (room.state.phase === 'ended') clearRoom(io, room)
  }, 100)

  if (room.mode === 'pve') {
    room.aiLoop = setInterval(() => {
      if (room.state.phase !== 'playing') return
      tickEnemies(room.state as any, Date.now())
    }, 200)
  }
}

function clearRoom(io: Server, room: RoomMeta) {
  if (room.loop) clearInterval(room.loop)
  if (room.aiLoop) clearInterval(room.aiLoop)
  rooms.delete(room.id)
}

export function handleInput(socket: Socket, input: Partial<PlayerInput> | { type: 'move'|'bomb'; direction?: any }) {
  const room = rooms.get((socket as any).roomId)
  if (!room || room.state.phase !== 'playing') return
  processInput(room.state, socket.id, input, Date.now())
}

export function leaveRoom(io: Server, socket: Socket) {
  const roomId: string = (socket as any).roomId
  const room = rooms.get(roomId)
  if (!room) return
  room.state.players = room.state.players.filter(p => p.id !== socket.id)
  socket.leave(roomId)
  if (room.state.players.filter(p => !(p as any).aiState).length === 0) {
    clearRoom(io, room)
  } else {
    io.to(roomId).emit('room:state', { players: room.state.players, roomId, mode: room.mode, stageId: room.stageId })
  }
}
