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
    if (status === 'completed') return <CheckCircle className="w-5 h-5" />
    if (isAnchor) return <Star className="w-5 h-5" />
    return <Circle className="w-4 h-4" />
  }

  const getNodeStyles = () => {
    const base = 'relative flex items-center justify-center cursor-pointer transition-all duration-300'
    const size = isAnchor ? 'w-16 h-16' : 'w-12 h-12'
    
    const variants = {
      completed: isAnchor 
        ? 'bg-aurora text-white border-2 border-aurora' 
        : 'bg-primary text-white border-2 border-primary',
      current: 'bg-primary/20 text-primary border-2 border-primary',
      future: 'bg-muted/20 text-muted-foreground border-2 border-muted/40 border-dashed'
    }

    return cn(base, size, 'rounded-full', variants[status])
  }

  return (
    <div className="relative">
      <motion.div
        className={getNodeStyles()}
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isSelected ? {
          boxShadow: [
            '0 0 0 0 rgba(var(--primary) / 0)',
            '0 0 0 8px rgba(var(--primary) / 0.2)',
            '0 0 0 0 rgba(var(--primary) / 0)'
          ]
        } : {}}
        transition={isSelected ? {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        } : {}}
      >
        {/* Connection line */}
        {index > 0 && (
          <div className={cn(
            'absolute right-full top-1/2 -translate-y-1/2 h-0.5 w-8',
            status === 'future' ? 'bg-muted/40' : 'bg-primary'
          )} />
        )}
        
        {/* Beat number or icon */}
        <div className="font-semibold">
          {status === 'current' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgb(var(--primary)), transparent)',
                opacity: 0.3
              }}
            />
          )}
          {getIcon()}
        </div>
        
        {/* Current beat pulse */}
        {status === 'current' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.div>
      
      {/* Beat label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="text-xs text-muted-foreground">Beat {index}</div>
        {name && (
          <div className="text-xs font-medium text-foreground max-w-24 truncate">
            {name}
          </div>
        )}
      </div>
    </div>
  )
}