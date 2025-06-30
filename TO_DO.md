# general to do b4 launch

1. add smart ai logic and small ai logic

smart models
- [global] handle all initial seeding (locations/factions/characters)
- [story] handle ALL story telling (arc creation, beat progression, arc complete summarization)
- [character] manager picks what characters are affected by beat
- [location] manager picks what locations are affected by beat
- [faction] handle update diplomatic relations affected by beat

small models
- [character] handle all chosen characters reactions to beat (in parallel)
- [location] handle all locations reactions to beat (in parallel)

2. instead of generating all AI stuff instantly on world gen,
let the user:

a. gen with AI (then trigger existing pipeline, ensure page knows its happening)
b. add entities manually (with the option of ai assistance for fast gens)

3. add full details of locations/factions/characters to the world view

4. allow people to fully add/delete/edit entities from the front end

# modules to do:

## worlds

## locations
- implement manager then react agent logic

## factions

## characters
- implement manager then react agent logic

## misc (NOT important rn)
- i want to have a world map that gets created especially since we provide the x/y coordinates of locations 