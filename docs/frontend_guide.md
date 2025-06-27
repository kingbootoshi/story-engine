# Story Engine Frontend Documentation

## Overview

The Story Engine frontend is built with React and TypeScript, following a feature-based module architecture that makes it easy for developers and AI agents to understand and extend.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: 
  - Server State: TanStack Query (React Query)
  - Local State: Zustand
- **API Communication**: tRPC v11 client
- **Authentication**: Supabase Auth
- **Build Tool**: Vite

## Directory Structure

```
src/frontend/
├── features/              # Feature-based modules
│   ├── auth/             # Authentication feature
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Public exports
│   ├── worlds/           # World management feature
│   ├── characters/       # Character management
│   ├── factions/         # Faction management
│   ├── locations/        # Location management
│   └── landing/          # Landing page
├── shared/               # Shared utilities
│   ├── components/       # Reusable components
│   ├── hooks/           # Shared hooks
│   ├── lib/             # Libraries and utilities
│   └── utils/           # Helper functions
├── app/                 # Application shell
│   ├── routes/          # Route configuration
│   ├── layout/          # Layout components
│   └── pages/           # Top-level pages
├── components/          # shadcn/ui components
│   └── ui/             # UI component library
├── globals.css          # Global styles
└── main.tsx            # Application entry point
```

## Component Conventions

### 1. File Naming
- Components: `PascalCase.tsx` (e.g., `WorldsList.tsx`)
- Hooks: `camelCase.ts` starting with "use" (e.g., `useAuth.ts`)
- Stores: `camelCase.ts` ending with "Store" (e.g., `authStore.ts`)
- Types: `camelCase.types.ts` (e.g., `world.types.ts`)

### 2. Component Structure
```tsx
// Import external dependencies first
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Import from features
import { useAuth } from '@/features/auth';

// Import shared utilities
import { cn } from '@/shared/lib/utils';

// Import types
import type { World } from '../types/world.types';

// Define props interface
interface WorldCardProps {
  world: World;
  onSelect?: (world: World) => void;
}

// Export component
export function WorldCard({ world, onSelect }: WorldCardProps) {
  // Component logic here
}
```

### 3. Feature Module Structure
Each feature module should have:
- `components/` - Feature-specific components
- `hooks/` - Feature-specific hooks
- `stores/` - Zustand stores for local state
- `types/` - TypeScript types and interfaces
- `index.ts` - Public API exports

### 4. State Management Patterns

#### Server State (TanStack Query)
```tsx
// Use for data fetched from the server
const { data, isLoading, error } = useQuery({
  queryKey: ['worlds'],
  queryFn: () => trpc.world.list.query(),
});
```

#### Local State (Zustand)
```tsx
// Use for client-side state that needs to be shared
const useWorldStore = create<WorldState>((set) => ({
  selectedWorld: null,
  setSelectedWorld: (world) => set({ selectedWorld: world }),
}));
```

#### Component State (useState)
```tsx
// Use for component-specific state
const [isOpen, setIsOpen] = useState(false);
```

## Adding New Features

### 1. Create Feature Structure
```bash
mkdir -p src/frontend/features/newfeature/{components,hooks,stores,types}
```

### 2. Create Index File
```tsx
// src/frontend/features/newfeature/index.ts
export { NewFeatureComponent } from './components/NewFeatureComponent';
export { useNewFeature } from './hooks/useNewFeature';
```

### 3. Add Route
```tsx
// src/frontend/app/routes/index.tsx
import { NewFeature } from '@/features/newfeature';

// Add to router configuration
{
  path: 'newfeature',
  element: <NewFeature />,
}
```

## Using shadcn/ui Components

### 1. Add a Component
```bash
npx shadcn@latest add button
```

### 2. Use in Your Code
```tsx
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return <Button>Click me</Button>;
}
```

## API Integration

### 1. Using tRPC
```tsx
import { trpc } from '@/shared/lib/trpcClient';

// In a component
const { data } = trpc.world.get.useQuery({ id: worldId });

// For mutations
const createWorld = trpc.world.create.useMutation({
  onSuccess: () => {
    // Handle success
  },
});
```

