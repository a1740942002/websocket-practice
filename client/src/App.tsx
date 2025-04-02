import { useEffect, useState } from 'react'
import { useSocket } from './hook/useSocket'
import type React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Send, User } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  content: string
  sender: string // 使用用戶ID
  timestamp: number
  to?: string
}

interface UserInfo {
  userId: string
  username: string
}

export default function App() {
  const socket = useSocket()
  const [userId] = useState(() => uuidv4())
  const [username, setUsername] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    {}
  )
  const [inputValue, setInputValue] = useState('')

  // 註冊用戶
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    socket.current?.emit('register', { userId, username })
    setIsRegistered(true)
  }

  useEffect(() => {
    if (!socket.current) return

    // 監聽用戶列表更新
    socket.current.on('users', (userList: UserInfo[]) => {
      // 過濾掉自己
      setUsers(userList.filter((user) => user.userId !== userId))
    })

    // 監聽私人訊息
    socket.current.on(
      'conversactions',
      (data: { partnerId: string; messages: Message[] }) => {
        setConversations((prev) => ({
          ...prev,
          [data.partnerId]: data.messages
        }))
      }
    )

    return () => {
      socket.current?.off('users')
      socket.current?.off('conversactions')
    }
  }, [socket, userId])

  // 選擇聊天對象
  const selectChatPartner = (user: UserInfo) => {
    setSelectedUser(user)
    // 請求對話歷史
    socket.current?.emit('get-conversation', { userId, partnerId: user.userId })
  }

  // 發送訊息
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !selectedUser) return

    const message: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: userId,
      timestamp: Date.now(),
      to: selectedUser.userId
    }

    socket.current?.emit('conversaction', message)
    setInputValue('')
  }

  // 未註冊時顯示註冊表單
  if (!isRegistered) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold mb-4">註冊聊天</h2>
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block mb-2 text-sm">用戶名稱</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="輸入用戶名稱"
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              開始聊天
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  // 已註冊顯示聊天界面
  return (
    <div className="flex h-screen bg-gray-50 p-4">
      {/* 用戶列表 */}
      <Card className="w-64 mr-4 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-100">
          <h2 className="font-semibold">在線用戶</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">無在線用戶</div>
          ) : (
            <ul>
              {users.map((user) => (
                <li
                  key={user.userId}
                  className={`p-3 cursor-pointer hover:bg-gray-100 flex items-center ${
                    selectedUser?.userId === user.userId ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => selectChatPartner(user)}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <div className="bg-blue-500 text-white flex items-center justify-center h-full w-full rounded-full">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                  </Avatar>
                  <span>{user.username}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3 border-t">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <div className="bg-green-500 text-white flex items-center justify-center h-full w-full rounded-full">
                {username.substring(0, 2).toUpperCase()}
              </div>
            </Avatar>
            <span className="text-sm font-medium">{username} (你)</span>
          </div>
        </div>
      </Card>

      {/* 聊天區域 */}
      <Card className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <div className="bg-blue-500 text-white flex items-center justify-center h-full w-full rounded-full">
                    {selectedUser.username.substring(0, 2).toUpperCase()}
                  </div>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedUser.username}</h2>
                  <p className="text-xs text-gray-500">在線</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversations[selectedUser.userId]?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender === userId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.content}
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === userId
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`傳送訊息給 ${selectedUser.username}...`}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>選擇一位用戶開始聊天</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
