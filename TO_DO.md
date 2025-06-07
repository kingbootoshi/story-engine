1. ensure that the world module works perfectly w trpc and our frontend
2. create the locations module
3. create the factions module
4. create the characters module 
    q: are players also characters?
    a: i think players are also characters. we should put them under the same
    category because characters should be able to have dialog with eachother.
    just like players can have dialog with characters.
    characters should be able to do actions
    just like players can also do actions
    to shape the game narrative

probably important to do in the future:
- ensure proper error handling and fallback for AI core and ALL AI calls

ULTIMATE SERVICE TO DO:
- we're gonna move all core logic into an event bus so modules can discuss and communicate with each other
- we are going to give each module its own AI agent that handles the data, and receives informaiton from the story module and reacts/updates accordingly. example, the ai agent handling locations updates the map and location details etc.
- seperate the world module so that the story service and the world service are its own thing
[https://chatgpt.com/c/684353fd-2144-8003-aeb2-f607984e6646]


modules to do:
worlds
- make it so arcs have a detailed description explaining the whole point of the arc
- ensure that progerssing beats contains the context of this description
- recent world events need to be formatted nicely