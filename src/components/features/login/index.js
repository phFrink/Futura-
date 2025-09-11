'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createClientComponentClient()
  const router = useRouter();


  useEffect(() => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        router.push('/dashboard');
      }
  },[router])


  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error,data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-br from-gray-900 to-gray-800 p-4 relative">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="text-white font-semibold text-lg">Futura Homes</span>
        </div>
      </div>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
          <div className="absolute top-32 right-20 w-12 h-12 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 border border-white/20 rounded-full"></div>
          <div className="absolute top-20 right-40 w-8 h-8 bg-white/10 rounded-full"></div>
        </div>

        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="text-white font-semibold text-lg">Futura Homes</span>
        </div>

        {/* Main Content */}
        <div className="flex flex-col justify-center h-full px-6 xl:px-12 max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="w-64 h-64 xl:w-80 xl:h-80 relative mb-8 mx-auto lg:mx-0">
              <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-300 rounded-2xl relative overflow-hidden">
                {/* Placeholder for woman image */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-800/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="w-16 h-16 bg-amber-400 rounded-full mb-4 flex items-center justify-center">
                    <span className="text-2xl">👩‍💼</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* <blockquote className="text-white text-center lg:text-left">
              <p className="text-xl xl:text-2xl font-light leading-relaxed mb-6">
                Simply all the tools that my team and I need.
              </p>
              <footer className="text-white/80">
                <div className="font-medium">Alisha Fox</div>
                <div className="text-sm">Director of Digital Marketing Technology</div>
              </footer>
            </blockquote> */}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-80px)] lg:min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Welcome to Futura Homes
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Please enter your correct email address to verify</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none  transition-all text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none  transition-all text-sm sm:text-base"
                placeholder="••••••••••"
                required
              />
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center order-2 sm:order-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative w-9 h-5 sm:w-11 sm:h-6 rounded-full transition-colors ${
                    rememberMe ? 'bg-purple-600' : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform ${
                      rememberMe ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                  <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-700">Remember sign-in details</span>
                </label>
              </div>
              
              <button
                type="button"
                className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium text-left sm:text-right order-1 sm:order-2"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Signing in...' : 'Log in'}
            </button>

     

            <div className="text-center pt-2">
              <span className="text-xs sm:text-sm text-gray-600">
                Don't have an account? {' '}
                <button
                    onClick={() => router.push('/signup')}
                  type="button"
                  className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}