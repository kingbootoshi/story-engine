# general to do b4 launch

- add smart ai logic and small ai logic

smart models
- [global] handle all initial seeding (locations/factions/characters)
- [story] handle ALL story telling (arc creation, beat progression, arc complete summarization)
- [character] manager picks what characters are affected by beat
- [location] manager picks what locations are affected by beat
- [faction] handle update diplomatic relations affected by beat

small models
- [character] handle all chosen characters reactions to beat (in parallel)
- [location] handle all locations reactions to beat (in parallel)

- CLEAN UP, ensure all modules/adapters have
schemas, tool calls, and types defined and seperate properly

# modules to do:

## worlds

## locations
- implement manager then react agent logic

## factions
- remove the 'listen to location' change event bus 

## characters
- implement manager then react agent logic

## misc
- i want to have a world map that gets created especially since we provide the x/y coordinates of locations 