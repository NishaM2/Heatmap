import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useUpsertLog, useDayLog, useDeleteLog } from '@/hooks/useLogs'
import { useCategories } from '@/hooks/useCategories'
import { formatDateLabel, checkIsFuture } from '@/lib/dateUtils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Category } from '@/types'
import { useConfirm } from '@/hooks/useConfirm'

const EFFORT_LEVELS = [
  { level: 1, label: 'Light', color: '#cbd5e1' },
  { level: 2, label: 'Moderate', color: '#94a3b8' },
  { level: 3, label: 'Hard', color: '#475569' },
  { level: 4, label: 'Intense', color: '#0f172a' },
]

const MAX_NOTE = 140

const DayModal = () => {
  const { isDayModalOpen, selectedDate, selectedCategoryId, closeDayModal } = useUIStore()
  const { data: existingLog } = useDayLog(selectedCategoryId || '', selectedDate || '')
  const { data: categories = [] } = useCategories()
  const upsertLog = useUpsertLog()
  const deleteLog = useDeleteLog()
  const [effortLevel, setEffortLevel] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { confirm, dialog } = useConfirm()

  useEffect(() => {
    if (existingLog) {
      setEffortLevel(existingLog.effortLevel || null)
      setNote(existingLog.note || '')
      setIsEditing(false)
    } else {
      setEffortLevel(null)
      setNote('')
      setIsEditing(true)
    }
  }, [existingLog, selectedDate])

  const category = categories.find((c: Category) => c.id === selectedCategoryId)

  const handleSave = async () => {
    if (!effortLevel || !selectedDate || !selectedCategoryId) return
    setLoading(true)
    try {
      await upsertLog.mutateAsync({
        date: selectedDate,
        effortLevel,
        note,
        categoryId: selectedCategoryId,
      })
      closeDayModal()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedDate) return null

  const isFutureDate = checkIsFuture(selectedDate)
  const viewing = existingLog && !isEditing

  return (
    <Dialog open={isDayModalOpen} onOpenChange={closeDayModal}>
      <DialogContent className="border-neutral-200 bg-white p-6 font-sans text-neutral-900 sm:max-w-md">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="font-Hero text-[20px] font-normal leading-tight tracking-tight">
            {formatDateLabel(selectedDate)}
          </DialogTitle>
          {category && (
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-neutral-500">{category.name}</span>
            </div>
          )}
        </DialogHeader>

        {isFutureDate ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            You can't log a day that hasn't happened yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium">Effort level</p>
              <div className="grid grid-cols-4 gap-2">
                {EFFORT_LEVELS.map(({ level, label, color }) => {
                  const on = effortLevel === level
                  const interactive = !viewing
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={!interactive}
                      onClick={interactive ? () => setEffortLevel(level) : undefined}
                      aria-pressed={on}
                      className={`rounded-md border p-2 text-center transition-colors ${
                        on
                          ? 'border-neutral-900 bg-neutral-50'
                          : interactive
                            ? 'border-neutral-200 hover:bg-neutral-50'
                            : 'border-neutral-200 opacity-40'
                      }`}
                    >
                      <span
                        className="mb-1.5 block h-5 w-full rounded"
                        style={{ backgroundColor: color }}
                      />
                      <span className="block text-[11px] font-medium">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {viewing ? (
              <div>
                <p className="mb-1.5 text-xs font-medium">Note</p>
                {note ? (
                  <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                    {note}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400">No note added.</p>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="day-note" className="text-xs font-medium">Note</label>
                  <span className="text-[11px] tabular-nums text-neutral-400">
                    {note.length}/{MAX_NOTE}
                  </span>
                </div>
                <textarea
                  id="day-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
                  placeholder="What did you work on?"
                  rows={3}
                  className="w-full resize-none rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {existingLog && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Delete this log?',
                      description: 'This day will go back to being empty on your grid.',
                      confirmLabel: 'Delete',
                      destructive: true,
                    })
                    if (!ok) return
                    await deleteLog.mutateAsync(existingLog.id)
                    closeDayModal()
                  }}
                  disabled={deleteLog.isPending}
                  aria-label="Delete this log"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={closeDayModal}
                  className="h-9 rounded-md border border-neutral-200 px-4 text-sm font-medium transition-colors hover:bg-neutral-100"
                >
                  Close
                </button>

                {viewing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="h-9 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!effortLevel || loading}
                    className="h-9 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      {dialog}
    </Dialog>
  )
}

export default DayModal
