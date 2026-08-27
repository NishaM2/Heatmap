import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { authClient } from '@/lib/authClient'
import { Eye, EyeOff } from 'lucide-react'
import AuthShell, {
  FormError,
  OrDivider,
  SocialRow,
  SubmitButton,
  fieldClass,
  labelClass,
} from '@/components/AuthShell'
import { oauthCallbackURL, useAuthProviders, type SocialProvider } from '@/lib/authProviders'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const providers = useAuthProviders()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = async (provider: SocialProvider) => {
    setError('')
    const { error: socialError } = await authClient.signIn.social({
      provider,
      callbackURL: oauthCallbackURL('/dashboard'),
    })
    if (socialError) {
      setError(socialError.message || `Could not sign in with ${provider}`)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Please enter your details to sign in."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-[#111318] underline underline-offset-2 hover:text-[#2b7ff5]">
            Sign up
          </Link>
        </>
      }
    >
      <SocialRow providers={providers} onSelect={handleSocial} disabled={loading} />

      <OrDivider />

      <form onSubmit={handleSubmit} noValidate={false}>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className={fieldClass}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="password" className={labelClass}>Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className={`${fieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#a3a9b3] transition hover:text-[#111318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b7ff5]"
            >
              {showPassword ? <EyeOff className="h-4.25 w-4.25" /> : <Eye className="h-4.25 w-4.25" />}
            </button>
          </div>
          <p className="mt-2 text-[12.5px] text-[#8a9099]">Must be at least 8 characters</p>
        </div>

        <FormError message={error} />

        <SubmitButton loading={loading} loadingLabel="Signing in...">
          Sign in
        </SubmitButton>
      </form>
    </AuthShell>
  )
}

export default LoginPage
