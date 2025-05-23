import { useRef } from 'react'
import { Socket } from 'socket.io-client'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { ClientToServerEvents } from '../../../types'
import { ServerToClientEvents } from '../../../types'

const createSocket = () => {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    'http://localhost:3000'
  )
  return socket
}

export function useSocket() {
  const socket = useRef<ReturnType<typeof createSocket> | null>(null)

  useEffect(() => {
    // 連接到 Express 伺服器
    socket.current = createSocket()

    // 監聽連接事件
    socket.current?.on('connect', () => {
      console.log('Connected to server!')
    })

    // 組件卸載時斷開連接
    return () => {
      socket.current?.disconnect()
      socket.current = null
    }
  }, [])

  return socket
}
