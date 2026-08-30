export interface Category {
  id: string
  name: string
  color: string
  isCore: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Friend {
  friendshipId: string
  currentStreak: number
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export interface FriendRequest {
  id: string
  requesterId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  updatedAt: string
  requester: {
    id: string
    name: string
    image: string | null
  }
}

export interface SearchUser {
  id: string
  name: string
  email: string
  image: string | null
}

export interface SharedGoal {
  id: string
  initiatorId: string
  receiverId: string
  initiatorCategoryId: string
  receiverCategoryId: string | null
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  updatedAt: string
  isInitiator: boolean
  partner: { id: string; name: string; image: string | null } | null
  myCategory: { id: string; name: string } | null
  partnerCategory: { id: string; name: string } | null
}