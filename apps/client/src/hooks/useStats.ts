import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/services/api'

export const useCategoryStats = (categoryId: string, year: string) => {
  return useQuery({
    queryKey: ['stats', categoryId, year],
    queryFn: () => statsApi.getCategory(categoryId, year),
    enabled: !!categoryId,
  })
}