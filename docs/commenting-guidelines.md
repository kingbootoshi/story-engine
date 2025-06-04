# STORY ENGINE Commenting Guidelines

## Philosophy

Our primary goal for commenting is **clarity and maintainability**. In a TypeScript codebase, types already provide significant information about the *what*. Therefore, our comments should focus on the **why**, the **intent**, and the **complexities** that aren't immediately obvious from the code and types alone.

We use **JSDoc** as the standard format. This provides structure, integrates well with TypeScript's language server for enhanced IntelliSense, and offers a consistent format for both human developers and AI systems interacting with our code.

Comments should add value. Avoid redundant comments that merely restate the obvious or duplicate type information. Prioritize commenting complex logic, module boundaries, and non-intuitive decisions.

## Core Standard: JSDoc

All multi-line comments explaining functions, classes, types, components, hooks, or complex blocks should use the JSDoc format (`/** ... */`).

## When to Comment

Focus commenting efforts where they provide the most value:

1. **API Layer (Backend):**
   * **Route Handlers:** Document endpoints, request/response formats, authentication requirements, and side effects.
   * **Service Layer:** Explain business logic, external integrations, and data transformations.
   * **Repository Layer:** Document database operations, query patterns, and data validation.
   * **Middleware:** Explain request processing, validation logic, and security measures.

2. **Frontend Components:**
   * **React Components:** Describe the component's purpose, its props, state behavior, and interaction patterns.
   * **Custom Hooks:** Explain what the hook does, its parameters, return values, and side effects.
   * **Page Components:** Document the page's responsibility and its interaction with backend services.
   * **State Management:** Document Zustand stores, state transitions, and side effects.

3. **Modular Architecture:**
   * **Module Manifests:** Document the module's purpose, dependencies, and integration points.
   * **Module Services:** Explain the core functionality and external interfaces.
   * **Event Handlers:** Document event payloads, processing logic, and side effects.
   * **Module Registration:** Explain DI container setup and route mounting.

4. **Core Infrastructure:**
   * **Event Bus:** Document event topics, payload structures, and processing flows.
   * **DI Container:** Explain service registration and dependency resolution.
   * **Database Operations:** Document Supabase queries, transactions, and data relationships.
   * **Logger Configuration:** Explain log levels, formatting, and output destinations.

5. **AI Integration:**
   * **Prompt Engineering:** Document prompt structure, context building, and expected outputs.
   * **AI Service Calls:** Explain model selection, parameters, and error handling.
   * **Function Calling:** Document tool definitions, parameter validation, and response parsing.
   * **Observability:** Explain OpenPipe integration and monitoring strategies.

6. **Complex Logic:**
   * If an algorithm, calculation, or piece of business logic is intricate or non-obvious, add comments explaining the approach and the reasoning behind it. Focus on the *why*.

7. **Non-Obvious Decisions & Trade-offs:**
   * If a particular implementation choice was made for specific reasons (performance, security, workaround for library limitations), document it. This provides crucial context for future maintainers.

8. **Security Considerations:**
   * Document authentication/authorization logic, data validation, and input sanitization.
   * Explain rate limiting, CORS policies, and API security measures.
   * Document Supabase RLS policies and security boundaries.

9. **External Integrations:**
   * Document AI service integrations, third-party APIs, and external service configurations.
   * Explain error handling, retry logic, and fallback strategies.
   * Document environment variable requirements and configuration.

10. **Real-time Features:**
    * Document WebSocket connections, real-time subscriptions, and data synchronization.
    * Explain conflict resolution and optimistic updates.

11. **Workarounds and `TODO`s:**
    * Use `// HACK:` or `// WORKAROUND:` for temporary fixes, explaining *why* the workaround is necessary.
    * Use `// TODO:` for planned improvements or missing features, ideally with context.

## How to Comment with JSDoc (Essential Tags)

Use clear, concise English. Start block comments with a brief summary sentence.

```typescript
/**
 * [Summary sentence explaining the overall purpose.]
 *
 * [Optional: More detailed explanation, rationale, or context.]
 *
 * @param {Type} name - [Description of the parameter's purpose and expected value.]
 * @param {Type} [optionalName] - [Description for optional parameter. Use brackets.]
 * @returns {ReturnType} - [Description of what the function returns and why/when.]
 * @throws {ErrorType} - [Description of when/why this error might be thrown.]
 * @example
 * ```typescript
 * const result = myFunction(inputValue);
 * ```
 */
function myFunction(name: string, options?: { count: number }): ReturnType {
  // ...implementation
}
```

