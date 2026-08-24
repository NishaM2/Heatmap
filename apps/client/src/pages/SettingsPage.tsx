import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { useCategories, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GitBranch, Trash2, Pencil, Check, X } from 'lucide-react'
import type { Category } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logApi } from '@/services/api'
import { githubApi } from '@/services/api'
import { authClient } from '@/lib/authClient'

const SettingsPage = () => {
  const { user } = useAuth()
  const { data: categories = [] } = useCategories()
  const deleteCategory = useDeleteCategory()
  const updateCategory = useUpdateCategory()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const queryClient = useQueryClient()

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = (cat: Category) => {
    updateCategory.mutate({ 
      id: cat.id,
      data: { name: editName}
     })
    cancelEdit()
  }

  const deleteAllLogs = useMutation({
    mutationFn: () => logApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })

  const { data: githubStatus } = useQuery({
    queryKey: ['github', 'status'],
    queryFn: githubApi.status,
  })

  const disconnectGithub = useMutation({
    mutationFn: githubApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github', 'status'] })
    },
  })

  const handleGitHub = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    })
  }

  const isGithubConnected = githubStatus?.connected === true

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Profile */}
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user?.image || ''} />
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* GitHub Connection */}
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold mb-4">GitHub Connection</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <p className="text-xs text-muted-foreground">
                  {isGithubConnected
                    ? `Connected — account ${githubStatus?.accountId}`
                    : 'Not connected — connect to sync commits'}
                </p>
              </div>
            </div>
            {isGithubConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-medium">
                  Connected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm('Disconnect GitHub? You can reconnect anytime.')) {
                      disconnectGithub.mutate()
                    }
                  }}
                  disabled={disconnectGithub.isPending}
                >
                  {disconnectGithub.isPending ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGitHub}
                className="w-full"
              >
                Continue with GitHub
              </button>
            )}
          </div>
        </section>

        {/* Category Manager */}
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold mb-4">Categories</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat: Category) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    {editingId === cat.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 w-40 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium">{cat.name}</span>
                    )}
                    {cat.isCore && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Core
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {editingId === cat.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => saveEdit(cat)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={cancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEdit(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteCategory.mutate(cat.id)}
                      disabled={deleteCategory.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="rounded-lg border border-destructive/40 bg-card p-6">
          <h2 className="text-base font-semibold text-destructive mb-1">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These actions are irreversible. Please be careful.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Delete all your logs? This cannot be undone.')) {
                deleteAllLogs.mutate()
              }
            }}
            disabled={deleteAllLogs.isPending}
          >
            {deleteAllLogs.isPending ? 'Deleting...' : 'Delete all logs'}
          </Button>
        </section>
      </main>
    </div>
  )
}

export default SettingsPage