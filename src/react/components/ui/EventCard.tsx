import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Zap, Users, Cloud, Cog, AlertTriangle, Flame } from 'lucide-react'

interface EventCardProps {
  id: string
  description: string
  type: 'player_action' | 'environmental' | 'social' | 'system_event'
  impactLevel: 'minor' | 'moderate' | 'major' | 'catastrophic'
  beatId?: string
  createdAt: string
  onClick?: () => void
}

export function EventCard({
  description,
  type,
  impactLevel,
  beatId,
  createdAt,
  onClick
}: EventCardProps) {
  const getTypeIcon = () => {
    const icons = {
      player_action: <Zap className="w-4 h-4" />,
      environmental: <Cloud className="w-4 h-4" />,
      social: <Users className="w-4 h-4" />,
      system_event: <Cog className="w-4 h-4" />
    }
    return icons[type]
  }

  const getImpactColor = () => {
    const colors = {
      minor: 'border-l-blue-500',
      moderate: 'border-l-yellow-500',
      major: 'border-l-red-500',
      catastrophic: 'border-l-red-500 bg-red-500/10'
    }
    return colors[impactLevel]
  }

  const getImpactIcon = () => {
    if (impactLevel === 'catastrophic') return <Flame className="w-4 h-4" />
    if (impactLevel === 'major') return <AlertTriangle className="w-4 h-4" />
    return null
  }

  return (
    <motion.div
      className={cn(
        'relative p-4 rounded-lg cursor-pointer',
        'bg-card border border-border border-l-4',
        'transition-all duration-200 hover:bg-card/80',
        getImpactColor()
      )}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-muted/50">
            {getTypeIcon()}
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {type.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {getImpactIcon()}
          <span className={cn(
            'text-xs font-bold uppercase',
            impactLevel === 'minor' && 'text-mystic',
            impactLevel === 'moderate' && 'text-amber',
            impactLevel === 'major' && 'text-destructive',
            impactLevel === 'catastrophic' && 'text-destructive'
          )}>
            {impactLevel}
          </span>
        </div>
      </div>

      <p className="text-sm text-foreground mb-3 line-clamp-2">{description}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <time>{new Date(createdAt).toLocaleString()}</time>
        {beatId && <span>Beat #{beatId}</span>}
      </div>

      {/* Hover effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `linear-gradient(90deg, transparent, rgba(var(--${
            impactLevel === 'catastrophic' ? 'destructive' : 'primary'
          }) / 0.05))`
        }}
      />
    </motion.div>
  )
}