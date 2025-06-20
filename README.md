# progress-realm
### Game Design Document – v0.2

#### 1. Game Title (Working)

> Progress Realm

#### 2. High-Level Concept

A progression and resource management game inspired by Progress Knight and Theory of Magic: Arcanum. Players assign limited action slots to repeatable tasks that consume resources and grant stat growth or magical benefits. The core loop involves efficiency optimization, task automation, and progression toward mastery.

In the prototype scenario you are reborn as the son of a retired mercenary who was granted a small territory for his service. Early routines revolve around training with your father and guarding the family lands.

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

* Player starts with 1 task slot
* Unlocks additional slots at milestones (e.g., 3 INT, 5 WIS)
* Some actions require multiple slots or temporary lockouts

#### 9. Visual Style

* Clean, minimalist interface (think Progress Knight)
* Progress bars, toggles, and simple iconography
* Text-based feedback with optional enhancements (sound, tooltip flavor text)

#### 10. Tech Stack

* HTML, CSS, JavaScript
* Optional: Vue or Svelte for structure
* Save system via localStorage (later: IndexedDB)

#### 11. Project Structure

The repository now contains a minimal HTML/CSS/JS setup to help test the very first prototype:

```
index.html        - entry point for the game
css/styles.css    - basic page styling
js/main.js        - starter script that initializes the app
docs/MVP.md       - checklist for the initial prototype
```

#### Prototype Layout

The page uses a simple header/main/footer structure. Stats and resources are kept in a left sidebar, routine controls sit in the center, and crafting or automation placeholders occupy the right panel. The header shows the current age and provides buttons to adjust the game speed.
Habits are quick actions found below the routine buttons for instant resource gains. Action buttons now display progress bars so you can see when the next effect will occur.

See **docs/MVP.md** for the MVP list.

#### 12. Future Extensions

* Prestige system with meta-upgrades
* Spell research tree
* Dynamic events or time-limited quests
* Player avatar or magical tower interface (for immersion)

---

Next step: Define the Task Execution Engine or Resource System in detail.
