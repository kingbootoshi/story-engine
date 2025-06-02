# Contributing to World Story Engine

Thank you for your interest in contributing to the World Story Engine! This guide will help you get started.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Process](#development-process)
3. [Code Standards](#code-standards)
4. [Testing Guidelines](#testing-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Architecture Decisions](#architecture-decisions)
7. [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 20.x or higher
- Git
- A GitHub account
- Basic knowledge of TypeScript
- Understanding of RESTful APIs

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/world-story-engine.git
   cd world-story-engine
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/world-story-engine.git
   git fetch upstream
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Run tests**
   ```bash
   npm test
   ```

6. **Start development servers**
   ```bash
   npm run dev:debug  # Runs with debug logging
   ```

## Development Process

### 1. Find or Create an Issue

- Check existing issues for something to work on
- If you have a new idea, create an issue first
- Wait for maintainer feedback before starting major work

### 2. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Your Changes

Follow our code standards and ensure:
- All tests pass
- New code has tests
- Documentation is updated
- Commit messages are clear

### 4. Submit a Pull Request

Push your changes and create a PR against the upstream main branch.

## Code Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types, clear naming
interface WorldCreationParams {
  name: string;
  description: string;
  metadata?: Record<string, unknown>;
}

async function createWorld(params: WorldCreationParams): Promise<World> {
  // Implementation
}

// ❌ Bad: Implicit any, unclear types
async function createWorld(params) {
  // Implementation
}
```

### File Organization

```
src/
├── backend/
│   ├── api/          # API routes and middleware
│   ├── services/     # Business logic
│   ├── utils/        # Shared utilities
│   └── types/        # TypeScript type definitions
├── frontend/
│   ├── components/   # UI components
│   ├── api/          # API client
│   └── utils/        # Frontend utilities
```

### Naming Conventions

- **Files**: `camelCase.ts` (e.g., `worldArc.service.ts`)
- **Classes**: `PascalCase` (e.g., `WorldArcService`)
- **Functions**: `camelCase` (e.g., `createNewArc`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_BEATS`)
- **Interfaces**: `PascalCase` (e.g., `WorldBeat`)

### Code Style

We use ESLint and Prettier for code formatting:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
```

### Logging Standards

Always use the centralized logger:

```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('module-name');

// Use appropriate log levels
logger.debug('Detailed information', { data });
logger.info('General information', { userId });
logger.warn('Warning condition', { issue });
logger.error('Error occurred', error, { context });

// Use specialized methods
logger.logAICall('operation', 'model', input, output);
logger.logDBOperation('INSERT', 'table', data, result);
logger.logAPICall('POST', '/endpoint', body, response);
```

### Error Handling

```typescript
// ✅ Good: Specific error handling with logging
try {
  const result = await riskyOperation();
  logger.info('Operation succeeded', { result });
  return result;
} catch (error) {
  logger.error('Operation failed', error, { context });
  
  if (error instanceof ValidationError) {
    throw new ApiError('Invalid input provided', 400);
  }
  
  throw new ApiError('Internal server error', 500);
}

// ❌ Bad: Generic catch without context
try {
  return await riskyOperation();
} catch (error) {
  throw error;
}
```

### AI Service Guidelines

When working with AI generation:

1. **Always use function calling** for structured output
2. **Define strict schemas** with all required fields
3. **Include comprehensive logging** for debugging
4. **Handle edge cases** (no response, malformed JSON)
5. **Implement retry logic** for transient failures

Example schema:
```typescript
const GENERATION_SCHEMA = {
  type: "function",
  function: {
    name: "generate_content",
    description: "Clear description of what this generates",
    parameters: {
      type: "object",
      properties: {
        // Define all fields with descriptions
      },
      required: ["all", "required", "fields"],
      additionalProperties: false
    },
    strict: true  // Always use strict mode
  }
};
```

## Testing Guidelines

### Test Structure

```typescript
describe('WorldArcService', () => {
  describe('createNewArc', () => {
    it('should create arc with valid parameters', async () => {
      // Arrange
      const params = { /* test data */ };
      
      // Act
      const result = await service.createNewArc(params);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.arc.story_name).toBe(expected);
    });
    
    it('should handle AI service errors gracefully', async () => {
      // Test error scenarios
    });
  });
});
```

### Testing Best Practices

1. **Unit Tests**: Test individual functions/methods
2. **Integration Tests**: Test service interactions
3. **API Tests**: Test endpoint behavior
4. **Mock External Services**: Don't call real APIs in tests

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:api         # API tests only
```

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up-to-date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional context
```

### Review Process

1. **Automated Checks**: CI runs tests and linting
2. **Code Review**: Maintainer reviews code
3. **Testing**: Changes tested in development
4. **Merge**: Squash and merge to main

## Architecture Decisions

### When to Add New Services

Create a new service when:
- Functionality is distinct and reusable
- It encapsulates external integrations
- It has clear boundaries and responsibilities

### Database Schema Changes

1. Update `supabase/schema.sql`
2. Create migration file
3. Test migration locally
4. Document changes in PR

### API Design Principles

- RESTful conventions
- Consistent error responses
- Versioning strategy (future)
- Clear documentation

### Performance Considerations

- Implement caching where appropriate
- Use database indexes
- Optimize AI token usage
- Monitor response times

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the project goals

### Getting Help

- **Discord**: [Join our server](https://discord.gg/worldstory)
- **Issues**: Use GitHub issues for bugs/features
- **Discussions**: Use GitHub discussions for questions

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project documentation

## Specific Contribution Areas

### Frontend Improvements
- UI/UX enhancements
- Accessibility features
- Mobile responsiveness
- Performance optimizations

### Backend Features
- New API endpoints
- Service improvements
- Database optimizations
- Security enhancements

### AI/Narrative System
- Prompt engineering
- New narrative structures
- Beat generation improvements
- Event impact algorithms

### Documentation
- API documentation
- Tutorials and guides
- Code examples
- Architecture diagrams

### DevOps/Infrastructure
- CI/CD improvements
- Deployment scripts
- Monitoring setup
- Performance testing

## Resources

### Learning Resources
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

### Project-Specific Resources
- [Narrative Design Guide](./narrative-design.md)
- [API Reference](./api-reference.md)
- [Architecture Overview](./architecture.md)

## Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Ask in discussions
4. Create a new issue

Thank you for contributing to World Story Engine!