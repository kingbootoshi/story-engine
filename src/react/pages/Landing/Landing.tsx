import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MagicalButton } from '../../components/ui'
import { CosmicBackground } from './CosmicBackground'
import { FeatureCard } from './FeatureCard'
import { Sparkles, Zap, Users } from 'lucide-react'

export function Landing() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Dynamic Narratives',
      description: 'Worlds that evolve with player actions, creating unique stories every time'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Story Arcs',
      description: '15-beat structures that transform civilizations through epic journeys'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Collective Impact',
      description: 'Every action shapes the narrative, building emergent storylines'
    }
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CosmicBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className="gradient-magical text-gradient">Craft Living Worlds.</span>
            <br />
            <span className="gradient-nebula text-gradient">Shape Epic Narratives.</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Create dynamic story worlds that evolve with every player action. 
            Your choices ripple through civilizations, shaping destinies across time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <MagicalButton 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4"
            >
              Begin Your Journey
            </MagicalButton>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full p-1">
            <motion.div
              className="w-1 h-2 bg-muted-foreground/50 rounded-full mx-auto"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-4">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="gradient-aurora text-gradient">Unleash the Power</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Shape Worlds?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join storytellers crafting immersive narratives that respond to every choice.
          </p>
          <MagicalButton 
            size="lg" 
            onClick={() => navigate('/auth')}
            variant="secondary"
          >
            Start Creating Now
          </MagicalButton>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 World Story Engine. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </a>
            <a href="https://github.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}