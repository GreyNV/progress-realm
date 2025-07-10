# Refactoring Task: Modularization

This document outlines the steps required to modularize the JavaScript code for the Progress Realm prototype.

## Goals
- Separate major game systems into distinct files for maintainability.
- Keep the global state in a dedicated module.
- Ensure UI logic is isolated from core gameplay logic.

## Planned Modules
1. **state.js** – defines the `State` object and initialization helpers.
2. **ui.js** – handles `StatsUI`, `ResourcesUI`, `MasteryUI`, and logging.
3. **ui_handler.js** – builds stat, resource, and tab sections from JSON before handing control to the UI modules.
4. **actions.js** – manages action loading and experience scaling.
5. **engine.js** – contains the main game loop and tick handlers.
6. **encounter.js** – remains as the adventure/encounter system.

## Migration Steps
1. Create the new module files and move corresponding objects from `main.js`.
2. Update `index.html` to load each module in order.
3. Replace direct references with imports or global variables as needed.
4. Confirm existing tests still pass and add new ones for separated modules.

This incremental approach will gradually reduce the size of `main.js` and clarify each subsystem.

### Progress
As of version 0.17.0, the `engine.js` module also manages aging and experience generation. `DeltaEngine` computes per-second changes for stats, resources, age and action experience, applying them with a multiplier so game speed modifiers can adjust progression. Version 0.18.0 extends this system to encounter progress so all time based systems share a single timing engine. Version 0.20.0 introduces a dedicated `state.js` module that defines the global `State` object and helper functions. Version 0.19.0 introduces a `bonus.js` module that centralizes additive, multiplicative and exponential modifiers for stats and resources and allows cost divisors for consumptions.
Version 0.41.64 switches action and adventure slot creation to the reusable `BaseSlot` class and emits a `home:changed` event when selecting a dwelling.

## Version 0.41.64 Changes

### Files Updated
- **AGENTS.md** – new architecture and dependency guidelines for contributors.
- **data/AGENTS.md** – instructions for data files and image usage.
- **docs/AGENTS.md** – changelog and documentation update policy.
- **docs/refactoring_task.md** – this progress note and new module breakdown.
- **README.md** – installation steps via `requirements.txt` and summary of recent structural improvements.
- **requirements.txt** – added to track Python dependencies.

### Refactored/Introduced Modules
- `js/age_system.js` – emits `age:advanced` and `age:maxReached` events.
- `js/save_system.js` – handles saving, loading and prestige actions.
- `js/soft_cap.js` – calculates soft caps for stats and resources.
- `js/tab_manager.js` – toggles tab and section visibility.
- `js/story_core.js` – helper functions for modals and dark mode.
- `js/home.js`, `js/furniture.js`, `js/research.js` – each split into logic and dedicated `*UI` objects.
- `js/ui/inventory.js` – dedicated inventory renderer moved from `ui.js`.
- `js/utils.js` – new `formatCost` function.
- `js/main.js` – trimmed down to orchestrate the new modules.
- `index.html` – loads all new scripts in order.

### Removed or Replaced
- Inline `formatCost` helpers deleted from home and furniture modules.
- `InventoryUI` removed from `ui.js` and placed into its own file.
- Large managers extracted from `main.js` reducing file size by over 400 lines.

### Design Updates
- Modular system for core managers and UI components.
- PubSub events power age progression and furniture decay.
- Chip tab locked until the bandits ambush is completed.

### Dependencies
- Python packages now installed with `pip install -r requirements.txt`.

### Tests Updated
- `tests/test_age_system.py` – validates age event names.
- `tests/test_format_cost.py` – ensures use of the new `Utils.formatCost`.
- `tests/test_prestige.py` – references `save_system.js` for prestige logic.

## Vue Migration Plan

The next major refactoring step is migrating all UI logic to Vue.

1. **Setup** – Add a Vite-powered Vue project under `vue-ui/`.
   - Configure stable build output (`index.js` and `assets/index.css`).
   - Build files referenced from `index.html`.
2. **State Store** – Wrap the existing `State` object with a simple store so
   components react to changes. Pinia can replace this later.
3. **Component Conversion** – Rewrite UI modules starting with the inventory
   grid. Each legacy section will become a Vue component.
4. **Event Wiring** – Replace manual DOM updates with Vue reactivity and
   `PubSub` events where appropriate.
5. **Removal Phase** – After all screens are ported, delete the old DOM
   manipulation scripts.

The repository now includes the base Vue setup and an `InventoryGrid` component
mounted in the inventory tab. Future tasks should continue converting remaining
UI sections following this approach.
