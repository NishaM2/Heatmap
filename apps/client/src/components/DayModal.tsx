import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useUpsertLog, useDayLog } from '@/hooks/useLogs'
import { useCategories } from '@/hooks/useCategories'
import { formatDateLabel, checkIsFuture } from '@/lib/dateUtils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Category } from '@/types'

const EFFORT_LEVELS = [
  { level: 1, label: 'Light', color: 'bg-green-200' },
  { level: 2, label: 'Moderate', color: 'bg-green-400' },
  { level: 3, label: 'Hard', color: 'bg-green-600' },
  { level: 4, label: 'Intense', color: 'bg-green-800' },
]

const DayModal = () => {
  const { isDayModalOpen, selectedDate, selectedCategoryId, closeDayModal } = useUIStore()
  const { data: existingLog } = useDayLog(selectedCategoryId || '', selectedDate || '')
  const { data: categories = [] } = useCategories()
  const upsertLog = useUpsertLog()

  const [effortLevel, setEffortLevel] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (existingLog) {
      setEffortLevel(existingLog.effortLevel || null)
      setNote(existingLog.note || '')
    } else {
      setEffortLevel(null)
      setNote('')
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

  return (
    <Dialog open={isDayModalOpen} onOpenChange={closeDayModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {formatDateLabel(selectedDate)}
          </DialogTitle>
          {category && (
            <div className="flex items-center gap-2 mt-1">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-muted-foreground">{category.name}</span>
            </div>
          )}
        </DialogHeader>

        {isFutureDate ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Cannot log future dates
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium mb-2">Effort Level</p>
              <div className="grid grid-cols-4 gap-2">
                {EFFORT_LEVELS.map(({ level, label, color }) => (
                  <button
                    key={level}
                    onClick={() => setEffortLevel(level)}
                    className={`
                      rounded-lg p-3 text-center border-2 transition-all
                      ${effortLevel === level
                        ? 'border-primary scale-105'
                        : 'border-transparent hover:border-muted-foreground/30'
                      }
                    `}
                  >
                    <div className={`h-6 w-full rounded ${color} mb-1`} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                Note
                <span className="text-xs text-muted-foreground ml-2">
                  {note.length}/140
                </span>
              </p>
              <Textarea
                placeholder="What did you work on today?"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 140))}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeDayModal}>
            Cancel
          </Button>
          {!isFutureDate && (
            <Button
              onClick={handleSave}
              disabled={!effortLevel || loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DayModal