### 2. Authentication
```tsx
import { useAuth } from '@/features/auth';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();
  
  if (!user) {
    return <div>Please log in</div>;
  }
  
  // Component content
}
```

## Styling Guidelines

### Tailwind CSS v4 - The "CSS-First" Approach

**CRITICAL: Follow these rules when coding CSS in this project**

#### 1. Component-Based CSS Files
- **EVERY SINGLE COMPONENT** will have its own relative `ComponentName.styles.css` file in the same directory
- **NO .tsx MAIN FUNCTIONALITY FILE** will have styling in it - import styling from the styles file
- File naming convention: `[ComponentName].styles.css` (e.g., `Button.styles.css`)

```
/features/worlds/components
├── WorldCard.tsx
├── WorldCard.styles.css
├── WorldsList.tsx
└── WorldsList.styles.css
```

#### 2. No @apply Directive
You will **NOT** use the `@apply` directive to compose classes. Instead, use Tailwind's CSS variables and theme() function:

```css
/* ❌ INCORRECT - Old Tailwind Method */
.btn-primary {
  @apply bg-blue-500 text-white font-bold py-2 px-4 rounded;
}

/* ✅ CORRECT - Tailwind v4 Method */
.btn-primary {
  background-color: theme('colors.blue.500');
  color: theme('colors.white');
  font-weight: theme('fontWeight.bold');
  padding: theme('spacing.2') theme('spacing.4');
  border-radius: theme('borderRadius.DEFAULT');
}
```

#### 3. CSS-First Configuration
- All Tailwind configuration and customization is done directly within CSS files using Tailwind's directives (e.g., `@theme`)
- No `tailwind.config.js` file unless explicitly required for legacy integration
- Use Tailwind's exposed CSS variables for custom components

#### 4. Component Structure Example

```tsx
// WorldCard.tsx
import { cn } from '@/shared/lib/utils';
import './WorldCard.styles.css';

interface WorldCardProps {
  world: World;
  isSelected?: boolean;
  onSelect?: (world: World) => void;
}

export function WorldCard({ world, isSelected, onSelect }: WorldCardProps) {
  return (
    <div 
      className={cn(
        'world-card', // Custom class from CSS file
        isSelected && 'world-card--selected'
      )}
      onClick={() => onSelect?.(world)}
    >
      <h3 className="world-card__title">{world.name}</h3>
      <p className="world-card__description">{world.description}</p>
    </div>
  );
}
```

```css
/* WorldCard.styles.css */
.world-card {
  background-color: theme('colors.white');
  border: 1px solid theme('colors.gray.200');
  border-radius: theme('borderRadius.lg');
  padding: theme('spacing.4');
  cursor: pointer;
  transition: all theme('transitionDuration.200') theme('transitionTimingFunction.in-out');
}

.world-card:hover {
  border-color: theme('colors.blue.300');
  box-shadow: theme('boxShadow.md');
}

.world-card--selected {
  border-color: theme('colors.blue.500');
  background-color: theme('colors.blue.50');
}

.world-card__title {
  font-size: theme('fontSize.lg');
  font-weight: theme('fontWeight.semibold');
  color: theme('colors.gray.900');
  margin-bottom: theme('spacing.2');
}

.world-card__description {
  color: theme('colors.gray.600');
  font-size: theme('fontSize.sm');
  line-height: theme('lineHeight.relaxed');
}

/* Responsive design using modern CSS nesting */
@media (min-width: theme('screens.md')) {
  .world-card {
    padding: theme('spacing.6');
  }
  
  .world-card__title {
    font-size: theme('fontSize.xl');
  }
}
```

#### 5. Modern CSS Features
Leverage modern CSS capabilities integral to Tailwind v4:
- **Cascade layers** (`@layer`)
- **Native CSS nesting**
- **color-mix()** function
- **CSS container queries**

