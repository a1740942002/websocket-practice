import { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '../types'
import { httpServer } from './config'
import {
  handleUserRegistration,
  handleDisconnect
} from './handlers/user-handler'
import {
  handleConversationMessage,
  handleGetConversation
} from './handlers/conversation-handler'

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

io.on(
  'connection',
  (
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >
  ) => {
    console.log(`--------------------------------`)
    console.log(`User connected: ${socket.id}`)
    console.log(`--------------------------------`)

    handleUserRegistration(socket)
    handleConversationMessage(io, socket)
    handleGetConversation(socket)
    handleDisconnect(io, socket)
  }
)

httpServer.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
  console.log('Event handlers registered.')
})
