# Changelog
## [0.41.67] - 2025-07-25
### Changed
- Action buttons show level progress with a darkening background instead of text.
- Resource costs are deducted at the start of every action cycle.
- Furniture purchases no longer replace existing pieces; repairing uses scaled cost.
- Tab layout moved to bottom on mobile with collapsible sections via new TabContainer.
- Tabs use icons in a fixed footer and old footer actions moved into the settings modal.
- Default home now falls back to "Hut in the Woods" if the saved home is missing.
- Home slot now updates correctly after reloads and prestiges.
- Action slots falling back to the Rest action now begin progress automatically.
- Active slots moved next to the log as a tab and reduced to one slot.
- Prestige now reassigns the default hut immediately to prevent an empty home slot.
- Fixed missing default property in Home constructor so default home loads correctly.
- Actions now cost resources on activation and store progress when interrupted.
- Resource yields now grant rewards on completion rather than per second.
- Action buttons display experience progress toward the next level.
- Action list refreshes when experience is gained and shows a red outline when an action is unaffordable.
- Tooltips removed from action, home and furniture buttons. Buttons can expand to show details with calculated yields.
- Expand arrows moved to the right side of buttons and belongings lists remember expanded items.
- Furniture destruction now triggers a `furniture:destroyed` event to lock its actions.
- Prestige removes furniture-unlocked actions using the new event.


## [0.41.66] - 2025-07-14
### Changed
- Research progress now persists through prestiges.
- Research progress is restored after page reloads.
- Unlocked actions now persist through reloads and prestiges.
- Buying new furniture replaces any existing piece in that slot.
- UI updates now subscribe to events instead of polling every 200ms.
- Home and update lists refresh when inventory changes.
- Chip section heading renamed to "Updates" while tab name remains.
- Empty action slots now default to the Rest action.
- Removed creativity stat and updated items and encounters to match current
  resources. Money no longer grants a softcap bonus.
- Balanced encounter categories across stats and gave bandit ambush a small
  repeat appearance chance.
- Dexterity now grants prestige toward a new stat, Reflexes.
- Updates can replace earlier encounters with improved tiers once purchased.
- Purchase buttons highlight when an item is affordable.
- Furniture durability values increased 100x so furnishings last longer before breaking.
- Action tooltips now list resource costs and effects for each action.
- Owned homes persist across reloads and the default hut is applied automatically.
- Hut in the Woods now loads automatically and no longer shows in the available homes list.
- Update, research and furniture buttons share the drag-and-drop style and appear in flexible columns.
- Furniture highlights refresh on inventory changes, early furniture costs use wood instead of money,
  completed updates disappear from the list, and locked encounters are skipped when choosing battles.
- Default hut is now saved and displayed automatically after resets.

## [0.41.65] - 2025-07-13
### Fixed
- Progress bars on furniture slots now display current and maximum durability.
- Active actions are immediately removed if their supporting furniture breaks.

## [0.41.64] - 2025-07-09
### Changed
- Inventory updates now publish events instead of calling UI modules directly.
- Furniture slots now show durability progress and related actions consume it.
- Actions tied to destroyed furniture are removed from active slots.
- Fixed invalid image fields in `actions.json` that prevented initialization.
- Docs: update module responsibilities in README.md
- Added unit tests for `SaveSystem`, `SoftCapSystem` and `TabManager` to keep
  coverage above 80%.
- Action and adventure slot creation now uses the `BaseSlot` class.
- Selecting a home publishes a `home:changed` event.
- Documented changelog update policy in `AGENTS.md` and added a section to
  `README.md` describing the process.
- Chip tab remains hidden until the Bandits Ambush story event is cleared.
- Added `requirements.txt` and updated documentation on installing Python dependencies.
- Split home, furniture and research modules into data and UI components.
- Moved `InventoryUI` to its own script under `js/ui/` and added UI guidelines.
- Documented recent modularization in `README.md` and `docs/refactoring_task.md`.
- Remaining game logic moved out of `main.js` into dedicated modules.
- Enforced single source of truth for `State`: all mutations now go through
  helpers in `state.js`.
- Removed direct DOM access from logic modules. UI updates now occur only in
  `ui.js`, `ui_handler.js` or `js/ui/` components.
- Added woodworking and sleep actions tied to furniture purchases.
- Furniture durability now decreases while related actions run.
- Actions unlocked by furniture remain hidden until that furniture is present.
- Destroyed furniture hides its actions again and removes selection.
- Added new Dexterity stat; stats after Strength and Intelligence stay hidden until they exceed zero.

## [0.41.63] - 2025-07-09
### Added
- Dedicated age system module with pub/sub events.
### Changed
- Furniture decay and prestige triggers listen to age events.
- formatCost moved to Utils and used by home and furniture modules.

