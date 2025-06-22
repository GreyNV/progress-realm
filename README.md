# progress-realm
### Game Design Document – v0.3.0

#### 1. Game Title (Working)

> Progress Realm

#### 2. High-Level Concept

A progression and resource management game inspired by Progress Knight and Theory of Magic: Arcanum. Players assign limited action slots to repeatable tasks that consume resources and grant stat growth or magical benefits. The core loop involves efficiency optimization, task automation, and progression toward mastery.

In this prototype you awaken in the body of a 16‑year‑old after bandits ambush your family's caravan. A stranger rescues you from the wreckage and brings you to a small town to recover. With everyone else lost, your early routines involve rebuilding strength and earning coin in this medieval setting.

This release (v0.1.0) introduces automatic saving and loading of progress via localStorage.
It also adds a drag-and-drop task system with tooltips and simple completion animations.

Version 0.2.0 introduced a leveled action system with per-second yields and resource blocking.
Version 0.3.0 expands the prototype with six starting action slots, an introductory story modal, and a simple log panel.

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
| Automation   | Enables actions to loop with or without conditions                         |
| UI           | Interface for selecting tasks, viewing stats/resources, and managing slots |

#### 5. Core Stats (Initial Set)

* Strength
* Intelligence
* Wisdom *(initially locked; unlocked via milestone actions as a reward)*
* Charisma
* Endurance
* Energy (resource)
* Gold (resource)

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

#### 12. Future Extensions

* Prestige system with meta-upgrades
* Spell research tree
* Dynamic events or time-limited quests
* Mastery points earned from action tiers
* Player avatar or magical tower interface (for immersion)

---

Next step: expand automation and prestige mechanics.
