import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Category } from '@/types'

interface AcceptGoalModalProps {
  open: boolean
  onClose: () => void
  onAccept: (categoryId: string) => void
  isPending: boolean
  partnerName?: string
  partnerCategoryName?: string
}

const AcceptGoalModal = ({
  open,
  onClose,
  onAccept,
  isPending,
  partnerName,
  partnerCategoryName,
}: AcceptGoalModalProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const { data: categoriesData = [] } = useCategories()
  const categories = categoriesData as Category[]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-neutral-200 bg-white p-6 font-sans text-neutral-900 sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-Hero text-[22px] font-normal leading-none tracking-tight">
            Accept shared goal
          </DialogTitle>
          <p className="text-xs text-neutral-500">
            {partnerName ? (
              <>
                <span className="font-medium text-neutral-900">{partnerName}</span>
                {partnerCategoryName ? <> is tracking “{partnerCategoryName}”. </> : ' invited you. '}
                Pick the habit you'll track alongside them.
              </>
            ) : (
              "Pick the habit you'll track alongside them."
            )}
          </p>
        </DialogHeader>

        <div className="mt-4">
          {categories.length === 0 ? (
            <p className="flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-600">
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              You need at least one habit before you can join a shared goal.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((cat) => {
                const on = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
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
            onClick={() => onAccept(selectedCategoryId)}
            disabled={!selectedCategoryId || isPending}
            className="h-9 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPending ? 'Accepting…' : 'Accept goal'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AcceptGoalModal
