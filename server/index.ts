import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import type {
  ClientToServerEvents,
  InterServerEvents,
  Message,
  ServerToClientEvents,
  SocketData,
  UserInfo
} from '../types'

const app = express()
const httpServer = createServer(app)
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

export const users: UserInfo[] = []
export const conversationMap: Record<string, Message[]> = {}

httpServer.listen(3000, () => {
  console.log('server running at http://localhost:3000')
})
