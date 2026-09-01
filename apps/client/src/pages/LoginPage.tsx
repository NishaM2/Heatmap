import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { authClient } from '@/lib/authClient'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import PageBackdrop from '@/components/PageBackdrop'
import SocialAuthButtons from '@/components/SocialAuthButtons'
import { oauthCallbackURL, useAuthProviders, type SocialProvider } from '@/lib/authProviders'

const inputClass =
  'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const providers = useAuthProviders()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = async (provider: SocialProvider) => {
    setError(null)
    const { error: socialError } = await authClient.signIn.social({
      provider,
      callbackURL: oauthCallbackURL('/dashboard'),
    })
    if (socialError) {
      setError(socialError.message ?? `Could not sign in with ${provider}`)
    }
  }

  return (
    <div className="relative min-h-screen bg-white p-3 font-sans text-neutral-900 antialiased">
      <PageBackdrop />

      <div className="relative z-10 flex min-h-[calc(100vh-1.5rem)] flex-col items-center justify-center px-5 py-12">

      <Link to="/" className="mb-6 inline-flex items-center gap-2">
        <span className="grid size-7 place-items-center overflow-hidden rounded-md bg-black">
          <img src="/Logo.png" alt="" className="size-5 object-contain" />
        </span>
        <span className="font-heading text-sm font-semibold tracking-tight">Loop In</span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5 space-y-1">
          <h1 className="font-heading text-base font-semibold tracking-tight">Welcome back</h1>
          <p className="text-xs text-neutral-500">
            Sign in to pick up where your streak left off.
          </p>
        </div>

        <SocialAuthButtons providers={providers} onSelect={handleSocial} disabled={loading} />

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-neutral-200" />
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">or</span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              required
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium">Password</label>
            <div className="relative">
              <input
                id="password"
                type={revealed ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                required
                disabled={loading}
                className={`${inputClass} pr-9`}
              />
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-900"
              >
                {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-600"
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-9 w-full rounded-md bg-neutral-900 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-500">
          New here?{' '}
          <Link
            to="/register"
            className="font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
          >
            Create an account
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}

export default LoginPage
