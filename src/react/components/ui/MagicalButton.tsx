import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import type { MotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export interface MagicalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  glow?: boolean
}

type CombinedProps = MagicalButtonProps & MotionProps

const MagicalButton = forwardRef<
  HTMLButtonElement,
  CombinedProps
>(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  glow = true,
  children,
  disabled,
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white border-transparent',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600',
    tertiary: 'bg-green-500 hover:bg-green-600 text-white border-green-500',
    ghost: 'bg-transparent hover:bg-white/10 text-white border-transparent'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-lg',
        'border transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variants[variant],
        sizes[size],
        glow && !disabled && 'glow hover:glow-lg',
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
      
      {/* Magical shimmer effect */}
      {variant === 'primary' && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-lg overflow-hidden"
          initial={{ backgroundPosition: '-200% 0' }}
          animate={{ backgroundPosition: '200% 0' }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'linear'
          }}
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </motion.button>
  )
})

MagicalButton.displayName = 'MagicalButton'

export { MagicalButton }