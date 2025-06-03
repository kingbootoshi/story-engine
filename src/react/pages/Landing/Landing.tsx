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
        className="absolute inset-0 w-full h-full object-cover blur-[1px]"
      >
        <source src="/worldtree.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <motion.div 
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 space-y-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h1 
          className="font-cinzel text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-[0.2em] drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          STORY ENGINE
        </motion.h1>

        <motion.button
          className="font-cinzel text-3xl md:text-4xl px-16 py-8 border-2 border-white/50 text-white 
                     backdrop-blur-sm bg-white/5 rounded tracking-[0.3em]
                     hover:bg-white/20 hover:border-white hover:scale-110
                     transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.3)]
                     hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]"
          onClick={() => navigate('/auth')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          whileHover={{ 
            y: -5,
            transition: { duration: 0.3 }
          }}
          whileTap={{ scale: 0.95 }}
        >
          ENTER
        </motion.button>
      </motion.div>
    </div>
  )
}