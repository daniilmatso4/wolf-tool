import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)
  const { signIn, signUp, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()

    if (mode === 'signin') {
      await signIn(email, password)
    } else {
      const result = await signUp(email, password, fullName)
      if (result.confirmEmail) {
        setConfirmEmail(true)
      }
    }
    setLoading(false)
  }

  if (confirmEmail) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-gray-400 text-sm mb-6">
            We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
            Click the link to activate your account, then sign in.
          </p>
          <button
            onClick={() => { setConfirmEmail(false); setMode('signin') }}
            className="btn-gold px-6 py-2"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full border-navy-700">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐺</div>
          <h1 className="text-2xl font-bold gold-gradient mb-1">Wolf Tool</h1>
          <p className="text-gray-400 text-sm">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field w-full"
                placeholder="Jordan Belfort"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              placeholder="wolf@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === 'signin' ? (
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('signup'); clearError() }}
                className="text-gold hover:text-gold-light font-medium"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); clearError() }}
                className="text-gold hover:text-gold-light font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
