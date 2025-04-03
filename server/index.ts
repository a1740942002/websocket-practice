import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: number
  to?: string // 接收者ID
}

interface User {
  userId: string
  socketId: string
  username: string
}

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Vite 的預設端口
    methods: ['GET', 'POST']
  }
})

// 保存所有用戶連接資訊
const users: User[] = []
// 保存私人訊息歷史 (使用收發者ID組合作為key)
const conversationMap: Record<string, Message[]> = {}

// 查找用戶 socket ID
function getUserSocketId(userId: string) {
  const user = users.find((u) => u.userId === userId)
  return user?.socketId
}

function getConversationId(sender: string, receiver: string) {
  return [sender, receiver].sort().join('-')
}

io.on('connection', (socket) => {
  // 用戶登入/註冊
  socket.on('register', (user: { userId: string; username: string }) => {
    // 註冊/更新用戶
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

    // 返回用戶列表
    socket.emit(
      'users',
      users.map((u) => ({ userId: u.userId, username: u.username }))
    )
    // 廣播新用戶加入
    socket.broadcast.emit(
      'users',
      users.map((u) => ({ userId: u.userId, username: u.username }))
    )
  })

  // 處理私人訊息
  socket.on('conversation', (message: Message) => {
    if (!message.to) return

    // 獲取對話ID (組合發送者和接收者ID)
    const conversationId = getConversationId(message.sender, message.to)

    // 儲存訊息
    if (!conversationMap[conversationId]) {
      conversationMap[conversationId] = []
    }
    conversationMap[conversationId].push(message)

    // 獲取接收者的 socketId
    const recipientSocketId = getUserSocketId(message.to)

    // 1. 發送給發送者 (更新他的聊天記錄)
    socket.emit('conversations', {
      partnerId: message.to,
      messages: conversationMap[conversationId]
    })

    // 2. 發送給接收者 (如果在線)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('conversations', {
        partnerId: message.sender,
        messages: conversationMap[conversationId]
      })
    }
  })

  // 獲取與特定用戶的聊天記錄
  socket.on(
    'get-conversation',
    ({ sender, receiver }: { sender: string; receiver: string }) => {
      const conversationId = getConversationId(sender, receiver)
      socket.emit('conversations', {
        partnerId: receiver,
        messages: conversationMap[conversationId] || []
      })
    }
  )

  // 處理斷線
  socket.on('disconnect', () => {
    const user = users.find((u) => u.socketId === socket.id)
    if (user) {
      users.splice(users.indexOf(user), 1)
      // 通知其他用戶
      socket.broadcast.emit(
        'users',
        users.map((u) => ({ userId: u.userId, username: u.username }))
      )
    }
  })
})

server.listen(3000, () => {
  console.log('server running at http://localhost:3000')
})
