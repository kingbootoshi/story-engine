import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Star, Circle, CheckCircle } from 'lucide-react'

interface BeatNodeProps {
  index: number
  name?: string
  type: 'anchor' | 'dynamic' | 'future'
  status: 'completed' | 'current' | 'future'
  isSelected?: boolean
  onClick?: () => void
}

export function BeatNode({
  index,
  name,
  type,
  status,
  isSelected = false,
  onClick
}: BeatNodeProps) {
  const isAnchor = type === 'anchor'
  
  const getIcon = () => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4" />
    if (isAnchor) return <Star className="w-4 h-4" />
    return <Circle className="w-3 h-3" />
  }

  const getNodeStyles = () => {
    const base = 'relative flex items-center justify-center cursor-pointer transition-all duration-300 group'
    const size = isAnchor ? 'w-10 h-10' : 'w-8 h-8'
    
    const variants = {
      completed: isAnchor 
        ? 'bg-green-500 text-white border-2 border-green-500' 
        : 'bg-blue-500 text-white border-2 border-blue-500',
      current: 'bg-blue-500/20 text-blue-500 border-2 border-blue-500 animate-pulse',
      future: 'bg-gray-800 text-gray-500 border-2 border-gray-600'
    }

    return cn(base, size, 'rounded-full', variants[status])
  }

  return (
    <div className="relative flex items-center">
      <motion.div
        className={getNodeStyles()}
        onClick={onClick}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.95 }}
      >
        {getIcon()}
        
        {/* Hover tooltip */}
        {name && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-gray-700">
              <div className="font-semibold">{name}</div>
              <div className="text-gray-400">Beat {index}</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        )}
        
        {/* Beat number for nodes without names */}
        {!name && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
            {index}
          </div>
        )}
        
        {/* Selected ring */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  )
}