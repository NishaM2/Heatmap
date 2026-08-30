import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { githubApi, type ApiError } from '@/services/api'

type SyncResult = { message: string; syncedDays?: number }

export const useGithubSync = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: githubApi.sync,
    onSuccess: (result: SyncResult) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })

      const days = result?.syncedDays
      toast.success(
        days === undefined
          ? 'GitHub sync finished'
          : days === 0
            ? 'Nothing new to sync'
            : `Synced ${days} ${days === 1 ? 'day' : 'days'} from GitHub`
      )
    },
    // Every one of these is something the user can fix, so say which one it is
    // and put the fix one click away instead of failing silently.
    onError: (err: ApiError) => {
      const settings = {
        label: 'Open settings',
        onClick: () => navigate('/settings'),
      }

      switch (err.code) {
        case 'github_not_connected':
          toast.error('GitHub is not connected yet', {
            description:
              'Connect your GitHub account in Settings, then sync to pull your commits in.',
            action: settings,
          })
          return
        case 'no_coding_category':
          toast.error('No “coding” habit to sync into', {
            description:
              'Your commits land in a habit named “coding”. Add one in Settings and sync again.',
            action: settings,
          })
          return
        case 'github_token_unavailable':
          toast.error('GitHub needs reconnecting', {
            description:
              'Your authorisation expired. Disconnect GitHub in Settings and connect it again.',
            action: settings,
          })
          return
        default:
          toast.error(err.message || 'Could not sync with GitHub')
      }
    },
  })
}
