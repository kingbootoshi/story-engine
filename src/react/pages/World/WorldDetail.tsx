import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MagicalButton, BeatNode, EventCard, GlowingInput } from '../../components/ui'
import { ArrowLeft, Plus, Loader2, Play, Check } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !world) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'World not found'}</p>
          <MagicalButton onClick={() => navigate('/dashboard')} variant="secondary">
            Back to Dashboard
          </MagicalButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <MagicalButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Worlds
          </MagicalButton>
          <h1 className="text-xl font-semibold">{world.name}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* World Info */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">{world.name}</h2>
            <p className="text-muted-foreground">{world.description}</p>
          </div>

          {/* Arc Section */}
          <section className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Story Arcs</h3>
            {allArcs.length > 0 ? (
              <div className="space-y-4">
                {allArcs.map((arc) => (
                  <div
                    key={arc.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      arc.id === selectedArcId 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-muted'
                    }`}
                    onClick={() => handleArcSwitch(arc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{arc.story_name}</h4>
                          {arc.id === world.current_arc_id && (
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{arc.story_idea}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {arc.status === 'completed' && (
                          <Check className="w-5 h-5 text-aurora" />
                        )}
                        <span className="text-sm font-medium">
                          {arc.status.charAt(0).toUpperCase() + arc.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No arcs created yet</p>
            )}
            
            {/* Create Arc */}
            {(!currentArc || currentArc.status === 'completed') && (
              <div className="mt-4 p-4 border border-dashed border-border rounded-lg">
                <h4 className="font-medium mb-2">Create New Arc</h4>
                <div className="flex gap-2">
                  <GlowingInput
                    placeholder="Story idea (optional)"
                    value={newArcIdea}
                    onChange={(e) => setNewArcIdea(e.target.value)}
                    className="flex-1"
                  />
                  <MagicalButton
                    onClick={handleCreateArc}
                    isLoading={isCreatingArc}
                    disabled={isCreatingArc}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Arc
                  </MagicalButton>
                </div>
              </div>
            )}
          </section>

          {/* Timeline */}
          {currentArc && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold">Story Timeline</h3>
                {currentArc.status === 'active' && (
                  <MagicalButton
                    onClick={handleProgressArc}
                    isLoading={isProgressingArc}
                    disabled={isProgressingArc || beats.length >= 15}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Progress Story
                  </MagicalButton>
                )}
              </div>
              
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-8 min-w-max p-4">
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
              </div>
            </section>
          )}

          {/* Selected Beat */}
          {selectedBeat && (
            <section className="mb-8 p-6 rounded-lg bg-card border border-border">
              <h3 className="text-xl font-semibold mb-4">{selectedBeat.beat_name}</h3>
              <p className="text-muted-foreground mb-6">{selectedBeat.description}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">World Directives</h4>
                  <ul className="space-y-2">
                    {selectedBeat.world_directives.map((directive, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {directive}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Emergent Storylines</h4>
                  <ul className="space-y-2">
                    {selectedBeat.emergent_storylines.map((storyline, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {storyline}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Events */}
          {currentArc && (
            <section>
              <h3 className="text-2xl font-semibold mb-4">World Events</h3>
              
              {/* Record Event Form */}
              <form onSubmit={handleRecordEvent} className="mb-6 p-4 bg-card rounded-lg border border-border">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <GlowingInput
                    placeholder="Event description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    required
                  />
                  
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="px-3 py-3 bg-background border border-input rounded-lg"
                  >
                    <option value="player_action">Player Action</option>
                    <option value="environmental">Environmental</option>
                    <option value="social">Social</option>
                    <option value="system_event">System Event</option>
                  </select>
                  
                  <select
                    value={impactLevel}
                    onChange={(e) => setImpactLevel(e.target.value)}
                    className="px-3 py-3 bg-background border border-input rounded-lg"
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="catastrophic">Catastrophic</option>
                  </select>
                </div>
                
                <MagicalButton
                  type="submit"
                  isLoading={isSubmittingEvent}
                  disabled={isSubmittingEvent || !eventDescription}
                >
                  Record Event
                </MagicalButton>
              </form>
              
              {/* Events List */}
              <div className="space-y-4">
                {events
                  .filter(e => !selectedBeat || e.beat_id === selectedBeat.id)
                  .map((event) => (
                    <EventCard
                      key={event.id}
                      {...event}
                      type={event.event_type as any}
                      impactLevel={event.impact_level as any}
                    />
                  ))}
                  
                {events.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No events recorded yet
                  </p>
                )}
              </div>
            </section>
          )}
        </motion.div>
      </main>
    </div>
  )
}