import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'


export type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

const ConfirmDialog = ({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean
  options: ConfirmOptions | null
  onCancel: () => void
  onConfirm: () => void
}) => (
  <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
    <DialogContent
      showCloseButton={false}
      className="border-neutral-200 bg-white p-6 font-sans text-neutral-900 sm:max-w-sm"
    >
      <DialogHeader className="space-y-2">
        {options?.destructive && (
          <span className="grid size-9 place-items-center rounded-md bg-red-50 text-red-600">
            <AlertTriangle className="size-4.5" />
          </span>
        )}
        <DialogTitle className="font-Hero text-[20px] font-normal leading-tight tracking-tight">
          {options?.title}
        </DialogTitle>
        {options?.description && (
          <p className="text-xs leading-relaxed text-neutral-500">{options.description}</p>
        )}
      </DialogHeader>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-md border border-neutral-200 px-4 text-sm font-medium transition-colors hover:bg-neutral-100"
        >
          {options?.cancelLabel ?? 'Cancel'}
        </button>
        <button
          type="button"
          autoFocus
          onClick={onConfirm}
          className={`h-9 rounded-md px-4 text-sm font-medium text-white transition-colors ${
            options?.destructive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-neutral-900 hover:bg-neutral-800'
          }`}
        >
          {options?.confirmLabel ?? 'Confirm'}
        </button>
      </div>
    </DialogContent>
  </Dialog>
)

export default ConfirmDialog
