import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MagicalButton, WorldCard, Modal, GlowingInput } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { Plus, Loader2, Sparkles, LogOut } from 'lucide-react'
import { api, type World } from '../../lib/api'
import { getCurrentBeat } from '../../lib/beatHelpers'
import { createLogger } from '../../../shared/utils/loggerBrowser'

interface EnhancedWorld extends World {
  currentBeat?: number
  activeEvents?: number
  arcProgress?: number
}

// Dashboard specific logger ---------------------------------------------------
const log = createLogger('Dashboard')

export function Dashboard() {
  const navigate = useNavigate()
  const { signOut, user } = useAuthStore()
  const [worlds, setWorlds] = useState<EnhancedWorld[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWorldName, setNewWorldName] = useState('')
  const [newWorldDescription, setNewWorldDescription] = useState('')
  const [isCreatingWorld, setIsCreatingWorld] = useState(false)

  useEffect(() => {
    loadWorlds()
  }, [])

  const loadWorlds = async () => {
    try {
      setIsLoading(true)
      const fetchedWorlds = await api.getUserWorlds()
      
      // Enhance worlds with additional data
      const enhancedWorlds = await Promise.all(
        fetchedWorlds.map(async (world) => {
          try {
            const state = await api.getWorldState(world.id)
            // Derive metrics using helper to respect contiguous rules -------
            const currentBeatObj = getCurrentBeat(state.currentBeats)
            const currentBeatIdx = currentBeatObj ? currentBeatObj.beat_index : -1
            const activeEvents = state.recentEvents.length
            const arcProgress = state.currentArc 
              ? Math.round((currentBeatIdx / 14) * 100)
              : 0
            log.debug('World card metrics', {
              worldId: world.id,
              currentBeatIndex: currentBeatIdx,
              arcProgress,
            })
            
            return {
              ...world,
              currentBeat: currentBeatIdx,
              activeEvents,
              arcProgress
            }
          } catch (err) {
            // If we can't get state, just return basic world data
            return world
          }
        })
      )
      
      setWorlds(enhancedWorlds)
    } catch (error) {
      setError('Failed to load worlds')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorld = async () => {
    if (!newWorldName || !newWorldDescription) return
    
    try {
      setIsCreatingWorld(true)
      const newWorld = await api.createWorld(newWorldName, newWorldDescription)
      setIsCreateModalOpen(false)
      setNewWorldName('')
      setNewWorldDescription('')
      navigate(`/world/${newWorld.id}`)
    } catch (err) {
      setError('Failed to create world')
    } finally {
      setIsCreatingWorld(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 20% 80%, rgb(var(--primary)) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgb(var(--secondary)) 0%, transparent 50%),
                          radial-gradient(circle at 40% 40%, rgb(var(--color-aurora)) 0%, transparent 50%)`
      }} />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-2xl font-bold text-white">
                Story Engine
              </h1>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-sm text-gray-400">
                {user?.email}
              </div>
              <MagicalButton 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4" />
              </MagicalButton>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">
              Your Worlds
            </h2>
            <p className="text-gray-400">
              Create and manage your narrative universes
            </p>
          </div>

          {/* Worlds Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative mb-6">
                  <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 rounded-full mx-auto animate-pulse" />
                </div>
                <p className="text-lg text-gray-400">Initializing worlds...</p>
                <p className="text-sm text-gray-500 mt-2">Preparing your narrative universe</p>
              </motion.div>
            </div>
          ) : error ? (
            <motion.div 
              className="text-center py-32"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-3xl p-12 max-w-lg mx-auto backdrop-blur-sm">
                <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-destructive mb-4">Connection Lost</h3>
                <p className="text-destructive/80 mb-8 leading-relaxed">{error}</p>
                <MagicalButton onClick={loadWorlds} variant="secondary" size="lg">
                  Reconnect to Worlds
                </MagicalButton>
              </div>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* World Cards */}
              {worlds.map((world, index) => (
                <motion.div
                  key={world.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <WorldCard
                    {...world}
                    createdAt={world.created_at}
                    onClick={() => navigate(`/world/${world.id}`)}
                    onEnter={() => navigate(`/world/${world.id}`)}
                  />
                </motion.div>
              ))}

              {/* Create New World Card */}
              <motion.div
                className="group cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * worlds.length }}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <div className="h-full min-h-[320px] bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-800/80">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <Plus className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Create New World
                  </h3>
                  <p className="text-sm text-gray-400 text-center">
                    Start a new narrative journey
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Enhanced Create World Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Create New World"
        description="Give your world a name and description to begin crafting its story"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateWorld(); }} className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GlowingInput
              label="World Name"
              value={newWorldName}
              onChange={(e) => setNewWorldName(e.target.value)}
              maxLength={100}
              showCount
              required
              className="text-lg py-4"
              placeholder="Enter a captivating name for your world..."
            />
          </motion.div>
          
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <label className="text-base font-semibold text-foreground">World Description</label>
            <textarea
              value={newWorldDescription}
              onChange={(e) => setNewWorldDescription(e.target.value)}
              className="w-full px-6 py-5 bg-background/50 border border-input rounded-2xl resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-base leading-relaxed backdrop-blur-sm"
              rows={6}
              maxLength={500}
              placeholder="Describe your world's setting, themes, atmosphere, and the stories waiting to unfold within it..."
              required
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Be descriptive - this will shape your world's narrative</span>
              <span className="text-muted-foreground font-medium">
                {newWorldDescription.length}/500
              </span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex gap-4 justify-end pt-6 border-t border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <MagicalButton
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-8 py-3"
              size="lg"
            >
              Cancel
            </MagicalButton>
            <MagicalButton
              type="submit"
              isLoading={isCreatingWorld}
              disabled={isCreatingWorld || !newWorldName || !newWorldDescription}
              className="px-8 py-3"
              size="lg"
            >
              {isCreatingWorld ? 'Creating World...' : 'Create World'}
            </MagicalButton>
          </motion.div>
        </form>
      </Modal>
    </div>
  )
}