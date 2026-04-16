import { useState } from 'react'
import { useCreateCategory } from '@/hooks/useCategories'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#f97316', '#ef4444',
  '#a855f7', '#ec4899', '#14b8a6', '#eab308',
]

interface CreateCategoryModalProps {
  open: boolean
  onClose: () => void
}

const CreateCategoryModal = ({ open, onClose }: CreateCategoryModalProps) => {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#22c55e')
  const [isCore, setIsCore] = useState(false)
  const [error, setError] = useState('')
  const createCategory = useCreateCategory()

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    try {
      await createCategory.mutateAsync({ name, color, isCore })
      setName('')
      setColor('#22c55e')
      setIsCore(false)
      setError('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Coding, Fitness, Reading..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110
                    ${color === c ? 'border-foreground scale-110' : 'border-transparent'}
                  `}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCore"
              checked={isCore}
              onChange={(e) => setIsCore(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isCore" className="cursor-pointer">
              Core category (counts toward overall heatmap)
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={createCategory.isPending}>
            {createCategory.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCategoryModal