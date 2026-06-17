import { io, Socket } from 'socket.io-client'
import { reactive } from 'vue'

let socket: Socket | null = null

export const gameState = reactive({
  tiles: [] as number[][],
  players: [] as any[],
  bombs: [] as any[],
  items: [] as any[],
  timeLeft: 0,
  phase: 'waiting' as string,
  events: [] as any[],
})

export function connect(url: string) {
  if (socket?.connected) return
  socket = io(url)
  socket.on('game:start', ({ tiles }) => { gameState.tiles = tiles })
  socket.on('game:state', (s) => {
    gameState.players = s.players
    gameState.bombs   = s.bombs
    gameState.items   = s.items
    gameState.timeLeft = s.timeLeft
  })
  socket.on('game:event', (ev) => gameState.events.push(ev))
  socket.on('stage:clear', (ev) => gameState.events.push({ type: 'stageClear', ...ev }))
  socket.on('room:created', ({ roomId }) => gameState.events.push({ type: 'roomCreated', roomId }))
  socket.on('room:state', (s) => gameState.events.push({ type: 'roomState', ...s }))
  socket.on('error', (msg) => gameState.events.push({ type: 'error', msg }))
}

export function emit(event: string, data?: any) { socket?.emit(event, data) }
export function getSocketId() { return socket?.id }
export function disconnect() { socket?.disconnect(); socket = null }
