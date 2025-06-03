import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Calendar, Activity, Sparkles } from 'lucide-react'
import { MagicalButton } from './MagicalButton'

interface WorldCardProps {
  id: string
  name: string
  description: string
  createdAt: string
  currentBeat?: number
  activeEvents?: number
  arcProgress?: number
  isActive?: boolean
  onClick?: () => void
  onEnter?: () => void
}

export function WorldCard({
  id,
  name,
  description,
  createdAt,
  currentBeat = 0,
  activeEvents = 0,
  arcProgress = 0,
  isActive = false,
  onClick,
  onEnter
}: WorldCardProps) {
  return (
    <motion.div
      className={cn(
        'relative group cursor-pointer',
        'bg-card border border-border rounded-xl p-6',
        'transition-all duration-300',
        isActive && 'border-primary bg-card/50'
      )}
      onClick={onClick}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <motion.div
          className="absolute -inset-10 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgb(var(--primary) / 0.1) 0%, transparent 50%)`,
            backgroundSize: '200% 200%',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-1">{name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          {isActive && (
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">Active</span>
            </div>
          )}
        </div>

        <p className="text-muted-foreground mb-6 line-clamp-2">{description}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{currentBeat}</div>
            <div className="text-xs text-muted-foreground">Current Beat</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{activeEvents}</div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{arcProgress}%</div>
            <div className="text-xs text-muted-foreground">Arc Progress</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-aurora"
              initial={{ width: 0 }}
              animate={{ width: `${arcProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Action button */}
        <MagicalButton
          variant={isActive ? 'secondary' : 'primary'}
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onEnter?.()
          }}
        >
          {isActive ? 'Current World' : 'Enter World'}
        </MagicalButton>
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: 'inset 0 0 20px rgba(var(--primary) / 0.1)',
        }}
      />
    </motion.div>
  )
}