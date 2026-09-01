import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, GitBranch, GitCompare, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useGithubSync } from '@/hooks/useGithub'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const AppNavbar = ({
  active,
  showSync = false,
}: {
  active: 'dashboard' | 'friends' | 'comparison' | 'settings'
  showSync?: boolean
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const githubSync = useGithubSync()

  const links = [
    { label: 'Dashboard', to: '/dashboard', key: 'dashboard' as const },
    { label: 'Friends', to: '/friends', key: 'friends' as const },
    { label: 'Comparison', to: '/comparison', key: 'comparison' as const },
    { label: 'Settings', to: '/settings', key: 'settings' as const },
  ]

  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="grid size-7 place-items-center overflow-hidden rounded-md bg-black">
          <img src="/Logo.png" alt="" className="size-5 object-contain" />
        </span>
        <span className="font-Hero text-[19px] tracking-tight">Loop In</span>
      </Link>

      <nav className="hidden items-center gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm lg:flex">
        {links.map((l) => (
          <Link
            key={l.key}
            to={l.to}
            aria-current={active === l.key ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              active === l.key
                ? 'bg-neutral-900 font-medium text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        {showSync && (
          <button
            type="button"
            onClick={() => githubSync.mutate()}
            disabled={githubSync.isPending}
            aria-label={githubSync.isPending ? 'Syncing GitHub' : 'Sync GitHub'}
            title="Sync GitHub"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-60"
          >
            <GitBranch className="size-3.5" />
            <span className="hidden lg:inline">
              {githubSync.isPending ? 'Syncing…' : 'Sync GitHub'}
            </span>
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <Avatar className="size-8">
              <AvatarImage src={user?.image || ''} alt={user?.name} />
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="size-3.5 text-neutral-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard"><LayoutDashboard className="mr-2 size-4" />Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/friends"><Users className="mr-2 size-4" />Friends</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/comparison"><GitCompare className="mr-2 size-4" />Comparison</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings className="mr-2 size-4" />Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => { await logout(); navigate('/login') }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default AppNavbar
