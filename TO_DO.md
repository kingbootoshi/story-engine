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

## OVERALL:
new world generation flow

1. new world created
2. locations in the world are created
3. factions are created after locations so factions can own locations
4. characters are created after factions so characters can be associated to factions and locations
5. on initial arc generation, we use the info of generated locations/factions/characters to create the story

beat progression flow:
1. ALL actions are added to the world events log
2.. beats progress based on the actions added to the world events log
3. when a beat progresses, locations, factions, and characters ALL individually react to the new beat generation

## worlds

## locations
- i want to have a world map that gets created especially since we provide the x/y coordinates of locations 
- locations should be genned 1 by one, first by region, then wilderness, then landmarks (cities, dungeons etc)

## factions
- 

## characters
- 

