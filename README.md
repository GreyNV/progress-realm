# progress-realm
### Game Design Document – v0.7.0

#### 1. Game Title (Working)

> Progress Realm

#### 2. High-Level Concept

A progression and resource management game inspired by Progress Knight and Theory of Magic: Arcanum. Players assign limited action slots to repeatable tasks that consume resources and grant stat growth or magical benefits. The core loop involves efficiency optimization, task automation, and progression toward mastery.

In this prototype you awaken in the body of a 16‑year‑old after bandits ambush your family's caravan. A stranger rescues you from the wreckage and brings you to a small town to recover. With everyone else lost, your early routines involve rebuilding strength and earning coin in this medieval setting.

This release (v0.1.0) introduces automatic saving and loading of progress via localStorage.
It also adds a drag-and-drop task system with tooltips and simple completion animations.

Version 0.2.0 introduced a leveled action system with per-second yields and resource blocking.
Version 0.3.0 expands the prototype with six starting action slots, an introductory story modal, and a simple log panel.
Version 0.4.0 adds weighted random encounters with durations and loot chances influenced by your stats.
Version 0.5.0 redesigns the Adventure tab with a single slot. Encounter level now increases after ten consecutive successes.
Version 0.6.0 introduces an Inventory tab and item generator to track loot from encounters.
Version 0.7.0 adds level-gated encounters ranging from common to legendary tiers with new item rewards.
Version 0.9.0 adds story encounters that trigger once at specific location levels. The first, Bandits Ambush, grants a gem and an iron sword.
Version 0.13.0 introduces an Autoprogress checkbox to pause encounter level ups.
Version 0.14.0 lets Bandits Ambush return with a very low chance and drops items defined in the data files.
Version 0.16.0 separates delta calculations into a new engine module with speed multipliers.
Version 0.17.0 moves aging and experience generation into DeltaEngine so all progression scales with game speed.
Version 0.18.0 ties encounter progress to DeltaEngine so adventure speed follows game time.
Version 0.19.0 introduces a Bonus Engine that applies additive and multiplicative modifiers before deltas update stats and resources. It now supports exponent bonuses for stats and cost divisors for resource consumption.

#### 3. Core Gameplay Loop

* Player assigns actions to limited slots
* Actions consume time, energy, and resources
* Tasks improve stats, unlock new actions, or produce magical items
* Player can automate repeatable tasks
* New slots and actions unlock over time
* Resources can be replenished or crafted
* Optional prestige/reset layer for long-term scaling

#### 4. Key Modules

| Module       | Description                                                                |
| ------------ | -------------------------------------------------------------------------- |
| Stats        | Tracks numeric values like Strength, Intelligence, Charisma, etc.          |
| Tasks        | Defines repeatable actions, their costs, outputs, and execution logic      |
| Time System  | Governs tick-based or interval-based progression                           |
| Task Slots   | Limited number of concurrent tasks; unlockable and upgradable              |
| Resources    | Consumables needed to perform actions; includes magical and physical types |
| Magic System | Simplified crafting and consumption system for magical items               |
| Inventory    | Manages player's resource quantities and magical components                |
| Automation   | Enables actions to loop with or without conditions |
| Bonus Engine | Centralizes additive, multiplicative, and exponential bonuses for stats and resources, including cost divisors |
| Engine       | Calculates deltas with multipliers and drives the main tick loop |
| UI           | Interface for selecting tasks, viewing stats/resources, and managing slots |
| Character Background | Updates left panel image based on equipped items, including a pose for full gear (leather armor, wooden shield, iron sword, gem) |

#### 5. Core Stats (Initial Set)

* Strength
* Intelligence
* Wisdom *(initially locked; unlocked via milestone actions as a reward)*
* Charisma
* Endurance
* Energy (resource)
* Health (resource)
* Money (resource)

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

* Player begins with **six** action slots
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

#### 11. Project Structure

The repository now contains a minimal HTML/CSS/JS setup with data files and static assets:

```
index.html          - main HTML entry point
css/styles.css      - page styling
js/main.js          - core game logic
assets/             - images and static assets
data/actions.json   - action definitions
docs/MVP.md         - checklist for the first prototype
```

#### Prototype Layout

The page uses a simple header/main/footer structure. Stats and resources are kept in a left sidebar, routine controls sit in the center, and a log panel occupies the right side. The header shows the current age and provides buttons to adjust the game speed.
A story modal appears once on the first load and another short scene triggers after thirty days pass in game time. Both modals only appear during the first life and all log messages are recorded in a scrollable container (about 300&nbsp;px high) in the right panel. Habits are quick actions found below the routines for instant resource gains. Routines themselves are triggered by clicking their progress bars; hovering shows the cost and effect.

See **docs/MVP.md** for the MVP list.

#### Image Pipeline

The project includes small helper scripts to auto-generate missing images using
OpenAI's DALL·E API:

- `scripts/image_pipeline.py` for items
- `scripts/image_pipeline_encounters.py` for encounters
- `scripts/image_pipeline_actions.py` for actions

Each script reads its respective JSON file, creates a prompt and stores the
resulting image in `assets/generated/` before updating the JSON entry.
Run the scripts only after setting the `OPENAI_API_KEY` environment variable and
ensure the `openai` Python package version 1.x is installed.

#### 12. Future Extensions

* Prestige system with meta-upgrades
* Spell research tree
* Dynamic events or time-limited quests
* Mastery points earned from action tiers
* Player avatar or magical tower interface (for immersion)

---

Next step: expand automation and prestige mechanics.
