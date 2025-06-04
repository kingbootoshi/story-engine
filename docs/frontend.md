# Frontend Developer Guide

## Folder Structure

```
src/react/
├── components/
│   └── ui/              # Reusable UI components
│       ├── BeatNode.tsx      # Timeline node component
│       ├── EventCard.tsx     # Event display card
│       ├── GlowingInput.tsx  # Styled input with animations
│       ├── MagicalButton.tsx # Primary button component
│       ├── Modal.tsx         # Modal dialog wrapper
│       ├── WorldCard.tsx     # World preview card
│       └── index.ts          # Barrel export
├── lib/
│   ├── api.ts           # API client and types
│   ├── beatHelpers.ts   # Beat logic utilities
│   └── utils.ts         # General utilities (cn)
├── pages/               # Route components
│   ├── Auth/
│   │   ├── Auth.tsx
│   │   └── index.ts
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   └── index.ts
│   ├── Landing/
│   │   ├── Landing.tsx
│   │   ├── CosmicBackground.tsx
│   │   ├── FeatureCard.tsx
│   │   └── index.ts
│   └── World/
│       ├── WorldDetail.tsx
│       └── index.ts
├── stores/              # Zustand state stores
│   └── authStore.ts
├── styles/
│   └── theme.css        # Tailwind theme config
├── App.tsx              # Root component with routing
└── main.tsx            # Entry point

src/shared/              # Shared with backend
├── types/              # TypeScript interfaces
└── utils/
    ├── supabase.ts     # Supabase client
    └── loggerBrowser.ts # Browser-safe logger
```

## Core Concepts

### Component Architecture
The app uses a hierarchical component structure:
- **Pages** - Route-level components
- **Components/UI** - Reusable UI elements
- **Layouts** - Shared page structures (implicit)

### State Management

#### Global State (Zustand)
```typescript
// authStore.ts pattern
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      signIn: async (email, password) => {
        // Handle auth
        set({ user, isAuthenticated: true })
      }
    }),
    { name: 'auth-storage' }
  )
)

// Usage in components
const { user, signIn } = useAuthStore()
```

#### Component State
```typescript
// Local state for UI
const [isLoading, setIsLoading] = useState(false)
const [selectedBeat, setSelectedBeat] = useState<WorldBeat | null>(null)

// Derived state
const currentBeat = getCurrentBeat(beats) // Helper function
```

### API Integration

The `api.ts` file provides typed methods for all backend calls:
```typescript
// Fetch data
const worlds = await api.getUserWorlds()
const worldState = await api.getWorldState(worldId)

// Mutations
const newWorld = await api.createWorld(name, description)
const arc = await api.createArc(worldId, storyIdea)
const beat = await api.progressArc(worldId, arcId, events)
```

## Adding New Features

### 1. Creating a New Page

```typescript
// src/react/pages/Analytics/Analytics.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MagicalButton } from '../../components/ui'
import { api } from '../../lib/api'

export function Analytics() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    loadAnalytics()
  }, [])
  
  const loadAnalytics = async () => {
    try {
      const analytics = await api.getWorldAnalytics()
      setData(analytics)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return <LoadingState />
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-900 p-6"
    >
      {/* Page content */}
    </motion.div>
  )
}

// Add to router in App.tsx
<Route path="/analytics" element={<Analytics />} />
```

### 2. Creating a New UI Component

```typescript
// src/react/components/ui/StatCard.tsx
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({ 
  label, 
  value, 
  icon, 
  trend = 'neutral',
  className 
}: StatCardProps) {
  return (
    <motion.div
      className={cn(
        "p-6 rounded-xl bg-card border border-border",
        "hover:border-primary/50 transition-colors",
        className
      )}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && (
          <div className="text-primary">{icon}</div>
        )}
      </div>
      
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend !== 'neutral' && (
          <TrendIndicator direction={trend} />
        )}
      </div>
    </motion.div>
  )
}

// Export from index.ts
export { StatCard } from './StatCard'
```

### 3. Adding API Methods

