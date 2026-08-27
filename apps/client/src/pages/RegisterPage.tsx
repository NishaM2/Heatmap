import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/services/api'
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

const MIN_PASSWORD = 8

const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { refetch } = useAuth()
  const navigate = useNavigate()
  const providers = useAuthProviders()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Checked here so the mismatch never reaches the API as a generic failure.
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`)
      return
    }

    setLoading(true)
    try {
      await authApi.signUp({ name, email, password })
      await refetch()
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create your account')
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
      setError(socialError.message || `Could not sign up with ${provider}`)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building better habits today."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#111318] underline underline-offset-2 hover:text-[#2b7ff5]">
            Sign in
          </Link>
        </>
      }
    >
      <SocialRow providers={providers} onSelect={handleSocial} disabled={loading} />

      <OrDivider />

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className={fieldClass}
          />
        </div>

        <div className="mt-4">
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
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD}
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

        <div className="mt-4">
          <label htmlFor="confirmPassword" className={labelClass}>Confirm password</label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className={fieldClass}
          />
        </div>

        <FormError message={error} />

        <SubmitButton loading={loading} loadingLabel="Creating account...">
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  )
}

export default RegisterPage
