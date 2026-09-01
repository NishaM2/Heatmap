import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logApi, type ApiError } from '@/services/api'

// Reads a sentence into a draft log. It writes nothing the caller shows the
// result for confirmation and then saves it through useUpsertLog.
export const useParseLog = () =>
  useMutation({
    mutationFn: (text: string) => logApi.parse(text),
    onError: (err: ApiError) => {
      // The server explains what to do about it, so show that rather than a
      // generic failure.
      toast.error(err.message || 'Could not read that')
    },
  })

type Log = {
  date: string
  effortLevel: number
  note?: string
}

type UpsertLogInput = {
  categoryId: string
  date: string
  effortLevel: number
  note?: string
}

type ContextType = {
  previousLogs: Log[] | undefined
  queryKey: (string | number)[]
}

export const useYearLogs = (categoryId: string, year: string) => {
  return useQuery({
    queryKey: ['logs', categoryId, year],
    queryFn: () => logApi.getYear(categoryId, year),
    enabled: !!categoryId,
  })
}

export const useOverallLogs = (year: string) => {
  return useQuery({
    queryKey: ['logs', 'overall', year],
    queryFn: () => logApi.getOverall(year),
  })
}

export const useDayLog = (categoryId: string, date: string) => {
  return useQuery({
    queryKey: ['logs', categoryId, date],
    queryFn: () => logApi.getDay(categoryId, date),
    enabled: !!categoryId && !!date,
  })
}

export const useUpsertLog = () => {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, UpsertLogInput, ContextType>({
    mutationFn: logApi.upsert,

    onMutate: async (newLog) => {
      const year = newLog.date.substring(0, 4)
      const queryKey = ['logs', newLog.categoryId, year]

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousLogs = queryClient.getQueryData<Log[]>(queryKey)

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: Log[] | undefined) => {
        if (!old) return old
        const exists = old.find(l => l.date === newLog.date)
        if (exists) {
          return old.map(l => l.date === newLog.date
            ? { ...l, effortLevel: newLog.effortLevel, note: newLog.note }
            : l
          )
        }
        return [...old, { date: newLog.date, effortLevel: newLog.effortLevel }]
      })

      return { previousLogs, queryKey }
    },

    onError: (_err, _newLog, context) => {
      if (!context) return
      queryClient.setQueryData(context.queryKey, context.previousLogs)
    },

    onSettled: (_data, _err, variables) => {
      const year = variables.date.substring(0, 4)
      // Invalidate on the category prefix, not the year. The day-detail query is
      // keyed ['logs', categoryId, '2025-03-08'], which a ['logs', categoryId, '2025']
      // key does not prefix-match — so the modal used to reopen with the stale note.
      queryClient.invalidateQueries({ queryKey: ['logs', variables.categoryId] })
      queryClient.invalidateQueries({ queryKey: ['logs', 'overall', year] })
    },
  })
}

export const useDeleteLog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => logApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })
}