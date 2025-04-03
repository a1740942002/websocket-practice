import type { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ConversationPayload,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '../../types' // Adjust path as needed
import { conversationMap, users } from '../store' // Import state
import { getConversationId, getUserSocketId } from '../utils' // Import utils

export const handleConversationMessage = (
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) => {
  socket.on('conversation', (message) => {
    // Consider adding validation: does message.sender match the authenticated user (e.g., socket.data.userId)?
    console.log(
      `Received message from ${message.sender} to ${message.to} via socket ${socket.id}`
    )
    if (!message.to) {
      console.warn(
        'Received conversation message with no recipient (`to` field missing).'
      )
      return
    }

    const conversationId = getConversationId(message.sender, message.to)

    if (!conversationMap[conversationId]) {
      conversationMap[conversationId] = []
    }
    conversationMap[conversationId].push(message)
    console.log(`Stored message in conversation: ${conversationId}`)

    const recipientSocketId = getUserSocketId(users, message.to)

    // 1. Send full conversation back to the sender
    const conversationPayloadSender: ConversationPayload = {
      partnerId: message.to, // Sender's partner is the recipient
      messages: conversationMap[conversationId]
    }
    socket.emit('conversations', conversationPayloadSender)
    console.log(
      `Emitted conversation ${conversationId} back to sender ${message.sender} (socket ${socket.id})`
    )

    // 2. Send full conversation to the recipient if they are online
    if (recipientSocketId) {
      const conversationPayloadRecipient: ConversationPayload = {
        partnerId: message.sender, // Recipient's partner is the sender
        messages: conversationMap[conversationId]
      }
      io.to(recipientSocketId).emit(
        'conversations',
        conversationPayloadRecipient
      )
      console.log(
        `Emitted conversation ${conversationId} to recipient ${message.to} (socket ${recipientSocketId})`
      )
    } else {
      console.log(`Recipient ${message.to} is not currently online.`)
      // Optionally: Implement offline message handling/notifications here
    }
  })
}

export const handleGetConversation = (
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) => {
  socket.on('get-conversation', ({ sender, receiver }) => {
    // Consider adding validation: does sender match the authenticated user?
    console.log(
      `Request for conversation between ${sender} and ${receiver} from socket ${socket.id}`
    )
    const conversationId = getConversationId(sender, receiver)
    const conversationPayload: ConversationPayload = {
      partnerId: receiver,
      messages: conversationMap[conversationId] || []
    }
    socket.emit('conversations', conversationPayload)
    console.log(
      `Sent conversation history for ${conversationId} to socket ${socket.id}`
    )
  })
}
