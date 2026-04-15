import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { friendApi } from '@/services/api'

export const useFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: friendApi.getAll,
  })
}

export const useFriendRequests = () => {
  return useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: friendApi.getRequests,
  })
}

export const useSearchUsers = (username: string) => {
  return useQuery({
    queryKey: ['users', 'search', username],
    queryFn: () => friendApi.search(username),
    enabled: username.length > 2,
    // only search when username is at least 3 characters
  })
}

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: friendApi.sendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
  })
}

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: friendApi.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] })
    },
  })
}

export const useDeclineFriendRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: friendApi.decline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] })
    },
  })
}

export const useUnfriend = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: friendApi.unfriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
  })
}