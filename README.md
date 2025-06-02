# World Story Engine

A dynamic world narrative system that creates evolving story arcs for entire game worlds, responding to player actions and system events.

## Overview

The World Story Engine transforms static game worlds into living, breathing narratives that evolve based on collective player actions and system events. Using the Save the Cat narrative structure adapted for world-building, it creates compelling story arcs that affect entire civilizations, ecosystems, and realities.

## Features

- **Dynamic World Arcs**: 15-beat narrative structure adapted for world evolution
- **Sparse Anchor Generation**: Only 3 key story points generated initially, allowing flexibility
- **Real-time Adaptation**: Story beats incorporate actual player actions and world events
- **Narrative Continuity**: Each arc builds on previous world history
- **Event Impact System**: Track and incorporate events of varying impact levels
- **Visual Timeline**: See the progression of your world's story at a glance

## Tech Stack

- **Backend**: Express + TypeScript
- **AI**: OpenRouter (via OpenPipe SDK) for narrative generation
- **Database**: Supabase for persistent storage
- **Frontend**: Vanilla TypeScript with Vite
- **Styling**: Custom CSS with dark/light mode support

## Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `OPENPIPE_API_KEY`: (Optional) OpenPipe key for observability
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. **Set up Supabase database**
   
   Run the schema SQL in your Supabase project:
   ```bash
   # Copy contents of supabase/schema.sql and run in Supabase SQL editor
   ```

5. **Start development servers**
   ```bash
   npm run dev:all
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

### Creating a World

1. Enter a world name and description
2. Click "Create World"
3. The world will be created and automatically loaded

### Starting a Story Arc

1. With a world loaded, optionally enter a story idea
2. Click "Start New Arc"
3. The system will generate 3 anchor points for your world's journey

### Progressing the Story

1. Click "Progress Story" to generate the next beat
2. The system will consider recent events and create appropriate world changes
3. Each beat includes:
   - World state changes
   - Directives for different regions/factions
   - Emergent storylines for players to engage with

### Recording Events

1. Use the event form to record significant happenings
2. Choose event type and impact level
3. These events influence future story beats

## API Endpoints

- `POST /api/worlds` - Create a new world
- `GET /api/worlds/:worldId` - Get world state
- `POST /api/worlds/:worldId/arcs` - Create new arc
- `GET /api/worlds/:worldId/arcs` - List all arcs
- `POST /api/worlds/:worldId/arcs/:arcId/progress` - Generate next beat
- `POST /api/worlds/:worldId/events` - Record world event
- `GET /api/worlds/:worldId/events` - Get recent events

## World Beat Structure

The system uses a 15-beat structure adapted from Save the Cat:

1. **Status Quo** (Beat 0) - Opening anchor
2. **Rising Tensions**
3. **First Tremors**
4. **The Catalyst**
5. **Shock Waves**
6. **Systems Fail**
7. **Power Vacuum**
8. **The Turning Point** (Beat 7) - Midpoint anchor
9. **New Alliances**
10. **Emerging Order**
11. **The Struggle**
12. **Final Conflict**
13. **The Synthesis**
14. **New Dawn**
15. **Future Seeds** (Beat 14) - Final anchor

## Architecture

The system uses a sparse generation strategy:
- Only 3 anchor points are generated initially
- Dynamic beats are created as needed, incorporating real events
- This allows maximum flexibility while maintaining narrative coherence

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT