import { container } from 'tsyringe';
import { eventBus } from './eventBus';

// Register the eventBus as a singleton in the DI container
container.registerInstance('eventBus', eventBus);