**Key JSDoc Tags to Use:**

* **Description:** Always provide a clear summary. Add more detail if necessary.
* **`@param {Type} name - Description`**: Essential for functions and methods. Explain the *role* of the parameter. TypeScript handles the type, JSDoc explains the *purpose*.
* **`@returns {Type} - Description`**: Explain *what* is being returned and under what conditions, especially if it's complex or conditional.
* **`@throws {ErrorType} - Condition`**: Document expected errors that callers might need to handle.
* **`@example`**: Very helpful for demonstrating usage, especially for utilities or complex functions.
* **`@see {Link/Reference}`**: Useful for linking to related code or documentation.

## What NOT to Comment

* **Obvious Code:** Don't explain code that is self-evident (e.g., `// Increment count` for `count++`).
* **Exact Type Duplication:** Avoid comments that just re-state the TypeScript type. Focus on *purpose* if adding a `@param` comment.
* **Version Control Information:** Don't add comments about authors or change history. Use `git blame` and commit history for this.
* **Outdated Comments:** Delete or update comments if the code changes. Incorrect comments are worse than no comments.
* **Commented-Out Code:** Remove dead code instead of commenting it out. Use version control to retrieve old code if needed.

## Examples For Different Application Areas

### Backend API Routes

```typescript
/**
 * Creates a new world with initial story arc setup.
 * Initializes world metadata, story structure, and AI configuration.
 *
 * @param {CreateWorldRequest} req - Request with world creation data
 * @param {Response} res - Express response object
 * @throws {ValidationError} If world data is invalid
 * @throws {QuotaError} If user exceeds world creation limits
 */
export const createWorld = async (req: CreateWorldRequest, res: Response): Promise<void> => {
  const logger = createLogger('world.controller');
  logger.info('Creating new world', { userId: req.user.id });
  
  // Validate request payload against schema
  const validatedData = CreateWorldSchema.parse(req.body);
  
  // Check user's world creation quota
  await validateUserQuota(req.user.id, 'worlds');
  
  // Initialize world with default story structure
  const world = await worldService.createWorld(req.user.id, validatedData);
  
  // ...rest of implementation
};
```

### Service Layer

```typescript
/**
 * Processes story events and advances narrative arcs using AI.
 * Coordinates between event validation, AI story generation, and database updates.
 *
 * @param {string} worldId - The world where the event occurs
 * @param {StoryEvent} event - The event data to process
 * @returns {Promise<Beat>} The generated story beat
 * @throws {AIServiceError} If story generation fails
 */
export const progressStory = async (worldId: string, event: StoryEvent): Promise<Beat> => {
  const logger = createLogger('world.service');
  
  // Validate event data against world rules
  await validateEvent(worldId, event);
  
  // Generate story progression using AI
  const aiResponse = await aiService.generateStoryBeat(prompt);
  
  // Persist new beat to database with transaction
  const beat = await db.transaction(async (tx) => {
    const newBeat = await createBeat(tx, worldId, aiResponse);
    await updateArcProgress(tx, worldId, newBeat.arcId);
    return newBeat;
  });
  
  // Emit domain event for other modules
  eventBus.emit('world.beatCreated', { worldId, beatId: beat.id });
  
  return beat;
};
```

### Repository Layer

```typescript
/**
 * Retrieves world data with associated story arcs and characters.
 * Uses optimized Supabase query with joins to minimize database round trips.
 *
 * @param {string} worldId - ID of the world to retrieve
 * @param {string} userId - ID of the requesting user for authorization
 * @returns {Promise<WorldWithRelations>} Complete world data
 * @throws {NotFoundError} If world doesn't exist
 */
export const getWorldById = async (worldId: string, userId: string): Promise<WorldWithRelations> => {
  const { data, error } = await supabase
    .from('worlds')
    .select(`*, arcs:story_arcs(*), characters(*)`)
    .eq('id', worldId)
    .eq('user_id', userId) // RLS policy enforcement
    .single();
    
  if (error) throw new DatabaseError(`Failed to fetch world: ${error.message}`);
  if (!data) throw new NotFoundError(`World ${worldId} not found`);
  
  return data;
};
```

### React Components

