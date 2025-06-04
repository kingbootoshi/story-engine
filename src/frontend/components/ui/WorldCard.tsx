import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Calendar } from 'lucide-react'
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
        'bg-gray-800/50 border border-gray-700 rounded-2xl p-6',
        'transition-all duration-300 hover:bg-gray-800/80 hover:border-gray-600',
        'min-h-[320px] flex flex-col',
        isActive && 'border-blue-500/50 bg-gray-800/70'
      )}
      onClick={onClick}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Subtle hover effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content with improved spacing */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-grow">
          {description}
        </p>

        {/* Compact stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{currentBeat}</div>
            <div className="text-xs text-gray-400">Beat</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{activeEvents}</div>
            <div className="text-xs text-gray-400">Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{arcProgress}%</div>
            <div className="text-xs text-gray-400">Progress</div>
          </div>
        </div>

        {/* Simple progress bar */}
        <div className="mb-6">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${arcProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Action button */}
        <MagicalButton
          variant="primary"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onEnter?.()
          }}
        >
          Enter World
        </MagicalButton>
      </div>

    </motion.div>
  )
}