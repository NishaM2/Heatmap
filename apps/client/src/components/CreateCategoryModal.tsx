import { useState } from 'react'
import { AlertCircle, Star } from 'lucide-react'
import { useCreateCategory } from '@/hooks/useCategories'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const DEFAULT_CATEGORY_COLOR = '#22c55e'

interface CreateCategoryModalProps {
  open: boolean
  onClose: () => void
}

const CreateCategoryModal = ({ open, onClose }: CreateCategoryModalProps) => {
  const [name, setName] = useState('')
  const [isCore, setIsCore] = useState(false)
  const [error, setError] = useState('')
  const createCategory = useCreateCategory()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give your habit a name')
      return
    }
    try {
      await createCategory.mutateAsync({
        name: trimmed,
        color: DEFAULT_CATEGORY_COLOR,
        isCore,
      })
      setName('')
      setIsCore(false)
      setError('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create this habit')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-neutral-200 bg-white p-6 font-sans text-neutral-900 sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-Hero text-[22px] font-normal leading-none tracking-tight">
            New habit
          </DialogTitle>
          <p className="text-xs text-neutral-500">
            You can track up to five habits at a time.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="category-name" className="block text-xs font-medium">
              Name
            </label>
            <input
              id="category-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Coding, Reading, Workout…"
              maxLength={30}
              autoFocus
              required
              className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCore((v) => !v)}
            aria-pressed={isCore}
            className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
              isCore
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <span
              className={`mt-px grid size-5 shrink-0 place-items-center rounded ${
                isCore ? 'bg-neutral-900 text-white' : 'border border-neutral-300 text-transparent'
              }`}
            >
              <Star className={`size-3 ${isCore ? 'fill-white' : ''}`} />
            </span>
            <span>
              <span className="block text-sm font-medium">Core habit</span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                Counts toward the combined grid on your dashboard.
              </span>
            </span>
          </button>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-600"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-neutral-200 px-4 text-sm font-medium transition-colors hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCategory.isPending}
              className="h-9 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
              {createCategory.isPending ? 'Creating…' : 'Create habit'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCategoryModal
