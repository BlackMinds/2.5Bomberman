import { createServer } from 'http'
import { Server } from 'socket.io'
import { createRoom, joinRoom, setReady, handleInput, leaveRoom } from './RoomManager'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

io.on('connection', (socket) => {
  socket.on('room:create', (data) => createRoom(io, socket, data.opts, data.player))
  socket.on('room:join',   (data) => joinRoom(io, socket, data.roomId, data.player))
  socket.on('room:ready',  ()     => setReady(io, socket))
  socket.on('game:input',  (data) => handleInput(socket, data))
  socket.on('room:leave',  ()     => leaveRoom(io, socket))
  socket.on('disconnect',  ()     => leaveRoom(io, socket))
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`Socket server running on :${PORT}`))