## [0.41.62] - 2025-07-09
### Changed
- Split major systems into separate scripts.


## [0.41.61] - 2025-07-09
### Changed
- Furniture durability now decays more slowly.

## [0.41.60] - 2025-07-09
### Added
- Homes and furniture now require item costs instead of numeric prices.
- Furniture gains durability that decays each day and items vanish when it reaches zero.

## [0.41.59] - 2025-07-09
### Added
- BaseSlot module for reusable slot UI
- Furniture and Research systems with JSON data
- Translation updates for new UI labels

## [0.41.58] - 2025-07-08
### Fixed
- Saved adventure encounters are now restored as `Encounter` objects when loading the game.

## [0.41.57] - 2025-07-08
### Fixed
- Alert now appears whenever resource data fails to load, not just from the `file:` protocol.
- Added troubleshooting note in README.
## [0.41.56] - 2025-07-08
### Fixed
- Alert when resource data fails to load if page is opened directly from disk.
- Documented server requirement in README.

## [0.41.55] - 2025-07-08
### Fixed
- Added fallback path for `resources.json` to avoid 404 errors when served from subdirectories.
## [0.41.54] - 2025-07-08
### Fixed
- Updated Ukrainian translation for constitution to "Комплекція".
## [0.41.53] - 2025-07-08
### Added
- Translated item effect descriptions and added Ukrainian strings.
- Encounter tooltips now show modified drop chances and guaranteed loot.
## [0.41.52] - 2025-07-08
### Added
- Ukrainian translations for prestige resources.
## [0.41.51] - 2025-07-07
### Added
- Telegram upload bot displays story event IDs when listing unresolved entries and
  supports adding images for homes.
## [0.41.50] - 2025-07-07
### Added
- Resource names in retreat logs now respect language translations.
## [0.41.49] - 2025-07-07
### Fixed
- Story modal now shows English descriptions when translations are missing.
## [0.41.48] - 2025-07-07
### Fixed
- `scripts/simple_server.py` resolves the repository path using `os.path.abspath`.
## [0.41.47] - 2025-07-07
### Added
- Story events are now included when the Telegram upload bot scans for missing images.
- `scripts/simple_server.py` starts a local HTTP server for testing the game.
## [0.41.46] - 2025-07-07
### Added
- Inventory publishes `item:added` and `item:consumed` events for game systems.
## [0.41.45] - 2025-07-06
### Added
- PubSub events for unlockables and modal visibility.
## [0.41.44] - 2025-07-06
### Added
- Basic `PubSub` module enables publish/subscribe messaging between systems.

## [0.41.43] - 2025-07-06
### Added
- Story events load from `data/story_events.json` via new `StorySystem`.
- Chip upgrades can unlock tabs and trigger story events.


## [0.41.42] - 2025-07-06
### Added
- Sections now support `hidden` and `locked` flags in `data/ui.json`.
- Ukrainian translations for prestige stats.

## [0.41.41] - 2025-07-05
### Added
- Tabs and sections now load from `data/ui.json` via `UIHandler`.

## [0.41.40] - 2025-07-05
### Added
- Introduced `UIHandler` module for dynamic UI creation.
- Updated documentation and guidelines.

## [0.41.39] - 2025-07-05
### Fixed
- English UI now defaults to the base text when no translation exists.

## [0.41.38] - 2025-07-05
### Fixed
- Resource cap multipliers no longer stack each reload.



## [0.41.37] - 2025-07-03
### Changed
- Uploaded images via Telegram bot are renamed using the entry ID for consistent filenames.

## [0.41.36] - 2025-07-03
### Changed
- Telegram bot skips pull request creation when the `gh` CLI is unavailable.

## [0.41.35] - 2025-07-03
### Fixed
- Normalized uploaded file paths in the Telegram bot to use forward slashes.

## [0.41.34] - 2025-07-03
### Fixed
- Improved validation for Telegram upload bot image handling.

## [0.41.33] - 2025-07-02
### Changed
- Updated Telegram upload bot to use async API calls.

## [0.41.32] - 2025-06-30
### Added
- Telegram upload bot script and documentation.

## [0.41.31] - 2025-06-30
### Changed
- Home slot now uses encounter slot layout for a larger display.
- Documented furniture slots as action-style placeholders for future unlockable furniture.

## [0.41.30] - 2025-06-30
### Added
- Furniture section under Home with slots tied to each dwelling
- Homes now include cost and furniture slot count in `homes.json`
- Ukrainian translation updated for Belongings

## [0.41.29] - 2025-06-29
### Added
- Selectable home objects with a dedicated slot.

## [0.41.28] - 2025-06-29
### Added
- Renamed Inventory tab to Belongings and added a Home section inside it.

