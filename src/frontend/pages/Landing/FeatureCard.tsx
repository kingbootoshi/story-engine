import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      className="relative group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>

          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Hover effect */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            boxShadow: 'inset 0 0 30px rgba(var(--primary) / 0.1)',
          }}
        />
      </div>
    </motion.div>
  )
}