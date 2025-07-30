# progress-realm
### Game Design Document – v0.7.0

#### 1. Game Title

> Progress Realm

#### 2. High-Level Concept

A progression and resource management game inspired by Progress Knight and Theory of Magic: Arcanum. Players assign limited action slots to repeatable tasks that consume resources and grant stat growth or magical benefits. The core loop involves efficiency optimization, task automation, and progression toward mastery. The interface now supports an in-game switch between English and Ukrainian, translating stats, resources, story text, log entries, and the latest items and encounters.

In this prototype you awaken in the body of a 16‑year‑old after bandits ambush your family's caravan. A stranger rescues you from the wreckage and brings you to a small town to recover. With everyone else lost, your early routines involve rebuilding strength and earning coin in this medieval setting.

#### 3. Core Gameplay Loop

* Player assigns actions to limited slots
* Actions consume time, energy, and resources
* Tasks improve stats, unlock new actions, or produce magical items
* Player can automate repeatable tasks
* New slots and actions unlock over time
* Resources can be replenished or crafted
* Research progress persists across page reloads and prestiges
* Unlocked actions remain available after reloads and prestiges
* Optional prestige/reset layer for long-term scaling
* Prestige triggers when age exceeds the max and converts current stats into
  prestige points
* Prestige points boost future stat gains and raise stat caps while preserving
  action levels. Encounter progress resets to level 1 while your action slots
  remain filled
* Prestige currencies **Constitution** and **Wisdom** replace Strength and
  Intelligence in the prestige layer. Potential prestige gains are displayed in
  the UI before resetting

#### 4. Key Modules

| Module       | Description                                                                |
| ------------ | -------------------------------------------------------------------------- |
| Stats        | Tracks numeric values like Strength and Intelligence via `StatSystem` (additional stats unlock later) |
| State        | Holds persistent game data and initialization helpers |
| Tasks        | Defines repeatable actions, their costs, outputs, and execution logic      |
| Time System  | Governs tick-based or interval-based progression                           |
| Task Slots   | Limited number of concurrent tasks; unlockable and upgradable              |
| Resources    | Consumables needed to perform actions; managed separately by `ResourceSystem` |
| Magic System | Simplified crafting and consumption system for magical items               |
| Belongings   | Manages player's resource quantities, home selection, and magical components                |
| Chips        | One-time unlockables that grant bonuses or new content |
| Story System | Loads narrative events from `data/story_events.json` and triggers modals with unlocks |
| Automation   | Enables actions to loop with or without conditions |
| Bonus Engine | Centralizes additive, multiplicative, and exponential bonuses for stats and resources, including cost divisors |
| PubSub       | Lightweight event bus so modules can publish and subscribe to messages. Unlockables and modals broadcast events via `unlock:*` and `modal:*` channels. Items notify `item:added` and `item:consumed` when inventory changes |
| Engine       | Calculates deltas with multipliers and drives the main tick loop |
| UI           | Interface for selecting tasks, viewing stats/resources, and managing slots. Includes a settings panel with dark mode and language options |
| UI Handler   | Dynamically builds stat/resource lists and tab layout from JSON definitions |
| Character Background | Updates left panel image based on equipped items, including a pose for full gear (leather armor, wooden shield, iron sword, gem) |

#### 5. Core Stats (Initial Set)

* Strength
* Intelligence
* Wisdom *(initially locked; unlocked via milestone actions as a reward)*
* Charisma
* Endurance
* Energy (resource)
* Health (resource)

#### 6. Magic System Overview

* Magical items are **consumable**, not permanent; when produced, they apply a passive boost effect for a limited duration. The boost's effect and length are calculated based on the item's type and crafting parameters, and expire automatically without player intervention.
* Resources like Crystal Dust, Scroll Fragments, or Mana Cores are required
* Items improve tasks but are **replaceable**
* Crafting system is streamlined (no inventory micro-management)

#### 7. Example Tasks

| Task Name    | Cost                      | Duration | Output                             |
| ------------ | ------------------------- | -------- | ---------------------------------- |
| Study Glyphs | 1x Crystal Dust, 5 Energy | 10s      | +0.2 INT, +0.1 WIS                 |
| Forge Charm  | 2x Iron Ore, 1x Mana Core | 30s      | +1 Charm (buff, 10 min duration)   |
| Meditate     | 3 Energy                  | 5s       | +0.1 WIS, regain 1 Energy per tick |

#### 8. Slot System

* Player begins with **one** action slot
* Additional slots may be added dynamically
* Actions are blocked if resources are insufficient

#### 9. Visual Style

* Clean, minimalist interface (think Progress Knight)
* Progress bars, toggles, and simple iconography
* Text-based feedback with optional enhancements (sound, tooltip flavor text)

#### 10. Tech Stack

* HTML, CSS, JavaScript
* Optional: Vue or Svelte for structure
* Save system via localStorage (later: IndexedDB)
* Simple client-side Logger toggled through `Logger.enabled`

#### 11. Project Structure

The repository now contains a minimal HTML/CSS/JS setup with data files and static assets:

```
index.html          - main HTML entry point
css/styles.css      - page styling
js/main.js          - core game logic
js/state.js         - global state and helper functions
assets/             - images and static assets
data/actions.json   - action definitions
data/resources.json - base stats and resources
data/ui.json        - tab and section layout (sections can be hidden or locked)
docs/MVP.md         - checklist for the first prototype
```

#### Recent Structural Improvements (v0.41.64)

* Core managers (`age_system`, `save_system`, `soft_cap`, `tab_manager` and `story_core`) moved out of `main.js` into standalone modules.
* Home, Furniture and Research systems now expose separate `*UI` objects, isolating display logic from data handling.
* InventoryUI lives in `js/ui/inventory.js` and UI guidelines are documented in `AGENTS.md`.
* `requirements.txt` lists Python packages used by helper scripts and tests.


