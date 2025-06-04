# Module System Documentation

## Overview

Modules are self-contained features that encapsulate routes, controllers, services, and data access. Each module follows a consistent structure for maintainability.

## Module Structure

```
src/modules/[module-name]/
├── [module].controller.ts  # HTTP handlers
├── [module].service.ts     # Business logic
├── [module].repo.ts        # Database layer
└── [module].routes.ts      # Route definitions
```

## Creating a Module - Quick Example

### 1. Define Types
```typescript
// src/shared/types/campaign.types.ts
export interface Campaign {
  id: string
  worldId: string
  name: string
  description: string
  status: 'planning' | 'active' | 'completed'
  playerCount: number
  createdAt: string
}
```

### 2. Repository Layer
```typescript
// src/modules/campaign/campaign.repo.ts
import { supabase } from '../../shared/utils/supabase'
import type { Campaign } from '../../shared/types/campaign.types'

export async function create(data: Omit<Campaign, 'id' | 'createdAt'>) {
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  return campaign
}

export async function findByWorldId(worldId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('world_id', worldId)
  
  if (error) throw error
  return data || []
}
```

### 3. Service Layer
```typescript
// src/modules/campaign/campaign.service.ts
import * as campaignRepo from './campaign.repo'

export async function createCampaign(params: {
  worldId: string
  name: string
  description: string
  playerCount: number
}) {
  // Validation & business logic
  const existing = await campaignRepo.findByWorldId(params.worldId)
  if (existing.some(c => c.name === params.name)) {
    throw new Error('Campaign name already exists')
  }
  
  return await campaignRepo.create({
    ...params,
    status: 'planning'
  })
}

export async function getWorldCampaigns(worldId: string) {
  return await campaignRepo.findByWorldId(worldId)
}
```

### 4. Controller Layer
```typescript
// src/modules/campaign/campaign.controller.ts
import type { Request, Response, NextFunction } from 'express'
import * as campaignService from './campaign.service'

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.createCampaign({
      worldId: req.params.worldId,
      ...req.body
    })
    res.status(201).json(campaign)
  } catch (err) {
    next(err)
  }
}

export const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaigns = await campaignService.getWorldCampaigns(req.params.worldId)
    res.json(campaigns)
  } catch (err) {
    next(err)
  }
}
```

### 5. Routes
```typescript
// src/modules/campaign/campaign.routes.ts
import { Router } from 'express'
import * as ctrl from './campaign.controller'

const router = Router()

router.post('/', ctrl.createCampaign)
router.get('/', ctrl.getCampaigns)

export default router
```

### 6. Register in Backend
```typescript
// src/backend/api/server.ts
import campaignRoutes from '../../modules/campaign/campaign.routes'

// Mount under world routes
app.use('/api/worlds/:worldId/campaigns', campaignRoutes)
```

### 7. Frontend API
```typescript
// src/react/lib/api.ts
async createCampaign(worldId: string, data: any): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/worlds/${worldId}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create campaign')
  return res.json()
}
```

### 8. Database Schema
```sql
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  player_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Module Patterns

### Cross-Module Communication
```typescript
// Use services, not direct imports
import { worldService } from '../world/world.service'

export async function createWithWorld(data: any) {
  const world = await worldService.getWorld(data.worldId)
  // ... use world data
}
```

### Error Handling
```typescript
// Consistent error pattern
if (!resource) throw new Error('Resource not found')
if (invalid) return res.status(400).json({ error: 'Invalid input' })
```

### Async Handler Wrapper
```typescript
// Reusable wrapper (already in world.routes.ts)
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

router.get('/', asyncHandler(ctrl.getAll))
```

## Quick Module Ideas

- **Character** - NPCs and relationships
- **Location** - Places and maps  
- **Quest** - Missions and objectives
- **Faction** - Groups and politics
- **Item** - Objects and inventory
- **Combat** - Battle systems
- **Dialog** - Conversation trees

## Checklist for New Modules

- [ ] Create types in `shared/types/`
- [ ] Create module folder structure
- [ ] Implement repo → service → controller → routes
- [ ] Register routes in server.ts
- [ ] Add frontend API methods
- [ ] Create database tables
- [ ] Add RLS policies if needed
- [ ] Create React components
- [ ] Add to documentation