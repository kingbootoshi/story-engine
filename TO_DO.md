1. create the characters module 
    q: are players also characters?
    a: i think players are also characters. we should put them under the same
    category because characters should be able to have dialog with eachother.
    just like players can have dialog with characters.
    characters should be able to do actions
    just like players can also do actions
    to shape the game narrative

probably important to do in the future:
- ensure proper error handling and fallback for AI core and ALL AI calls

# modules to do:

## worlds
- ensure that world beat is the only event that locations/factions/characters react to
- every single module should only react to world.beat event, nothing else
- each entity in location, each faction, and each character have their own individual AI that
reacts indepdently based on the world beat. default "no change" and change

(that ensures that the golden rule stays simple and complexity doesn't happen dev side)

## locations
- ~~NO monolithic AI gens. locations should be genned 1 by one, first by region, then wilderness, then landmarks (cities, dungeons etc)~~ (DONE)

## factions
- ~~on world creation, factions should be generated after locations done~~ (DONE)

## characters
- on world creation, characters should be generated after factions
- characters can be a part of factions but also have no factions

## misc
- i want to have a world map that gets created especially since we provide the x/y coordinates of locations 