## [0.41.27] - 2025-06-29
### Fixed
- Prestige stat caps now account for bonuses and display the correct values in the UI.

## [0.41.26] - 2025-06-29
### Fixed
- Automatic prestige now triggers when reaching maximum age.
- Prestige resource totals increment correctly after each reset.

## [0.41.25] - 2025-06-29
### Removed
- Plus buttons and prestige cost labels from the UI.

## [0.41.24] - 2025-06-29
### Fixed
- Prestige resources and upgrades now persist correctly between prestiges.

## [0.41.23] - 2025-06-29
### Added
- Prestige upgrade system with scaling costs and bonuses

## [0.41.22] - 2025-06-28
### Added
- Potential prestige gain display with Constitution and Wisdom prestige
  currencies replacing Strength and Intelligence

## [0.41.21] - 2025-06-28
### Changed
- Encounter level now resets to 1 when prestiging
- Action slots remain filled after prestige

## [0.41.20] - 2025-06-28
### Changed
- Prestige block now appears once any prestige points are earned.
- Encounter generator starts at level 1.

## [0.41.19] - 2025-06-28
### Added
- Prestige now triggers automatically at max age converting stats to prestige
  points that enhance future growth.

## [0.41.18] - 2025-06-28
### Added
- Prestige reset preserves action levels while clearing stats and resources.

## [0.41.17] - 2025-06-28
### Changed
- Story images now load lazily to reduce initial load time.

## [0.41.16] - 2025-06-28
### Added
- Documented planned lazy loading and automatic image compression.

## [0.41.15] - 2025-06-28
### Changed
- Creativity stat hidden from the UI pending future unlock.
- Updated documentation to note the temporary removal.

## [0.41.14] - 2025-06-28
### Fixed
- Recover encounter triggers instantly on retreat instead of after waiting for resources.

## [0.41.13] - 2025-06-28
### Fixed
- Recover encounter now automatically starts after retreats and is removed from the random pool.
- Recover encounter restores energy using negative consumption values.

## [0.41.12] - 2025-06-27
### Changed
- Money resource removed.
- Resources show as colored bars.

## [0.41.11] - 2025-06-27
### Changed
- Automation tab is hidden.
- Updates tab renamed to Chip with a blue theme color.
- Prestige block and charisma stat are no longer displayed.

## [0.41.10]
### Added
- Optional rarity filter in the inventory tab.

## [0.41.9]
### Added
- Recover encounter triggers after automatic retreats and appears once the hero's resources return to full.

## [0.41.8]
### Changed
- Inventory grid now caps at six columns and falls back to three on small screens.
- Items are sorted by rarity in the inventory tab.

## [0.41.7]
### Added
- Inline comments across JS modules explaining game flow and module chain.

## [0.41.6]
### Added
- Lightweight `Logger` module for optional debug output
- Logging statements in `state.js` and image pipeline script
- README updated with new logger info

## [0.41.5]
### Fixed
- Moved `VERSION` constant into `state.js` so initialization succeeds when scripts load in `index.html`.

## [0.41.4]
### Added
- Base stats and resources now loaded from `data/resources.json`.
- BonusEngine initializes dynamically for new resource keys.

## [0.41.3]
### Added
- Introduced `state.js` module and updated dependencies.
- Progress bar under encounter location shows streak toward next level.

## [0.41.2]
### Added
- Translation support for log messages.
- Ukrainian strings for new items and encounters.


## [0.41.1]
### Fixed
- Tab names now translate based on selected language and language selector no longer disappears.

## [0.41.0]
### Added
- New "Updates" tab with draggable one-time unlockables.
### Changed
- Removed `maxLevel` filtering from encounters to support the new progression system.

## [0.40.0]
### Added
- New common items from analytics data including water flasks, iron ore and more.
- Five common encounters to gather these resources.
- Existing encounters updated with additional item drops.

## [0.39.0]
### Fixed
- Ensured stats exist when loading saves to prevent UI errors.

## [0.38.0]
### Fixed
- Game initialization now runs correctly when scripts load at the end of the page
  so stats and resources update as expected.

## [0.37.0]
### Fixed
- Guarded UI cap updates when SoftCapSystem values are missing to prevent zero stats.


## [0.36.0]
### Added
- Review protocol for sub-agents in `AGENTS.md`.

All notable changes to this project will be documented in this file.

## [0.35.0]
### Added
- `robots.txt` to block indexing of game data.
### Changed
- Introduced `Utils.weightedRandomChoice` and refactored item and encounter selection to use it.

## [0.34.0]
### Added
- Translations for stat names, resource names, and story events.

## [0.33.0]
### Changed
- Introduced `StatSystem` so stats and resources are handled separately.

## [0.32.0]
### Added
- Ukrainian language support with a settings switch to change game language.

