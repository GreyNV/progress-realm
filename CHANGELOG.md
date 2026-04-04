# Changelog

## [Unreleased] - 2025-07-30
### Added
- Added a new run-based routine-upgrade layer with item-cost buyables, multiplicative routine speed bonuses by stat, an active routine preview card in `Routine Dynamics`, and a dedicated upgrades panel replacing the old routine slot section.
- Added data-driven tab unlock coverage for the new early-game flow, including tests for stat-gated adventure access and dashboard selector output for unlock progress.
- Added visible completion-time readouts to routine buttons, routine slots, adventure slots, and dungeon route cards so action timing is readable without relying on tooltips alone.
- Added autosave coverage for refresh safety with typed orchestrator tests for page-hide, visibility-change, and periodic save hooks, plus a regression test that invalid save envelopes are quarantined instead of being silently ignored.
- Activation cost for actions deducted only once on start with visible block state when insufficient resources.
- Slot progress now resumes from previous value when reselecting an action.
- Queued actions and adventures wait until all resources are full before resuming.
- Retreats now store the last encounter and resume it after recovery.
- Added a dashboard-native resource inspector with expandable stat, resource, and prestige drill-downs.
- Added live resource trend charts and a dashboard equipment/loadout overview with direct shortcuts into belongings and equipment sections.
- Added per-run telemetry for action assignments/runtime plus encounter and dungeon completion counts to support future chip research hooks.
- Added a selectable dungeon catalog in the adventure workspace so players can route expedition flow into specific encounter pools.
- Added workspace insight panels for routines, adventure, belongings, chip, and automation so detailed layer context lives inside each layer instead of on the overview.
- Added a new painted routine illustration set for the six starter routines and wired those versioned assets into the live action data.
### Changed
- Preserved mastery progression through save/load and prestige by carrying the mastery XP track forward during reset instead of rebuilding it from prestige levels alone, with regression coverage for both reload and prestige flows.
- Moved the stat breakdown into a persistent sticky sidebar shared by overview and all workspace tabs, condensed each stat card into a tighter non-duplicated summary, and made the panel independently scroll when it grows taller than the viewport.
- Collapsed the live stat model from six stats to five by removing craftsmanship, renaming dexterity/endurance/awareness to agility/constitution/will, remapping old save data into the new stat keys, and retuning starter routines, routine upgrades, dungeon focus, encounters, combat assumptions, and tests around the simplified stat set.
- Normalized all routines to a shared 10-second / 10-XP baseline and temporarily disabled tooltip behavior across the typed UI so the current surfaces rely only on visible information.
- Added a real encounter progress bar to the dashboard adventure preview, upgraded route possible-drops into item-aware chips with icons, and applied stronger dark overlays to routine art so labels stay readable over the images.
- Darkened routine image treatments behind labels, added live encounter progress to the dashboard adventure block, replaced vague signature-drop summaries with a dedicated possible-drops block, and removed guaranteed-loot listings from the active encounter UI path.
- Added a compact adventure overview section directly under the routines pass on the dashboard, tightened the side stat panel density, and simplified stat cards by removing carryover stat-name labels in favor of a generic mastery layer.
- Moved the overview stat breakdown into its own persistent dashboard card, corrected mastery mapping to read the proper carryover stat keys, and exposed per-stat upgrade effects alongside run and mastery layers.
- Added an overview stat-breakdown strip and reusable stat icon/chip references across routine cards, active slots, and dungeon cards so players can see which stats are driving routine and expedition speed at a glance.
- Reframed the dashboard as a routine-command overview by moving the routines summary and `Routine Dynamics` block onto the overview page, reducing the dashboard to that snapshot plus the bottom log, and keeping the full routines workspace as the deeper control surface behind a dedicated CTA.
- Locked non-core layers behind progression, made adventure unlock from early routine training instead of story flags, and simplified the dashboard to focus on current activity, routine pace, and adventure readiness instead of showing every layer upfront.
- Wired the live app to autosave on page hide, before unload, hidden-tab transitions, periodic intervals, and manual reload requests so refresh preserves recent progress instead of depending on settings clicks or the manual save button alone.
- Added a real mastery XP track alongside the carryover stat levels, mirrored routine XP into mastery progression, and changed routines to award stat/mastery XP continuously from action progress instead of only at cycle completion.
- Refined routine progression around current-routine speed multipliers by separating current-run and mastery compounding in the typed formula system, anchoring completion XP to base cycle time, and replacing the duplicated routines `Lead Stat` / `Assignments` UI with a routine-specific multiplier breakdown.
- Removed action-level and mastery-point progression from the live routine loop, switched dashboard hero/telemetry metrics to stat- and route-driven signals, and converted research readiness from mastery spend to milestone requirements based on route clears, field samples, and routine/adventure telemetry.
- Removed the final live legacy browser dependencies by installing typed logger, utility, slot, and prestige globals from `src/`, leaving `src/core/legacyScriptLoader.ts` empty and reducing the old `js/` files to compatibility shims for tests only.
- Ported the remaining layer UIs, dashboard HUD shell, shared state bridge, pubsub, bonus/age/equipment helpers, queue helpers, soft-cap system, and combat engine into typed `src/` modules, reducing the live legacy browser loader to `logger`, `utils`, `slot`, and `prestige` only while keeping the old `js/` files as compatibility shims for tests.
- Installed typed tooltip, modal, story UI, story helper, and resource-inspector globals from `src/`, removed `js/tooltipHandler.js`, `js/story_core.js`, `js/ui/modal.js`, `js/ui/story.js`, and `js/ui/resources_tab.js` from the live browser loader, and reduced those files to compatibility shims for tests and fallback use.
- Published the shared `State` surface and state helpers from `js/state.js` onto `globalThis` so the typed bootstrap can consume the legacy state bridge reliably during the remaining full-port transition.
- Simplified the legacy compatibility modules for items, dwellings, research, and updates so `js/items.js`, `js/home.js`, `js/furniture.js`, `js/research.js`, and `js/updates.js` now preserve only the Node/test-facing fallback behavior instead of carrying old browser delegation branches.
- Simplified the legacy Node/test compatibility modules for actions, adventure flow, and encounters by removing browser delegation branches from `js/action_engine.js`, `js/adventure_engine.js`, and `js/encounter.js` while preserving their exported fallback behavior.
- Simplified legacy-only compatibility files such as `js/lang.js`, `js/story.js`, `js/save_system.js`, and `js/tab_manager.js` into thin shims now that the live browser path uses typed globals from `src/app`.
- Ported the live browser implementations of localization, story progression, save/load, and workspace routing into `src/app/legacyGlobals.ts`, then removed `js/lang.js`, `js/story.js`, `js/save_system.js`, and `js/tab_manager.js` from the browser loader while keeping those files as compatibility shims for the existing test harness.
- Installed item, inventory, home, furniture, research, and update globals directly from `src/systems/`, then removed `js/items.js`, `js/home.js`, `js/furniture.js`, `js/research.js`, and `js/updates.js` from the live browser script loader while keeping those files as compatibility modules for the test harness.
- Installed the remaining formula, encounter, and engine browser globals directly from `src/systems/`, then removed `js/action_utils.js`, `js/engine.js`, `js/action_engine.js`, `js/adventure_engine.js`, and `js/encounter.js` from the live browser script loader so the legacy files remain compatibility shims instead of active browser dependencies.
- Added an agent infrastructure pack under `docs/agents/` with a knowledge map, specialist role sheets, and a machine-readable registry that points agents to the right modules, technologies, and review patterns.
- Replatformed the app onto a Vite + TypeScript shell with a typed content registry, schema-validated data loaders, selector/view-model support, a centralized progression service, and explicit save-version migrations while preserving the existing gameplay runtime through a legacy bridge.
- Moved items, inventory, homes, furniture, research, and updates onto new `src/systems/` TypeScript services, with the legacy `js/` modules now acting as browser compatibility shells instead of owning the primary runtime logic.
- Moved encounter generation plus the action and adventure engine browser runtime onto new `src/systems/` TypeScript services, while preserving the legacy `js/` exports as compatibility wrappers for tests and remaining UI hooks.
- Moved the action/encounter formula layer and `DeltaEngine` simulation math into new TypeScript systems, with the legacy `js/action_utils.js` and `js/engine.js` files now delegating to the typed runtime in the browser path.
- Added `src/ui/` dashboard, layout, and encounter presentation modules, with `js/ui.js`, `js/ui_handler.js`, and `js/ui/encounter.js` now delegating their decision-heavy browser path logic to the typed UI layer.
- Added typed slot widget, log, and combat UI modules under `src/ui/`, with `js/slotSetup.js`, `js/ui.js` log handling, and `js/ui/combat.js` now delegating their browser path logic to the new UI services.
- Moved startup sequencing and DOM event wiring into a typed app orchestrator under `src/app/orchestrator.ts`, reducing `js/main.js` to a compatibility shim that only preserves the remaining global entry bindings.
- Removed several legacy UI wrappers from the live browser script loader path, simplified `js/main.js`, `js/ui_handler.js`, `js/ui/encounter.js`, `js/ui/combat.js`, and `js/slotSetup.js` into thin compatibility shims, and installed their live browser globals directly from the typed `src/ui` layer.
- Filtered the adventure-side log to expedition events only, added explicit dungeon metadata/unlock rules with Frontier as the sole starting route, surfaced the current activity slot on the dashboard, and added a quick recommended routine action for open slots.
- Refined the adventure workspace into a left-side route/flow column and right-side expedition/log column, removed duplicate encounter-overview intel, moved prestige details out of the main dashboard into the chip/archive layer, and made `rest` an internal idle slot rather than a visible routine.
- Reworked the adventure workspace so the active expedition overview and encounter intel live together in the right-side command panel, with encounter flow pushed into a cleaner full-width section below.
- Trimmed obsolete dashboard pieces by removing the hidden equipment/signals overview cards, deleting the orphaned `data/tasks.json`, and dropping unused layer-control helpers so the current shell reflects the active stat-first design.
- Rebuilt the game shell into an overview-first dashboard with fantasy-tech styling and focused layer workspaces.
- Added dashboard control panels for routines, adventure, belongings, automation, and chip progression with locked-layer states.
- Converted `TabManager` into a view router that opens full workspaces from the overview and supports returning back to the dashboard.
- Expanded `UIHandler` and `ui.js` to render overview summaries, workspace summaries, and live layer metrics without changing gameplay systems.
- Adventure now supports mixed-mode encounters, including auto-battle combat encounters with a combat console, enemy/player stats, and retreat-on-defeat flow.
- Equipment now contributes combat behavior through weapon, shield, and passive gear bonuses while remaining compatible with the existing inventory/equipment UI.
- Added a combat art-direction pack covering battle sprite targets, file naming, composition rules, and prompt-ready asset specs for the first combat visual pass.
- Restored threshold-based queue recovery for actions and adventures, plus an encounter-log toggle, without bringing back the old tab shell.
- Moved overview module ordering into `data/ui.json`, merged resource charts into the critical resources card, and fixed the dashboard startup bug that prevented workspace buttons from functioning.
- Made the dashboard layer cards interactive, including quick routine assignment, adventure auto-progress control, inventory section shortcuts, and chip quick actions.
- Replaced the routine and adventure resource economy with stat-driven XP, levels, prestige-weighted scaling, dungeon-tagged encounters, and dashboard telemetry built around stat growth instead of energy/focus/health.
- Reworked the overview into a lighter dynamics monitor focused on current flow, layer entry points, and activity, while primary stat output now surfaces as live multipliers instead of raw level-first labels.
- Slightly increased stat XP gain and replaced adventure level-centric displays with current expedition multiplier readouts.
## [0.41.66] - 2025-07-14
### Changed
- Clicking a task immediately assigns it to an available slot.
- Default number of action slots is now 1 instead of 6.
- Research progress now persists through prestiges.
- Research progress is restored after page reloads.
- Unlocked actions now persist through reloads and prestiges.
- Furniture now respects slot limits. New pieces cannot be bought when all slots are full, while repurchasing an owned item refreshes its durability at a proportional cost.
- UI updates now subscribe to events instead of polling every 200ms.
- Home and update lists refresh when inventory changes.
- Chip section heading renamed to "Updates" while tab name remains.
- Fixed default home not appearing for new saves because the `default` field was ignored.
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