```typescript
/**
 * Main dashboard displaying user's worlds and story management interface.
 * Handles world selection, creation flows, and real-time story updates.
 */
export const Dashboard = (): JSX.Element => {
  const { worlds, loading, error, refetch } = useWorlds();
  const { createWorld } = useWorldActions();
  
  // Handle world creation with optimistic updates
  const handleCreateWorld = useCallback(async (worldData: CreateWorldData) => {
    await createWorld(worldData);
    await refetch(); // Refresh worlds list
  }, [createWorld, refetch]);
  
  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorBoundary error={error} onRetry={refetch} />;
  
  return (
    <div className="dashboard">
      <DashboardHeader onCreateWorld={handleCreateWorld} />
      <WorldGrid worlds={worlds} />
    </div>
  );
};
```

### Custom Hooks

```typescript
/**
 * Manages story progression state and real-time updates.
 * Provides methods for event submission and listens for story beat updates.
 *
 * @param {string} worldId - ID of the active world
 * @returns {object} Story state and action methods
 */
export const useStoryProgression = (worldId: string) => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isProgressing, setIsProgressing] = useState(false);
  
  // Subscribe to real-time beat updates via Supabase
  useEffect(() => {
    const subscription = supabase
      .channel(`world-${worldId}`)
      .on('postgres_changes', { event: 'INSERT', table: 'story_beats' }, 
        (payload) => setBeats(prev => [...prev, payload.new as Beat]))
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [worldId]);
  
  // Submit new story event for processing
  const submitEvent = useCallback(async (event: StoryEvent) => {
    setIsProgressing(true);
    try {
      await fetch(`/api/worlds/${worldId}/events`, {
        method: 'POST',
        body: JSON.stringify(event)
      });
    } finally {
      setIsProgressing(false);
    }
  }, [worldId]);
  
  return { beats, isProgressing, submitEvent };
};
```

### AI Integration

```typescript
/**
 * Builds a structured prompt for AI story generation.
 * Combines world context, character information, and story events into a coherent prompt.
 *
 * @param {WorldContext} context - Current world state and story context
 * @param {StoryEvent} event - The triggering event for story progression
 * @returns {AIPrompt} Structured prompt object for AI consumption
 */
export const buildStoryPrompt = (context: WorldContext, event: StoryEvent): AIPrompt => {
  // Build character context section
  const characterContext = context.characters
    .map(char => `${char.name}: ${char.description}`)
    .join('\n');
  
  // Construct the main prompt with clear sections
  return {
    system: `You are a master storyteller in the ${context.world.genre} genre.`,
    user: `Event: ${event.description}\nGenerate the next story beat.`,
    functions: [{ name: 'create_story_beat', /* tool definition */ }],
    estimatedTokens: estimateTokenCount(context, event)
  };
};
```

### Module Registration

```typescript
/**
 * World module - manages story worlds, narrative progression, and AI integration.
 * Provides core story engine functionality with event-driven architecture.
 *
 * @param {Express} app - Express application instance
 * @param {Container} di - Dependency injection container
 */
export const register = (app: Express, di: Container): void => {
  const logger = createLogger('world.module');
  
  // Register module services in DI container
  di.register('WorldService', { useClass: WorldService });
  di.register('WorldRepository', { useClass: WorldRepository });
  
  // Mount module routes with authentication middleware
  app.use('/api/worlds', authMiddleware, worldRoutes);
  
  // Register domain event handlers
  eventBus.on('user.created', handleUserCreated);
  eventBus.on('world.eventLogged', handleEventLogged);
  
  logger.success('World module initialized successfully');
};
```

### Event Handlers

```typescript
/**
 * Handles world.eventLogged events to trigger story progression.
 * Processes user events and generates corresponding story beats.
 *
 * @param {WorldEventPayload} payload - Event data containing world and event details
 */
export const handleEventLogged = async (payload: WorldEventPayload): Promise<void> => {
  const { worldId, event, userId } = payload;
  
  // Validate user permissions for this world
  await validateWorldAccess(worldId, userId);
  
  // Process event and generate story progression
  const beat = await worldService.progressStory(worldId, event);
  
  // Emit completion event for other modules
  eventBus.emit('world.beatCreated', { worldId, beatId: beat.id });
};
```

### State Management (Zustand)

```typescript
/**
 * Authentication store managing user session and auth state.
 * Provides login/logout actions and persistent session management.
 */
export const useAuthStore = create<AuthStore>()(
  persist((set, get) => ({
    user: null,
    isAuthenticated: false,
    
    /**
     * Logs in a user with email and password.
     * Updates store state and handles authentication errors.
     *
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @throws {AuthError} If login credentials are invalid
     */
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      set({ user: data.user, isAuthenticated: true });
    },
    
    logout: async () => {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    }
  }), { name: 'auth-store' })
);
``` 