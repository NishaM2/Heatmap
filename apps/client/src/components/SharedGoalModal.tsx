import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Category } from '@/types'
import { sharedGoalApi } from '@/services/api'

interface SharedGoalModalProps {
  open: boolean
  onClose: () => void
  receiverId: string
  receiverName: string
}

const SharedGoalModal = ({ open, onClose, receiverId, receiverName }: SharedGoalModalProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [error, setError] = useState('')
  const { data: categoriesData = [] } = useCategories()
  const categories = categoriesData as Category[]
  const queryClient = useQueryClient()

  const createGoal = useMutation({
    mutationFn: (data: { initiatorCategoryId: string; receiverId: string }) =>
      sharedGoalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-goals'] })
      setSelectedCategoryId('')
      setError('')
      onClose()
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Could not send the invite')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-neutral-200 bg-white p-6 font-sans text-neutral-900 sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-Hero text-[22px] font-normal leading-none tracking-tight">
            Track together
          </DialogTitle>
          <p className="text-xs text-neutral-500">
            Pick the habit you want to share with{' '}
            <span className="font-medium text-neutral-900">{receiverName}</span>. They'll choose
            one of their own, and you'll see both grids side by side.
          </p>
        </DialogHeader>

        <div className="mt-4">
          {categories.length === 0 ? (
            <p className="flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-600">
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              Create a habit first — there is nothing to share yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((cat) => {
                const on = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategoryId(cat.id); setError('') }}
                    aria-pressed={on}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      on ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{cat.name}</span>
                    {on && <Check className="size-4 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-600"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-neutral-200 px-4 text-sm font-medium transition-colors hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              createGoal.mutate({ initiatorCategoryId: selectedCategoryId, receiverId })
            }
            disabled={!selectedCategoryId || createGoal.isPending}
            className="h-9 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {createGoal.isPending ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SharedGoalModal
