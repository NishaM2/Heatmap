import { useCallback, useState } from 'react'
import ConfirmDialog, { type ConfirmOptions } from '@/components/ConfirmDialog'

export const useConfirm = () => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<{ resolve: (v: boolean) => void } | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => setResolver({ resolve }))
  }, [])

  const settle = useCallback(
    (answer: boolean) => {
      resolver?.resolve(answer)
      setResolver(null)
      setOptions(null)
    },
    [resolver]
  )

  const dialog = (
    <ConfirmDialog
      open={!!resolver}
      options={options}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  )

  return { confirm, dialog }
}
