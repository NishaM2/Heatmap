import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logApi } from '@/services/api'

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
  return useMutation({
    mutationFn: logApi.upsert,
    onSuccess: (_, variables) => {
      const year = variables.date.substring(0, 4)
      queryClient.invalidateQueries({ queryKey: ['logs', variables.categoryId, year] })
      queryClient.invalidateQueries({ queryKey: ['logs', 'overall', year] })
    },
  })
}