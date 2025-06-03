import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover blur-[2px]"
      >
        <source src="/worldtree.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <motion.div 
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="space-y-6">
          <motion.h1 
            className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-[0.2em] drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            STORY ENGINE
          </motion.h1>

          <motion.div
            className="font-cinzel text-2xl md:text-3xl text-white/90 tracking-[0.3em] font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            BEGIN YOUR STORY
          </motion.div>
        </div>

        <motion.button
          className="font-cinzel text-xl px-12 py-6 border border-white/50 text-white 
                     backdrop-blur-sm bg-white/5 rounded-sm tracking-[0.2em]
                     hover:bg-white/20 hover:border-white hover:scale-105
                     transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]
                     hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          onClick={() => navigate('/auth')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          ENTER
        </motion.button>
      </motion.div>
    </div>
  )
}