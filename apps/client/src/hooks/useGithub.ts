import { useMutation, useQueryClient } from '@tanstack/react-query'
import { githubApi } from '@/services/api'

export const useGithubSync = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: githubApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })
}