```typescript
// In lib/api.ts
class WorldStoryAPI {
  // ... existing methods
  
  async getWorldAnalytics(worldId: string): Promise<Analytics> {
    const response = await fetch(`${API_BASE}/worlds/${worldId}/analytics`)
    if (!response.ok) throw new Error('Failed to fetch analytics')
    return response.json()
  }
  
  async exportWorld(worldId: string, format: 'json' | 'pdf'): Promise<Blob> {
    const response = await fetch(
      `${API_BASE}/worlds/${worldId}/export?format=${format}`
    )
    if (!response.ok) throw new Error('Export failed')
    return response.blob()
  }
}
```

### 4. Creating Custom Hooks

```typescript
// src/react/hooks/useWorldEvents.ts
import { useState, useEffect } from 'react'
import { api, type WorldEvent } from '../lib/api'

export function useWorldEvents(worldId: string) {
  const [events, setEvents] = useState<WorldEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    let cancelled = false
    
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const data = await api.getEvents(worldId)
        if (!cancelled) {
          setEvents(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    
    fetchEvents()
    
    // Cleanup
    return () => { cancelled = true }
  }, [worldId])
  
  return { events, isLoading, error, refetch: () => fetchEvents() }
}
```

## Styling Guidelines

### Using Tailwind with Custom Theme
```typescript
// Use theme colors via CSS variables
<div className="bg-primary text-primary-foreground" />
<div className="border-aurora/20 bg-aurora/10" />

// Combine with utilities
<div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm" />

// Conditional styling with cn()
<button className={cn(
  "px-4 py-2 rounded-lg transition-all",
  "hover:bg-primary/10 hover:scale-105",
  isActive && "bg-primary text-white",
  disabled && "opacity-50 cursor-not-allowed"
)} />
```

### Animation Patterns
```typescript
// Page transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.4 }}
>

// Hover effects
<motion.div
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
>

// Stagger children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.div>
```

## Best Practices

### Component Organization
```typescript
// 1. Imports (grouped by type)
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MagicalButton, WorldCard } from '../../components/ui'
import { api } from '../../lib/api'
import type { World } from '../../lib/api'

// 2. Types/Interfaces
interface Props {
  worldId: string
  onUpdate?: (world: World) => void
}

// 3. Component
export function MyComponent({ worldId, onUpdate }: Props) {
  // 4. State declarations
  const [state, setState] = useState()
  
  // 5. Effects
  useEffect(() => {}, [])
  
  // 6. Handlers
  const handleClick = () => {}
  
  // 7. Render
  return <div />
}
```

### Error Handling
```typescript
// Consistent error UI
if (error) {
  return (
    <div className="text-center py-16">
      <h2 className="text-xl text-destructive mb-4">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-6">{error.message}</p>
      <MagicalButton onClick={retry}>Try Again</MagicalButton>
    </div>
  )
}
```

### Loading States
```typescript
// Skeleton loading
if (isLoading) {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-muted/20 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

// Inline loading
<MagicalButton isLoading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</MagicalButton>
```

### Type Safety
```typescript
// Always type API responses
const [worlds, setWorlds] = useState<World[]>([])

// Type event handlers
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
}

// Type component props
interface Props {
  world: World
  onSelect?: (world: World) => void
  isActive?: boolean
}
```

## Performance Tips

### Memoization
```typescript
// Memoize expensive computations
const sortedEvents = useMemo(
  () => events.sort((a, b) => b.created_at.localeCompare(a.created_at)),
  [events]
)

// Memoize callbacks
const handleUpdate = useCallback((data: any) => {
  updateWorld(worldId, data)
}, [worldId])
```

### Lazy Loading
```typescript
// Lazy load heavy components
const Analytics = lazy(() => import('./pages/Analytics'))

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Analytics />
</Suspense>
```

### Optimistic Updates
```typescript
const handleLike = async () => {
  // Update UI immediately
  setLiked(true)
  setLikeCount(prev => prev + 1)
  
  try {
    await api.likeWorld(worldId)
  } catch (error) {
    // Revert on error
    setLiked(false)
    setLikeCount(prev => prev - 1)
    showError('Failed to like world')
  }
}
```

## Testing Components

### Component Testing Pattern
```typescript
// MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```