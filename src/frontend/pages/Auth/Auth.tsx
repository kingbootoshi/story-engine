import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export function Auth() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setError('Check your email to confirm your account')
      } else {
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover blur-[1px]"
      >
        <source src="/worldtree.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="backdrop-blur-md bg-white/5 rounded-lg border border-white/20 p-8 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
            <motion.h2 
              className="font-cinzel text-4xl text-center mb-8 text-white tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {isSignUp ? 'CREATE YOUR PORTAL' : 'ENTER THE PORTAL'}
            </motion.h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-cinzel text-white/80 text-sm tracking-wider">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white 
                           placeholder:text-white/30 focus:outline-none focus:border-white/50 
                           transition-all duration-300 backdrop-blur-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-cinzel text-white/80 text-sm tracking-wider">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white 
                           placeholder:text-white/30 focus:outline-none focus:border-white/50 
                           transition-all duration-300 backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <motion.p 
                  className={`text-sm text-center ${error.includes('Check') ? 'text-emerald-400' : 'text-red-400'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                className="font-cinzel w-full px-8 py-4 border border-white/50 text-white text-lg
                         backdrop-blur-sm bg-white/5 rounded tracking-[0.2em]
                         hover:bg-white/20 hover:border-white hover:scale-105
                         transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.2)]
                         hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </motion.button>
            </form>

            <motion.button
              type="button"
              className="font-cinzel mt-6 w-full text-sm text-white/60 hover:text-white tracking-wider
                       transition-colors duration-300"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {isSignUp 
                ? 'ALREADY HAVE AN ACCOUNT? SIGN IN' 
                : "DON'T HAVE AN ACCOUNT? SIGN UP"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}