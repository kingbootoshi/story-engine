import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MagicalButton, WorldCard, Modal, GlowingInput } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { Plus, Loader2 } from 'lucide-react'
import { api, type World } from '../../lib/api'

interface EnhancedWorld extends World {
  currentBeat?: number
  activeEvents?: number
  arcProgress?: number
}

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
            const currentBeat = state.currentBeats.length - 1
            const activeEvents = state.recentEvents.length
            const arcProgress = state.currentArc 
              ? Math.round((currentBeat / 14) * 100)
              : 0
              
            return {
              ...world,
              currentBeat,
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-magical text-gradient">
            World Story Engine
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <MagicalButton variant="ghost" size="sm" onClick={() => signOut()}>
              Sign Out
            </MagicalButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Your Worlds Await</h2>
            <p className="text-muted-foreground">
              Select a world to continue shaping its narrative
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">{error}</p>
              <MagicalButton onClick={loadWorlds} variant="secondary">
                Try Again
              </MagicalButton>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worlds.map((world) => (
                <WorldCard
                  key={world.id}
                  {...world}
                  createdAt={world.created_at}
                  onClick={() => navigate(`/world/${world.id}`)}
                  onEnter={() => navigate(`/world/${world.id}`)}
                />
              ))}

              {/* Create New World Card */}
              <motion.div
                className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                <span className="text-lg font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Create New World
                </span>
              </motion.div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Create World Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Create New World"
        description="Give your world a name and description to begin crafting its story"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateWorld(); }} className="space-y-4">
          <GlowingInput
            label="World Name"
            value={newWorldName}
            onChange={(e) => setNewWorldName(e.target.value)}
            maxLength={100}
            showCount
            required
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">World Description</label>
            <textarea
              value={newWorldDescription}
              onChange={(e) => setNewWorldDescription(e.target.value)}
              className="w-full px-3 py-3 bg-background border border-input rounded-lg resize-none focus:outline-none focus:border-primary transition-colors"
              rows={4}
              maxLength={500}
              placeholder="Describe your world's setting, themes, and initial state..."
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {newWorldDescription.length}/500
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <MagicalButton
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </MagicalButton>
            <MagicalButton
              type="submit"
              isLoading={isCreatingWorld}
              disabled={isCreatingWorld || !newWorldName || !newWorldDescription}
            >
              Create World
            </MagicalButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}