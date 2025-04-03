export interface Message {
  id: string
  content: string
  sender: 'user' | 'ai' | string
  timestamp: number
  to?: string
}

export interface UserInfo {
  userId: string
  socketId: string
  username: string
}

export type UserListPayload = Array<{ userId: string; username: string }>

export interface ConversationPayload {
  partnerId: string
  messages: Message[]
}

export interface ServerToClientEvents {
  users: (users: UserListPayload) => void
  conversations: (payload: ConversationPayload) => void
}

export interface ClientToServerEvents {
  register: (user: { userId: string; username: string }) => void
  conversation: (message: Message) => void
  'get-conversation': (payload: { sender: string; receiver: string }) => void
}

export interface InterServerEvents {
  // Example: ping: () => void;
}

export interface SocketData {
  // Example: userId: string;
  // You could potentially store user information here after registration
}
