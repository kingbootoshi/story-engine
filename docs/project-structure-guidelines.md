# STORY ENGINE Project Structure Guidelines

## Overview

Story Engine is a TypeScript-based web application utilizing React for the frontend, Node.js/Express for the backend, and a modular architecture pattern. The application uses Supabase for database operations and Vite for bundling. This document outlines the project's structure, key components, and guidelines for adding new code or features.

## Directory Structure

```
story-engine/
├── .bolt/                  # Bolt IDE configuration
├── .claude/                # Claude AI integration configuration
├── docs/                   # Project documentation
├── for_claude/             # Claude-specific resources and images
├── logs/                   # Application logs (generated)
├── public/                 # Static assets
├── src/                    # Source code
│   ├── core/               # Core infrastructure and services
│   │   ├── ai/             # AI integration services
│   │   │   ├── client/     # AI client implementations
│   │   │   ├── prompts/    # AI prompt templates
│   │   │   └── schemas/    # AI data schemas
│   │   ├── infra/          # Infrastructure services
│   │   └── types/          # Core type definitions
│   ├── backend/            # Backend API and services (being migrated to core/infra)
│   │   ├── api/            # REST API routes
│   │   │   └── routes/     # Route definitions
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Backend utilities
│   ├── frontend/           # React frontend application
│   │   ├── components/     # React components
│   │   │   ├── common/     # Shared/reusable components
│   │   │   ├── events/     # Event-related components
│   │   │   ├── story/      # Story-specific components
│   │   │   ├── ui/         # UI framework components
│   │   │   └── world/      # World-building components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Frontend utilities and libraries
│   │   ├── pages/          # Page-level components
│   │   │   ├── Auth/       # Authentication pages
│   │   │   ├── Dashboard/  # Dashboard pages
│   │   │   ├── Landing/    # Landing page
│   │   │   └── World/      # World-building pages
│   │   ├── stores/         # State management (Zustand/Redux)
│   │   ├── styles/         # CSS and styling
│   │   └── types/          # Frontend-specific types
│   ├── modules/            # Feature modules (domain-driven)
│   │   └── world/          # World-building module
│   │       ├── backend/    # World module backend logic
│   │       ├── frontend/   # World module frontend components
│   │       ├── events.ts   # Domain events
│   │       ├── index.ts    # Module entry point
│   │       └── manifest.ts # Module registration
│   └── shared/             # Shared utilities and types
│       ├── config/         # Configuration files
│       ├── types/          # Shared type definitions
│       └── utils/          # Shared utility functions
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migrations
└── [Configuration Files]   # Various configuration files in the root
```

## Key Components

### 1. Core Infrastructure (`src/core/`)

**Purpose:** Contains the core infrastructure services that power the entire application.

**Responsibilities:**
- AI integration and prompt management
- Infrastructure services (database, logging, event bus, DI container)
- Core type definitions and interfaces
- Cross-cutting concerns and utilities

**Structure:**
- `ai/` - AI service integration with clients, prompts, and schemas
- `infra/` - Infrastructure services (supabase, logger, eventBus, container)
- `types/` - Core type definitions used across the application

**Placement:** Place core infrastructure code here that needs to be available across all modules.

### 2. Frontend (`src/frontend/`)

**Purpose:** Contains the React-based user interface code.

**Responsibilities:**
- User interface components and pages
- Frontend state management
- User interaction handling
- Client-side routing and navigation

**Structure:**
- `components/` - Reusable React components organized by domain
- `hooks/` - Custom React hooks for state and logic
- `pages/` - Top-level page components
- `stores/` - State management (Zustand, Redux, etc.)
- `lib/` - Frontend utilities and third-party integrations
- `styles/` - CSS, SCSS, and styling configuration
- `types/` - Frontend-specific TypeScript types

**Placement:** All UI-related code should go here, following React and component-based architecture best practices.

### 3. Backend (`src/backend/`) - Being Migrated

**Purpose:** Contains backend API and business logic (currently being migrated to `core/infra` and modules).

**Current Structure:**
- `api/routes/` - Express.js route definitions
- `services/` - Business logic services
- `utils/` - Backend utility functions

**Migration Plan:** Backend logic is being moved to:
- Core infrastructure → `src/core/infra/`
- Domain-specific logic → respective modules in `src/modules/`

