import type { EngineModule } from '../../core/types';
import routes from './backend/world.routes';
import WorldService from './backend/world.service';
import path from 'path';

const WorldModule: EngineModule = {
  name: 'world',
  migrations: [path.join(__dirname, 'backend', 'migrations')],
  register(app, di) {
    di.registerSingleton(WorldService);
    app.use('/api/worlds', routes);
  },
  subscriptions: [
    {
      topic: 'character.died',
      handler: async (event, di) => {
        const worldService = di.resolve(WorldService);
        const { characterId, worldId } = event.payload;
        await worldService.handleCharacterDeath(characterId, worldId);
      }
    }
  ]
};

export default WorldModule;