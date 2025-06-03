import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MagicalButton, BeatNode, EventCard } from '../../components/ui'
import { ArrowLeft, Plus, Loader2, Play, Check, Sparkles, Zap } from 'lucide-react'
import { api, type World, type WorldArc, type WorldBeat, type WorldEvent } from '../../lib/api'

export function WorldDetail() {
  const { worldId } = useParams<{ worldId: string }>()
  const navigate = useNavigate()
  
  const [world, setWorld] = useState<World | null>(null)
  const [currentArc, setCurrentArc] = useState<WorldArc | null>(null)
  const [allArcs, setAllArcs] = useState<WorldArc[]>([])
  const [beats, setBeats] = useState<WorldBeat[]>([])
  const [events, setEvents] = useState<WorldEvent[]>([])
  const [selectedBeat, setSelectedBeat] = useState<WorldBeat | null>(null)
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Event form state
  const [eventDescription, setEventDescription] = useState('')
  const [eventType, setEventType] = useState('player_action')
  const [impactLevel, setImpactLevel] = useState('moderate')
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false)
  
  // Arc creation state
  const [isCreatingArc, setIsCreatingArc] = useState(false)
  const [newArcIdea, setNewArcIdea] = useState('')
  const [isProgressingArc, setIsProgressingArc] = useState(false)

  useEffect(() => {
    if (worldId) loadWorldData()
  }, [worldId])

  const loadWorldData = async () => {
    if (!worldId) return
    
    try {
      setIsLoading(true)
      const state = await api.getWorldState(worldId)
      setWorld(state.world)
      setCurrentArc(state.currentArc)
      setBeats(state.currentBeats)
      setEvents(state.recentEvents)
      
      // Set selected arc to current arc
      if (state.currentArc) {
        setSelectedArcId(state.currentArc.id)
      }
      
      // Load all arcs
      const arcs = await api.getArcs(worldId)
      setAllArcs(arcs)
      
      // Select the latest beat if available
      if (state.currentBeats.length > 0) {
        setSelectedBeat(state.currentBeats[state.currentBeats.length - 1])
      }
    } catch (err) {
      setError('Failed to load world data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateArc = async () => {
    if (!worldId) return
    
    try {
      setIsCreatingArc(true)
      const result = await api.createArc(worldId, newArcIdea)
      setCurrentArc(result.arc)
      setSelectedArcId(result.arc.id)
      setBeats(result.anchors)
      setAllArcs([...allArcs, result.arc])
      setNewArcIdea('')
      
      // Update world's current_arc_id
      if (world) {
        setWorld({ ...world, current_arc_id: result.arc.id })
      }
      
      if (result.anchors.length > 0) {
        setSelectedBeat(result.anchors[0])
      }
    } catch (err) {
      setError('Failed to create arc')
    } finally {
      setIsCreatingArc(false)
    }
  }

  const handleProgressArc = async () => {
    if (!worldId || !currentArc) return
    
    try {
      setIsProgressingArc(true)
      
      // Get events for current beat
      const currentBeatId = beats.length > 0 
        ? beats[beats.length - 1].id 
        : undefined
      
      const eventsForContext = currentBeatId
        ? events.filter(e => e.beat_id === currentBeatId)
        : events
      
      const recentEventsText = eventsForContext
        .slice(0, 5)
        .map(e => `[${e.impact_level}] ${e.description}`)
        .join('\n')
      
      const result = await api.progressArc(worldId, currentArc.id, recentEventsText)
      
      if (result.completed) {
        currentArc.status = 'completed'
        setCurrentArc({...currentArc})
        const arcIndex = allArcs.findIndex(a => a.id === currentArc.id)
        if (arcIndex !== -1) {
          allArcs[arcIndex] = currentArc
          setAllArcs([...allArcs])
        }
      } else {
        setBeats([...beats, result])
        setSelectedBeat(result)
      }
    } catch (err) {
      setError('Failed to progress arc')
    } finally {
      setIsProgressingArc(false)
    }
  }

  const handleRecordEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!worldId || !eventDescription) return
    
    try {
      setIsSubmittingEvent(true)
      
      const currentBeatId = beats.length > 0 
        ? beats[beats.length - 1].id 
        : undefined
      
      // Always use the world's current arc for events
      const arcIdForEvent = world?.current_arc_id || currentArc?.id
      
      const event = await api.recordEvent(worldId, {
        eventType,
        description: eventDescription,
        impactLevel,
        arcId: arcIdForEvent,
        beatId: currentBeatId
      })
      
      setEvents([event, ...events])
      setEventDescription('')
    } catch (err) {
      setError('Failed to record event')
    } finally {
      setIsSubmittingEvent(false)
    }
  }

  const handleBeatClick = (beat: WorldBeat) => {
    setSelectedBeat(beat)
  }

  const handleArcSwitch = async (arcId: string) => {
    if (!worldId) return
    
    try {
      const arc = allArcs.find(a => a.id === arcId)
      if (!arc) return
      
      setSelectedArcId(arcId)
      setCurrentArc(arc)
      
      // Load beats for the selected arc
      const beats = await api.getArcBeats(worldId, arcId)
      setBeats(beats)
      
      // Select the latest beat if available
      if (beats.length > 0) {
        setSelectedBeat(beats[beats.length - 1])
      } else {
        setSelectedBeat(null)
      }
    } catch (err) {
      setError('Failed to switch arc')
    }
  }

  const getBeatStatus = (index: number): 'completed' | 'current' | 'future' => {
    const beatExists = beats.some(b => b.beat_index === index)
    if (!beatExists) return 'future'
    
    const isLatest = beats.length > 0 && beats[beats.length - 1].beat_index === index
    return isLatest ? 'current' : 'completed'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        </div>
        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative mb-8">
            <Loader2 className="w-20 h-20 animate-spin text-blue-500 mx-auto" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500/20 rounded-full mx-auto animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Loading World Data</h2>
          <p className="text-lg text-gray-400">Accessing the narrative dimensions...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !world) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        </div>
        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-3xl p-16 max-w-lg backdrop-blur-sm">
            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-500 mb-6">World Access Failed</h2>
            <p className="text-red-400 mb-10 leading-relaxed text-lg">{error || 'World not found'}</p>
            <MagicalButton onClick={() => navigate('/dashboard')} variant="secondary" size="lg">
              Return to Dashboard
            </MagicalButton>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MagicalButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4" />
              </MagicalButton>
              <h1 className="text-xl font-bold text-white">{world.name}</h1>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{beats.length} Beats</span>
              <span>•</span>
              <span>{events.length} Events</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* World Description */}
          <section className="pb-6 border-b border-gray-800">
            <p className="text-gray-400">{world.description}</p>
          </section>

          {/* Story Arcs Section */}
          <section>
            <h3 className="text-lg font-bold text-white mb-4">Story Arcs</h3>
            
            {allArcs.length > 0 ? (
              <div className="grid gap-8">
                {allArcs.map((arc, index) => (
                  <motion.div
                    key={arc.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      arc.id === selectedArcId 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                    onClick={() => handleArcSwitch(arc.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-white">
                            {arc.story_name}
                          </h4>
                          {arc.id === world.current_arc_id && (
                            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md font-medium">Active</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-1">
                          {arc.story_idea}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {arc.status === 'completed' && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-xs text-gray-400 capitalize">
                          {arc.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
                <p className="text-sm text-gray-400">No story arcs yet. Create one to begin.</p>
              </div>
            )}
            
            {/* Create Arc Section */}
            {(!currentArc || currentArc.status === 'completed') && (
              <div className="mt-4 p-4 border border-dashed border-gray-700 rounded-xl">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Describe your story concept (optional)"
                    value={newArcIdea}
                    onChange={(e) => setNewArcIdea(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
                  />
                  <MagicalButton
                    onClick={handleCreateArc}
                    isLoading={isCreatingArc}
                    disabled={isCreatingArc}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create Arc
                  </MagicalButton>
                </div>
              </div>
            )}
          </section>

          {/* Story Timeline */}
          {currentArc && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Story Timeline</h3>
                {currentArc.status === 'active' && (
                  <MagicalButton
                    onClick={handleProgressArc}
                    isLoading={isProgressingArc}
                    disabled={isProgressingArc || beats.length >= 15}
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Progress Story
                  </MagicalButton>
                )}
              </div>
              
              <div className="border border-gray-700 rounded-xl p-8 bg-gray-800/50">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-1/2" />
                  
                  {/* Progress line */}
                  {beats.length > 0 && (
                    <div 
                      className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-500"
                      style={{ width: `${(beats.length - 1) / 14 * 100}%` }}
                    />
                  )}
                  
                  {/* Beat nodes */}
                  <div className="relative flex justify-between items-center">
                    {[...Array(15)].map((_, index) => {
                      const beat = beats.find(b => b.beat_index === index)
                      const isAnchor = index === 0 || index === 7 || index === 14
                      
                      return (
                        <BeatNode
                          key={index}
                          index={index}
                          name={beat?.beat_name}
                          type={isAnchor ? 'anchor' : beat ? 'dynamic' : 'future'}
                          status={getBeatStatus(index)}
                          isSelected={selectedBeat?.beat_index === index}
                          onClick={() => beat && handleBeatClick(beat)}
                        />
                      )
                    })}
                  </div>
                  
                  {/* Timeline labels */}
                  <div className="flex justify-between mt-8 text-xs text-gray-500">
                    <span>Beginning</span>
                    <span>Midpoint</span>
                    <span>Climax</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Selected Beat Details */}
          {selectedBeat && (
            <section className="border border-gray-700 rounded-xl p-6 bg-gray-800/50">
              <h3 className="text-lg font-bold text-white mb-2">{selectedBeat.beat_name}</h3>
              <p className="text-sm text-gray-400 mb-6">{selectedBeat.description}</p>
              
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">World Directives</h4>
                  <ul className="space-y-2">
                    {selectedBeat.world_directives.map((directive, i) => (
                      <li key={i} className="text-sm text-gray-400 pl-4 border-l-2 border-blue-500/20">
                        {directive}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Emergent Storylines</h4>
                  <ul className="space-y-2">
                    {selectedBeat.emergent_storylines.map((storyline, i) => (
                      <li key={i} className="text-sm text-gray-400 pl-4 border-l-2 border-green-500/20">
                        {storyline}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* World Events */}
          {currentArc && (
            <section>
              <h3 className="text-lg font-bold text-white mb-4">World Events</h3>
              
              {/* Event Form */}
              <form 
                onSubmit={handleRecordEvent} 
                className="mb-6 p-4 border border-gray-700 rounded-xl bg-gray-800/50"
              >
                <div className="grid lg:grid-cols-12 gap-4 mb-4">
                  <div className="lg:col-span-6">
                    <input
                      type="text"
                      placeholder="Describe what happened..."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="lg:col-span-3">
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
                    >
                      <option value="player_action">Player Action</option>
                      <option value="environmental">Environmental</option>
                      <option value="social">Social</option>
                      <option value="system_event">System Event</option>
                    </select>
                  </div>
                  
                  <div className="lg:col-span-3">
                    <select
                      value={impactLevel}
                      onChange={(e) => setImpactLevel(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
                    >
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="major">Major</option>
                      <option value="catastrophic">Catastrophic</option>
                    </select>
                  </div>
                </div>
                
                <MagicalButton
                  type="submit"
                  isLoading={isSubmittingEvent}
                  disabled={isSubmittingEvent || !eventDescription}
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Record Event
                </MagicalButton>
              </form>
              
              {/* Events List */}
              <div className="space-y-8">
                {events
                  .filter(e => !selectedBeat || e.beat_id === selectedBeat.id)
                  .map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                      <EventCard
                        id={event.id}
                        description={event.description}
                        type={event.event_type as any}
                        impactLevel={event.impact_level as any}
                        beatId={event.beat_id}
                        createdAt={event.created_at}
                      />
                    </motion.div>
                  ))}
                  
                {events.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
                    <p className="text-sm text-gray-400">No events recorded yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </motion.div>
      </main>
    </div>
  )
}