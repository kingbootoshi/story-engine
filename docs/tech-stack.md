# Tech Stack Documentation

## Overview

The Story Engine is a full-stack TypeScript application built with modern web technologies. It uses a client-server architecture with a React frontend and Express backend, both sharing common TypeScript types and utilities.

## Core Technologies

### Frontend
- **React 19** - UI library with hooks and functional components
- **Vite** - Build tool and dev server with HMR
- **React Router v7** - Client-side routing
- **Zustand** - Lightweight state management
- **Framer Motion** - Animation library
- **Tailwind CSS v4** - Utility-first CSS framework with custom theme
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend
- **Express 5** - Web server framework
- **TypeScript** - Type safety across the stack
- **OpenAI/OpenRouter** - AI narrative generation via OpenPipe SDK
- **Supabase** - PostgreSQL database and authentication
- **Winston** - Structured logging
- **Zod** - Schema validation

### Shared
- **TypeScript** - Shared types between frontend and backend
- **dotenv** - Environment variable management
- **ESM Modules** - Modern JavaScript module system

## Architecture Patterns

### API Design
- RESTful endpoints with clear resource hierarchy
- Async/await pattern with error boundaries
- Structured JSON responses
- Request validation and error handling

### Database
- PostgreSQL via Supabase
- Row-level security (RLS) for multi-tenancy
- Service-role key for backend operations
- Typed database operations with error handling

### AI Integration
- Function calling for structured outputs
- Prompt engineering with system/user separation
- Model-agnostic design (currently using Claude Sonnet)
- Observability via OpenPipe

### State Management
- Zustand for global client state (auth)
- React hooks for component state
- Server state via API calls
- Optimistic UI updates where appropriate

## Development Workflow

### Environment Variables
The project uses a unified `.env` file with optional `VITE_` prefixes for frontend variables. The backend can read both formats for compatibility.

Required variables:
- `OPENROUTER_API_KEY` - For AI generation
- `SUPABASE_URL` - Database URL
- `SUPABASE_ANON_KEY` - Public Supabase key
- `OPENPIPE_API_KEY` - (Optional) For AI observability

## Key Design Decisions

### TypeScript Configuration
- Strict mode enabled for type safety
- ESM modules with `.ts` extensions allowed
- Shared types in `src/shared/types/`
- No build step for backend (using tsx)

### Styling Approach
- Tailwind CSS with custom theme variables
- CSS custom properties for dynamic theming
- Framer Motion for animations
- Glassmorphism and glow effects

### Error Handling
- Structured error responses from API
- Client-side error boundaries
- Comprehensive logging with Winston
- User-friendly error messages

### Security
- Supabase RLS for data isolation
- API key authentication for AI services
- Environment variable validation with Zod
- CORS configured for local development

## Performance Considerations

### Frontend
- Code splitting via Vite
- Lazy loading for routes
- Optimistic UI updates
- Minimal bundle size

### Backend
- Async request handling
- Database connection pooling (via Supabase)
- Structured logging for debugging
- Graceful error recovery

### AI Generation
- Sparse generation strategy (3 anchor points)
- Caching considerations for generated content
- Rate limiting awareness
- Token usage optimization