## [0.31.0]
### Changed
- Removed numeric amounts from item tooltips.

## [0.30.0]
### Added
- Tooltips now appear on all slots.
- Inventory slots display item descriptions and effects.
- Adventure slots show encounter descriptions and loot chances.

## [0.29.0]
### Changed
- Modals now follow dark mode theme.

## [0.28.0]
### Added
- Dark mode enabled by default with toggle in new Settings panel.

## [0.27.0]
### Changed
- Slots now have a dark background so labels remain visible when no image is set.

## [0.26.0]
### Added
- Left panel can now be collapsed via a button in the header.
### Changed
- Ore chunk and gem items are now rare.
- Find Ore and Ancient Vault encounters are rare with shorter base durations.

## [0.25.0]
### Changed
- Base encounter durations are now set by rarity: 1s for common, 2s for rare, 5s for epic, 10s for legendary and 15s for story.

## [0.24.0]
### Changed
- Encounter duration now derives from level divided by relevant stats and honors `baseDurationScale` as a minimum multiplier.

## [0.23.0]
### Added
- Rare items now occasionally drop from common encounters and wood gathering tasks scale into a new "Oversee Lumber Team" encounter.
### Changed
- Rebalanced `maxLevel` values so early tasks phase out sooner.

## [0.22.0]
### Changed
- Loot yield now scales with your stats based on each encounter's category.

## [0.21.0]
### Added
- Encounters can specify guaranteed `loot` amounts alongside probability-based `items` drops.

## [0.20.0]
### Added
- Encounters now include a `maxLevel` property to remove them from the pool once the adventure level surpasses it.

## [0.19.0]
### Added
- Border colors now reflect item and encounter rarity.
- Log entries highlight item and encounter names by rarity without showing rarity text.
- Bonus Engine module applies additive, multiplicative and exponential modifiers before deltas update stats and resources, and supports cost divisors for consumptions.

## [0.18.0]
### Changed
- Encounter progress is now processed by DeltaEngine so adventure timing respects game speed.

## [0.17.0]
### Changed
- DeltaEngine now handles aging and action experience so all progression uses the same speed scaling.

## [0.16.0]
### Changed
- Delta calculations moved to new engine module and now accept multipliers for game speed.

## [0.15.1]
### Changed
- Updated full gear image reference to `set+sword.png`.

## [0.15.0]
### Added
- Character background now shows a special image when leather armor, a wooden shield, an iron sword and a gem are equipped.

## [0.14.0]
### Changed
- Bandits Ambush now has a very low chance to reoccur after the first guaranteed encounter.
- Loot from Bandits Ambush is determined by the encounter data file.

## [0.13.0]
### Added
- Autoprogress checkbox in the Adventure tab to pause encounter level ups.

## [0.12.0]
### Added
- CharacterBackground module updates left panel based on equipment.
### Changed
- Use existing 'leather+woodshield+spear.png' image for equipped character background.

## [0.11.0]
### Added
- Scripts `image_pipeline_encounters.py` and `image_pipeline_actions.py` for
  generating encounter and action images.
- Updated README with image pipeline details for all asset types.

## [0.10.0]
### Added
- Python script `scripts/image_pipeline.py` to auto-generate missing item images  via OpenAI's DALL·E API.
- Documentation section on the new image pipeline.
### Fixed
- Updated image pipeline to use `client.images.generate` with API key handling.

## [0.9.0]
### Added
- Story encounter rarity with level-triggered events.
- New "Bandits Ambush" story encounter grants a gem and an iron sword on first completion.

## [0.8.1]
### Fixed
- Corrected image paths for woodcutting, stone collecting, boar hunting and ore finding encounters.

## [0.8.0]
### Changed
- Adjusted ancient vault loot table with new rare and epic items.
- Updated image references for items and encounters.
- Reduced resource cost of legendary vault encounter.

## [0.7.0]
### Added
- New level-gated encounters from common to legendary tiers with item rewards.
### Documentation
- Updated README with encounter tier details.

## [0.6.0]
### Added
- Inventory tab with item generator. Items now drop from encounters and appear in your inventory.
### Documentation
- Updated README and docs with inventory details and modularization progress.
- Added `docs/AGENTS.md` with documentation update rules.

## [0.5.0]
### Changed
- Adventure tab redesigned with a single slot.
- Encounter level increases after ten consecutive successes.

## [0.4.0]
### Added
- Weighted random encounters with loot chances influenced by stats.

## [0.3.0]
### Added
- Six starting action slots.
- Introductory story modal and log panel.

## [0.2.0]
### Added
- Leveled action system with per-second yields.
- Resource blocking for tasks.

## [0.1.0]
### Added
- Automatic saving and loading of progress via localStorage.
- Drag-and-drop task system with tooltips and completion animations.
