import { useState } from 'react'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useParseLog, useUpsertLog } from '@/hooks/useLogs'
import type { ParsedLog } from '@/services/api'

const EFFORT = [
  { level: 1, label: 'Light', color: '#cbd5e1' },
  { level: 2, label: 'Moderate', color: '#94a3b8' },
  { level: 3, label: 'Hard', color: '#475569' },
  { level: 4, label: 'Intense', color: '#0f172a' },
] as const

const todayISO = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const QuickLog = () => {
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<ParsedLog | null>(null)

  const parseLog = useParseLog()
  const upsertLog = useUpsertLog()

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (trimmed.length < 3) return
    parseLog.mutate(trimmed, { onSuccess: setDraft })
  }

  const save = async () => {
    if (!draft) return
    try {
      await upsertLog.mutateAsync({
        categoryId: draft.categoryId,
        date: todayISO(),
        effortLevel: draft.effortLevel,
        note: draft.note,
      })
      toast.success(`Logged ${draft.categoryName} for today`)
      setDraft(null)
      setText('')
    } catch {
      toast.error('Could not save that log')
    }
  }

  const discard = () => setDraft(null)

  const effort = draft ? EFFORT.find((e) => e.level === draft.effortLevel) : undefined

  return (
    <section className="mt-5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      {!draft ? (
        <form onSubmit={submit}>
          <label
            htmlFor="quick-log"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-neutral-500"
          >
            <Sparkles className="size-3" />
            Quick log
          </label>

          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            <input
              id="quick-log"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={parseLog.isPending}
              maxLength={300}
              placeholder="ran 5k this morning, absolutely brutal"
              className="h-10 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-50 disabled:text-neutral-400"
            />
            <button
              type="submit"
              disabled={parseLog.isPending || text.trim().length < 3}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
            >
              {parseLog.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Reading…
                </>
              ) : (
                'Log it'
              )}
            </button>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            Describe the day in your own words — you can check it before it saves.
          </p>
        </form>
      ) : (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">
            Save this for today?
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2 text-[15px] font-medium">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: draft.categoryColor }}
              />
              {draft.categoryName}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700">
              <span
                className="size-2.5 rounded-xs"
                style={{ backgroundColor: effort?.color }}
              />
              {effort?.label}
            </span>
          </div>

          {draft.note && (
            <p className="mt-2.5 text-sm text-neutral-600">“{draft.note}”</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={upsertLog.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
              <Check className="size-3.5" />
              {upsertLog.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={discard}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <X className="size-3.5" />
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default QuickLog
