import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export interface GlowingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  showCount?: boolean
}

const GlowingInput = forwardRef<HTMLInputElement, GlowingInputProps>(
  ({ className, label, error, helperText, showCount = false, maxLength, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const [value, setValue] = useState(props.value || props.defaultValue || '')
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      props.onChange?.(e)
    }

    return (
      <div className="relative">
        {label && (
          <motion.label
            className={cn(
              'absolute left-3 transition-all duration-200 pointer-events-none',
              'text-muted-foreground',
              focused || value
                ? '-top-2 text-xs bg-background px-1'
                : 'top-3 text-base'
            )}
            animate={{
              color: focused ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))'
            }}
          >
            {label}
          </motion.label>
        )}
        
        <motion.div
          className="relative"
          animate={{
            filter: focused ? 'drop-shadow(var(--shadow-glow))' : 'none'
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            ref={ref}
            className={cn(
              'w-full px-3 py-3 bg-background',
              'border rounded-lg transition-all duration-200',
              'focus:outline-none focus:border-primary',
              'placeholder-muted-foreground',
              error ? 'border-destructive' : 'border-input',
              label && 'pt-5',
              className
            )}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
          
          {showCount && maxLength && (
            <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
              {value.toString().length}/{maxLength}
            </div>
          )}
        </motion.div>
        
        {(error || helperText) && (
          <p className={cn(
            'mt-1 text-sm',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

GlowingInput.displayName = 'GlowingInput'

export { GlowingInput }