```css
/* Using @layer for organization */
@layer components {
  .btn {
    padding: theme('spacing.2') theme('spacing.4');
    border-radius: theme('borderRadius.md');
    font-weight: theme('fontWeight.medium');
    transition: all theme('transitionDuration.150');
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

#### 6. Utility-First with Custom Components
- **Prioritize** Tailwind utility classes in HTML/JSX templates
- **Only use custom CSS** for complex styles or DRY principle adherence
- **Mobile-first** responsive design using Tailwind's responsive modifiers

```tsx
// ✅ Good - Utilities first, custom classes for complex components
<div className="flex items-center gap-4 p-4">
  <Button className="btn-primary">Primary Action</Button>
  <Button className="btn-secondary">Secondary</Button>
</div>

// ❌ Avoid - All styling in custom CSS when utilities would suffice
<div className="custom-flex-container">
  <Button className="custom-primary-btn">Primary Action</Button>
</div>
```

#### 7. Component Variants with CSS Variables
```css
/* Button.styles.css */
.btn {
  padding: theme('spacing.2') theme('spacing.4');
  border-radius: theme('borderRadius.md');
  font-weight: theme('fontWeight.medium');
  transition: all theme('transitionDuration.150');
  
  /* CSS custom properties for variants */
  --btn-bg: theme('colors.gray.100');
  --btn-text: theme('colors.gray.900');
  --btn-border: theme('colors.gray.300');
  
  background-color: var(--btn-bg);
  color: var(--btn-text);
  border: 1px solid var(--btn-border);
}

.btn--primary {
  --btn-bg: theme('colors.blue.600');
  --btn-text: theme('colors.white');
  --btn-border: theme('colors.blue.600');
}

.btn--secondary {
  --btn-bg: theme('colors.gray.600');
  --btn-text: theme('colors.white');
  --btn-border: theme('colors.gray.600');
}

.btn:hover {
  --btn-bg: color-mix(in srgb, var(--btn-bg) 90%, black);
}
```

#### 8. File Import Pattern
```tsx
// Always import styles at the top after React imports
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Import component styles
import './ComponentName.styles.css';

// Import shared utilities
import { cn } from '@/shared/lib/utils';
```

#### 9. Responsive Design with CSS Nesting
```css
.card {
  padding: theme('spacing.4');
  
  /* Mobile-first approach with nested media queries */
  @media (min-width: theme('screens.md')) {
    padding: theme('spacing.6');
    
    .card__title {
      font-size: theme('fontSize.2xl');
    }
  }
  
  @media (min-width: theme('screens.lg')) {
    padding: theme('spacing.8');
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: theme('spacing.6');
  }
}
```

### Legacy Utility Guidelines (for reference)

#### 1. Use Tailwind Utilities When Appropriate
```tsx
// Simple layouts and spacing - use utilities
<div className="flex items-center gap-4 p-4">

// Conditional classes with cn()
<div className={cn(
  "base-component-class", // From CSS file
  isActive && "base-component-class--active"
)}>
```

#### 2. Avoid Inline Styles
```tsx
// ❌ Avoid
<div style={{ padding: '1rem' }}>

// ✅ Prefer utilities or CSS classes
<div className="p-4"> {/* or custom CSS class */}
```

## Best Practices for AI Agents

1. **Always check existing patterns** - Look at similar components before creating new ones
2. **Use TypeScript strictly** - Define all prop types and return types
3. **Follow the feature structure** - Keep related code together in feature modules
4. **Reuse shared components** - Check `@/shared/components` before creating new ones
5. **Keep components focused** - One component, one responsibility
6. **Use proper imports** - Use the `@/` alias for absolute imports
7. **Test your changes** - Ensure the app builds without errors

## Common Tasks

### Adding a New Page
1. Create component in appropriate feature folder
2. Export from feature's index.ts
3. Add route in `app/routes/index.tsx`
4. Add navigation link if needed

### Creating a Form
1. Use shadcn/ui form components
2. Add validation with Zod
3. Handle submission with tRPC mutation
4. Show loading and error states

### Adding Global State
1. Create store in feature's `stores/` folder
2. Define TypeScript interface for state
3. Export hooks for accessing state
4. Use in components as needed

## Environment Variables
Frontend environment variables are prefixed with `VITE_`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Access in code:
```tsx
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```