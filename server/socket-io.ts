import { conversationMap } from '.'

import type { ConversationPayload, UserListPayload } from '../types'
import { getUserSocketId } from './utils'

import { io, users } from '.'
import { Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '../types'
import { getConversationId } from './utils'

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
    console.log('a user connected:', socket.id)

    socket.on('register', (user) => {
      const existingUser = users.find((u) => u.userId === user.userId)
      if (existingUser) {
        existingUser.socketId = socket.id
      } else {
        users.push({
          userId: user.userId,
          socketId: socket.id,
          username: user.username
        })
      }

      const userListPayload: UserListPayload = users.map((u) => ({
        userId: u.userId,
        username: u.username
      }))
      socket.emit('users', userListPayload)
      socket.broadcast.emit('users', userListPayload)
    })

    socket.on('conversation', (message) => {
      if (!message.to) return

      const conversationId = getConversationId(message.sender, message.to)

      if (!conversationMap[conversationId]) {
        conversationMap[conversationId] = []
      }
      conversationMap[conversationId].push(message)

      const recipientSocketId = getUserSocketId(users, message.to)

      const conversationPayload: ConversationPayload = {
        partnerId: message.to,
        messages: conversationMap[conversationId]
      }

      socket.emit('conversations', conversationPayload)

      if (recipientSocketId) {
        const conversationPayloadForRecipient: ConversationPayload = {
          partnerId: message.sender,
          messages: conversationMap[conversationId]
        }
        io.to(recipientSocketId).emit(
          'conversations',
          conversationPayloadForRecipient
        )
      }
    })

    socket.on('get-conversation', ({ sender, receiver }) => {
      const conversationId = getConversationId(sender, receiver)
      const conversationPayload: ConversationPayload = {
        partnerId: receiver,
        messages: conversationMap[conversationId] || []
      }
      socket.emit('conversations', conversationPayload)
    })

    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id)
      const userIndex = users.findIndex((u) => u.socketId === socket.id)
      if (userIndex !== -1) {
        users.splice(userIndex, 1)
        const userListPayload: UserListPayload = users.map((u) => ({
          userId: u.userId,
          username: u.username
        }))
        socket.broadcast.emit('users', userListPayload)
      }
    })
  }
)
