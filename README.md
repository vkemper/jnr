# JNR ARCADE

A collection of classic-style browser games operated by keyboard.

## Features
- **Super Pixel Jump**: A platformer with levels and collectibles.
- **Midnight Dash**: A high-speed cyberpunk dash game.
- **Neon Racer**: A top-down retro racing game.
- **Sky Force**: A vertical scrolling shooter.
- **Astro Void**: A horizontal scrolling space shooter.
- **Cyber Snake**: A modern take on the classic snake game.
- **Brick Breaker**: A neon-style breakout game.
- **Dungeon Delver**: A top-down dungeon crawler with traps and enemies.
- **Office RPG: Alien Insurance**: A 2D overhead RPG with LLM-powered character dialogs. Investigate an alien infestation in a corporate office.

## Technology
- Pure HTML, CSS, and JavaScript.
- Zero external dependencies (except for optional LLM integration in Office RPG).
- Programmatic 8-bit sound and music synthesis via Web Audio API.
- Custom game engine in `js/engine.js`.
- LLM Integration: Uses Google AI Studio (Gemini) for interactive NPC conversations.

## How to Play
1. Open `index.html` in any modern browser.
2. Use **UP/DOWN/LEFT/RIGHT** arrows to select a game.
3. Press **ENTER** to start.
4. Use **ESC** to return to the menu at any time.
5. In games: Use **ARROWS/WASD** for movement, **SPACE/SHIFT** for actions.
6. In Office RPG: Use **E/SPACE** to interact with characters and **ENTER** to send dialog messages.

## Quest Tracking (Office RPG)
Quests and their completion are tracked in the `OfficeGame` class instance.
- `quests`: An array of quest objects `{ id, description, completed, active }`.
- `completeQuest(id)`: Marks a quest as completed and triggers UI updates.
- `updateQuestLog()`: Dynamically updates the on-screen quest log.
- Progression is often triggered by the NPC dialog system analyzing LLM responses for relevant keywords.
