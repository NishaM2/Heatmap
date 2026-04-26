import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { sharedGoalApi } from '@/services/api'

interface SharedGoalModalProps {
  open: boolean
  onClose: () => void
  receiverId: string
  receiverName: string
}

const SharedGoalModal = ({
  open,
  onClose,
  receiverId,
  receiverName
}: SharedGoalModalProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const { data: categories = [] } = useCategories()
  const queryClient = useQueryClient()

  const createGoal = useMutation({
    mutationFn: (data: { initiatorCategoryId: string; receiverId: string }) =>
      sharedGoalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-goals'] })
      onClose()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track Together with {receiverName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Choose a category to share with {receiverName}.
            They will be able to see your progress and share theirs.
          </p>

          <Select
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: Category) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
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
            onClick={() => createGoal.mutate({
              initiatorCategoryId: selectedCategoryId,
              receiverId
            })}
            disabled={!selectedCategoryId || createGoal.isPending}
          >
            {createGoal.isPending ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SharedGoalModal