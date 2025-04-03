import type { UserInfo } from '../types'

export function getUserSocketId(
  users: UserInfo[],
  userId: string
): string | undefined {
  const user = users.find((u) => u.userId === userId)
  return user?.socketId
}

export function getConversationId(sender: string, receiver: string): string {
  return [sender, receiver].sort().join('-')
}
