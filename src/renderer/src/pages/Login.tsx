import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Mail } from 'lucide-react'
import WolfLogo from '../components/icons/WolfLogo'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)
  const { signIn, signUp, signInWithProvider, oauthLoading, error, clearError } = useAuthStore()

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
          <Mail className="w-12 h-12 text-gold mx-auto mb-4" />
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
          <WolfLogo size={48} className="text-gold mx-auto mb-3" />
          <h1 className="text-2xl font-bold gold-gradient mb-1">Wolf Tool</h1>
          <p className="text-gray-400 text-sm">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => signInWithProvider('google')}
            disabled={oauthLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {oauthLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <button
            onClick={() => signInWithProvider('github')}
            disabled={oauthLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292f] hover:bg-[#32383f] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            {oauthLoading ? 'Connecting...' : 'Continue with GitHub'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-navy-600"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-navy-800 px-3 text-gray-500">or continue with email</span>
          </div>
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
