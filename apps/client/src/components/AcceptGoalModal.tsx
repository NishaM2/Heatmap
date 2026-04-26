import { useState } from 'react'
import { useCategories } from '@/hooks/useCategories'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category } from '@/types'

interface AcceptGoalModalProps {
  open: boolean
  onClose: () => void
  onAccept: (categoryId: string) => void
  isPending: boolean
}

const AcceptGoalModal = ({ open, onClose, onAccept, isPending }: AcceptGoalModalProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const { data: categories = [] } = useCategories()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Accept Shared Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Choose which of your categories to track for this shared goal.
          </p>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: Category) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onAccept(selectedCategoryId)}
            disabled={!selectedCategoryId || isPending}
          >
            {isPending ? 'Accepting...' : 'Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AcceptGoalModal