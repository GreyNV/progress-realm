# Refactoring Task: Modularization

This document outlines the steps required to modularize the JavaScript code for the Progress Realm prototype.

## Goals
- Separate major game systems into distinct files for maintainability.
- Keep the global state in a dedicated module.
- Ensure UI logic is isolated from core gameplay logic.

## Planned Modules
1. **state.js** – defines the `State` object and initialization helpers.
2. **ui.js** – handles `StatsUI`, `ResourcesUI`, `MasteryUI`, and logging.
3. **actions.js** – manages action loading and experience scaling.
4. **engine.js** – contains the main game loop and tick handlers.
5. **encounter.js** – remains as the adventure/encounter system.

## Migration Steps
1. Create the new module files and move corresponding objects from `main.js`.
2. Update `index.html` to load each module in order.
3. Replace direct references with imports or global variables as needed.
4. Confirm existing tests still pass and add new ones for separated modules.

This incremental approach will gradually reduce the size of `main.js` and clarify each subsystem.

### Progress
As of version 0.6.0, `items.js` and parts of `ui.js` have been extracted from `main.js` to manage item generation and inventory. The planned `state.js` and `engine.js` modules are still pending.
