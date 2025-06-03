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
        className="absolute inset-0 w-full h-full object-cover blur-sm"
      >
        <source src="/worldtree.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <motion.div 
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h1 
          className="font-cinzel text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-wider"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          FORGE YOUR DESTINY
        </motion.h1>

        <motion.button
          className="font-cinzel text-lg px-8 py-4 border-2 border-white text-white 
                     hover:bg-white/10 transition-colors tracking-widest"
          onClick={() => navigate('/auth')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          BEGIN YOUR STORY
        </motion.button>
      </motion.div>
    </div>
  )
}