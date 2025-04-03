import type { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  UserListPayload
} from '../../types' // Adjust path as needed
import { users } from '../store' // Import state

export const handleUserRegistration = (
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) => {
  socket.on('register', (user) => {
    console.log(
      `Register attempt from user: ${user.userId}, socket: ${socket.id}`
    )
    const existingUser = users.find((u) => u.userId === user.userId)
    if (existingUser) {
      console.log(`Updating socket ID for existing user: ${user.userId}`)
      existingUser.socketId = socket.id
    } else {
      console.log(`Registering new user: ${user.userId}`)
      users.push({
        userId: user.userId,
        socketId: socket.id,
        username: user.username
      })
      // Optional: Store userId on socket data for easier lookup later
      // socket.data.userId = user.userId;
    }

    const userListPayload: UserListPayload = users.map((u) => ({
      userId: u.userId,
      username: u.username
    }))
    console.log('Emitting updated user list to all clients')
    // Emit to the registering user *and* broadcast to others
    socket.emit('users', userListPayload) // Send to the new user
    socket.broadcast.emit('users', userListPayload) // Send to everyone else
  })
}

export const handleDisconnect = (
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
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`)
    const userIndex = users.findIndex((u) => u.socketId === socket.id)
    if (userIndex !== -1) {
      const disconnectedUser = users[userIndex]
      console.log(`Removing user: ${disconnectedUser?.userId}`)
      users.splice(userIndex, 1)
      const userListPayload: UserListPayload = users.map((u) => ({
        userId: u.userId,
        username: u.username
      }))
      // Broadcast the updated list to remaining users
      socket.broadcast.emit('users', userListPayload)
      console.log('Broadcasting updated user list after disconnect')
    } else {
      console.log(
        `Socket ${socket.id} disconnected but was not found in users array.`
      )
    }
  })
}