### 4. Modules (`src/modules/`)

**Purpose:** Feature modules implementing domain-driven design principles.

**Responsibilities:**
- Self-contained feature implementations
- Domain-specific business logic
- Module-specific types and interfaces
- Event-driven communication between modules

**Structure per Module:**
- `backend/` - Server-side logic, repositories, services
- `frontend/` - Module-specific React components
- `events.ts` - Domain events for the module
- `index.ts` - Module entry point and exports
- `manifest.ts` - Module registration and configuration

**Placement:** Each feature domain should have its own module directory with clear boundaries and interfaces.

### 5. Shared (`src/shared/`)

**Purpose:** Shared utilities, types, and configuration used across the application.

**Responsibilities:**
- Common utility functions
- Shared type definitions
- Configuration management
- Cross-module interfaces

**Placement:** Place code here that is truly shared across multiple parts of the application but doesn't belong in core infrastructure.

### 6. Documentation (`docs/`)

**Purpose:** Project documentation for developers and stakeholders.

**Content:**
- Architecture overviews
- API documentation
- Development guides
- Design documentation
- System overviews

**Placement:** Organize by topic with clear, descriptive filenames.

## Adding New Features

### 1. Core Application Features

For features that extend the core application infrastructure:

- **Infrastructure Services:** Add to `src/core/infra/`
- **AI Services:** Add to `src/core/ai/`
- **Shared Types:** Add to `src/core/types/`
- **Frontend Components:** Add to appropriate `src/frontend/components/` subdirectory

### 2. Domain-Specific Features

For features that belong to a specific business domain:

- Create a new module in `src/modules/[domain-name]/`
- Implement backend logic in `[domain-name]/backend/`
- Implement frontend components in `[domain-name]/frontend/`
- Define domain events in `events.ts`
- Create module manifest in `manifest.ts`
- Export through `index.ts`

### 3. Shared Utilities

For utilities used across multiple modules:

- Add to `src/shared/utils/`
- Add shared types to `src/shared/types/`
- Update configuration in `src/shared/config/`

## Best Practices

1. **Modular Architecture:**
   - Keep modules self-contained with clear boundaries
   - Use events for inter-module communication
   - Avoid direct dependencies between modules

2. **Separation of Concerns:**
   - Frontend: UI rendering, user interaction, client-side state
   - Backend: Business logic, data persistence, API endpoints
   - Core: Infrastructure, shared services, cross-cutting concerns

3. **Type Safety:**
   - Use proper TypeScript typing throughout
   - Define interfaces for module boundaries
   - Leverage shared types from `core/types/` and `shared/types/`

4. **Dependency Injection:**
   - Use the DI container for service registration
   - Register services in module manifests
   - Avoid tight coupling through proper abstractions

5. **Event-Driven Design:**
   - Use the event bus for loose coupling
   - Define domain events in each module
   - Handle cross-module communication through events

6. **Security:**
   - Validate all inputs, especially from API endpoints
   - Use proper authentication and authorization
   - Follow security best practices for web applications

7. **Documentation:**
   - Use JSDoc comments for public APIs
   - Document module interfaces and events
   - Keep architecture documentation up to date

## Configuration Files

Important configuration files in the root directory:

- `vite.config.ts` - Vite build and development configuration
- `tsconfig.json` - TypeScript compiler configuration
- `package.json` - Project dependencies and scripts
- `.env` / `.env.example` - Environment variables
- `index.html` - Main HTML entry point

## Migration Guidelines

As the project evolves from the current structure to the modular architecture:

1. **Backend Migration:**
   - Move infrastructure services to `src/core/infra/`
   - Move domain logic to respective modules
   - Update imports and dependencies

2. **Module Creation:**
   - Start with existing features like `world`
   - Follow the manifest pattern for registration
   - Implement proper event communication

3. **Type Consolidation:**
   - Move shared types to `src/core/types/` or `src/shared/types/`
   - Update imports across the codebase
   - Ensure type safety is maintained

4. **Dependency Updates:**
   - Update service registrations to use DI container
   - Migrate to event-driven communication
   - Remove direct module dependencies

Make sure to update these guidelines as the architecture evolves and new patterns emerge. 