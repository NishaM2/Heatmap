import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/config'

export const SOCIAL_PROVIDERS = ['github', 'google'] as const
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]

const isSocialProvider = (v: string): v is SocialProvider =>
  (SOCIAL_PROVIDERS as readonly string[]).includes(v)


export const useAuthProviders = (): SocialProvider[] | null => {
  const [providers, setProviders] = useState<SocialProvider[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`${API_URL}/api/auth-providers`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { providers: [] }))
      .then((d) => {
        if (!alive) return
        const list: string[] = Array.isArray(d?.providers) ? d.providers : []
        setProviders(list.filter(isSocialProvider))
      })
      .catch(() => {
        if (alive) setProviders([])
      })
    return () => {
      alive = false
    }
  }, [])

  return providers
}

export const oauthCallbackURL = (path = '/dashboard') => `${window.location.origin}${path}`