#### Module Responsibilities

- `logger.js` - toggled console logging for debugging
- `utils.js` - common helper functions
- `pubsub.js` - lightweight event bus
- `bonus.js` - stat and resource multipliers
- `state.js` - global state and helper methods
- `save_system.js` - persist and restore game data
- `age_system.js` - updates age and publishes events
- `soft_cap.js` - calculates soft caps from items
- `tab_manager.js` - internal tab helper
- `ui/tab_container.js` - initializes tab layout and translation
- `ui/section_component.js` - handles collapsible sections
- `engine.js` - computes per-tick stat/resource changes
- `action_engine.js` - advances active actions
- `adventure_engine.js` - resolves encounters
- `slotSetup.js` - creates task and adventure slots
- `ui_handler.js` - builds UI layout from JSON
- `ui.js` - renders stats, resources and other panels
- `story.js` - loads story events from data
- `story_core.js` - shared story helpers and settings
- `tooltipHandler.js` - global tooltip support
#### Prototype Layout

The page uses a header/main/footer structure with tab navigation fixed at the bottom on mobile screens. Stats and resources remain in a left sidebar, routine controls and other tabs sit in the center, and a log panel occupies the right side. Each tab contains named sections that can collapse for clarity.

Resources appear as horizontal bars whose colors match each type (red for health, yellow for energy, blue for focus).

Story modals are defined in `data/story_events.json` and triggered by the `StorySystem`. The intro plays once on first load while another short scene fires after thirty days pass in game time. All modals only appear during the first life and log messages are recorded in a scrollable container (about 300&nbsp;px high) in the right panel. Habits are quick actions found below the routines for instant resource gains. Routines themselves are triggered by clicking their progress bars; hovering shows the cost and effect. The adventure tab now displays a second progress bar beneath the location name showing how many encounters remain before the next level. The Belongings tab includes a filter button to hide items below a chosen rarity. A new Home section now lets you choose a dwelling above the item list. The home slot uses the larger encounter slot formatting to showcase the current home's image, while a Furniture section provides action-style slots that will hold unlockable furniture objects. Homes and furniture now cost items from your inventory instead of generic currency. Purchased furniture has durability that decreases slowly over time; once it reaches zero the you can buy the same item again to repair it. Repair costs scale with the missing durability and new pieces require an empty slot. Durability values were recently increased by one hundred times so furnishings last much longer before breaking. The Chip tab unlocks after you survive the bandits ambush and includes a Research section with one-time upgrades unlocking additional actions. Certain upgrades now replace older encounters with stronger versions once you pay the required item cost.
Each event now includes a `text` field with English narrative used when no translation is available.

See **docs/MVP.md** for the MVP list.

#### Image Pipeline

The project includes small helper scripts to auto-generate missing images using
OpenAI's DALL·E API:

- `scripts/image_pipeline.py` for items
- `scripts/image_pipeline_encounters.py` for encounters
- `scripts/image_pipeline_actions.py` for actions

Each script reads its respective JSON file, creates a prompt and stores the
resulting image in `assets/generated/` before updating the JSON entry.
Install the required Python packages using `pip install -r requirements.txt`
and set the `OPENAI_API_KEY` environment variable before running the scripts.
Dependencies include `openai`, `requests`, and `python-telegram-bot`.

Images used in story events are now loaded lazily in the UI to reduce initial
page weight. Future updates will extend the scripts to automatically resize and
compress generated images so existing assets do not require manual replacement.
See `docs/image_optimization.md` for details.

#### Local Server

Run `scripts/simple_server.py` to launch a small HTTP server for testing the
game locally:

```bash
python scripts/simple_server.py --port 8000
```

Open `http://localhost:8000` in your browser to play without deploying.
Opening `index.html` directly from the filesystem can cause the UI to break
because the game fetches JSON files via AJAX. Always use the server so these
requests succeed. If an alert appears saying resource data could not be loaded,
check that the `/data` folder is accessible on your server.

#### Telegram Upload Bot

For manual asset contributions a small Telegram bot can collect images and
automate pull requests. The bot lists unresolved entries from the data files,
including homes and story events, displaying the entry name or identifier so
missing assets are easy to find. After selecting an entry the bot accepts an
uploaded image, commits the change and opens (or updates) a PR. See
`docs/telegram_upload_bot.md` for a full overview.

#### State Management

All game data lives in the global `State` object. Mutations must go through
helper functions exported from `js/state.js` such as `setState()`,
`updateState()`, and `pushState()`. This ensures a single source of truth and
makes state changes easy to audit.

#### Testing

Run `pytest --cov` to execute the unit tests. Coverage should remain above
80%. Recent tests cover `SaveSystem`, `SoftCapSystem`, and `TabManager` to
ensure reliability of the core modules.

#### 12. Future Extensions

* Prestige system with meta-upgrades
* Spell research tree
* Dynamic events or time-limited quests
* Mastery points earned from action tiers
* Player avatar or magical tower interface (for immersion)
* Evaluate scripting to automatically generate new encounter JSON entries

#### 13. Changelog Updates

All code and documentation changes must be reflected in `CHANGELOG.md`. When
adding notes, update the bullet list under the latest version at the top of the
file rather than creating a new version header. Only introduce a new version
section when an issue or task specifically calls for it. Use dates in
`YYYY-MM-DD` format.

#### 14. DOM Manipulation Rule

Only files within `js/ui/` or the main UI modules (`ui.js`, `ui_handler.js`)
may directly interact with the browser DOM. Game logic modules must publish
events or call UI handlers instead of touching elements themselves.

---

Next step: expand automation and prestige mechanics.
