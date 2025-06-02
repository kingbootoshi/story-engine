# World Story Engine Documentation Index

## 📚 Documentation Overview

The World Story Engine creates dynamic, evolving narratives for game worlds that respond to player actions and system events. This documentation covers everything from high-level concepts to detailed implementation guides.

### Quick Navigation

| Document | Description | For |
|----------|-------------|-----|
| [System Overview](./system-overview.md) | High-level system architecture and concepts | Everyone |
| [Narrative Design](./narrative-design.md) | How stories evolve and narrative structure | Game Designers |
| [Developer Guide](./developer-guide.md) | Setup, configuration, and development | Developers |
| [API Reference](./api-reference.md) | Complete API endpoint documentation | Backend Developers |
| [Architecture](./architecture.md) | Technical architecture and design decisions | Architects |
| [Contributing](./contributing.md) | How to contribute to the project | Contributors |

## 🎯 Start Here

### For Game Designers
1. Read the [System Overview](./system-overview.md) to understand capabilities
2. Study [Narrative Design](./narrative-design.md) for story structure
3. Review example arcs and best practices

### For Developers
1. Follow the [Developer Guide](./developer-guide.md) for setup
2. Reference the [API Documentation](./api-reference.md)
3. Understand the [Architecture](./architecture.md)

### For Contributors
1. Read [Contributing Guidelines](./contributing.md)
2. Check open issues on GitHub
3. Join our Discord community

## 🔑 Key Concepts

### World Arcs
15-beat narrative structures that define major world transformations. Based on the Save the Cat framework adapted for world-building.

### Story Beats
Individual narrative moments within an arc:
- **Anchor Beats**: Pre-generated key points (0, 7, 14)
- **Dynamic Beats**: Generated based on player actions

### World Events
Player actions and system events that influence narrative:
- Minor: Local effects
- Moderate: Regional impact
- Major: World-changing
- Catastrophic: Reality-altering

### Narrative Continuity
Each arc builds on previous world history, creating a living, breathing narrative that evolves over time.

## 🛠 Technical Stack

- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenRouter (OpenAI models) with function calling
- **Database**: PostgreSQL (Supabase)
- **Frontend**: Vanilla TypeScript with Vite
- **Logging**: Winston with custom formatters
- **Testing**: Jest (planned)

## 📊 System Capabilities

- **Dynamic Story Generation**: AI creates contextual story beats
- **Player Action Integration**: Events influence narrative direction
- **Structured Output**: Function calling ensures consistent JSON
- **Scalable Architecture**: Designed for production use
- **Comprehensive Logging**: Full observability and debugging

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/world-story-engine.git

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run development servers
npm run dev:all
```

## 📝 Example Use Cases

### Fantasy RPG
Track the rise and fall of kingdoms, magical discoveries, and world-shaking events that affect all players.

### Sci-Fi MMO
Manage galactic conflicts, technological breakthroughs, and the discovery of new civilizations.

### Post-Apocalyptic Survival
Chronicle the rebuilding of civilization, faction wars, and environmental recovery.

### Historical Strategy
Simulate alternative histories where player actions reshape the course of nations.

## 🤝 Community

- **GitHub**: [Issues](https://github.com/yourusername/world-story-engine/issues) and [Discussions](https://github.com/yourusername/world-story-engine/discussions)
- **Discord**: Join our server for real-time help
- **Twitter**: Follow @WorldStoryEngine for updates

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🙏 Acknowledgments

- Blake Snyder for the Save the Cat structure
- The OpenAI team for powerful language models
- Supabase for excellent database infrastructure
- Our contributors and community

---

*Last updated: January 2024*