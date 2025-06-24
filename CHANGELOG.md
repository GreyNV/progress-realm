# Changelog

All notable changes to this project will be documented in this file.

## [0.16.0] - 2025-07-06
### Changed
- Delta calculations moved to new engine module and now accept multipliers for game speed.

## [0.17.0] - 2025-07-07
### Changed
- DeltaEngine now handles aging and action experience so all progression uses the same speed scaling.

## [0.18.0] - 2025-07-08
### Changed
- Encounter progress is now processed by DeltaEngine so adventure timing respects game speed.

## [0.19.0] - 2025-07-09
### Added
- Border colors now reflect item and encounter rarity.
- Log entries highlight item and encounter names by rarity without showing rarity text.

## [0.15.0] - 2025-07-04
### Added
- Character background now shows a special image when leather armor, a wooden shield, an iron sword and a gem are equipped.

## [0.15.1] - 2025-07-05
### Changed
- Updated full gear image reference to `set+sword.png`.

## [0.14.0] - 2025-07-03
### Changed
- Bandits Ambush now has a very low chance to reoccur after the first guaranteed encounter.
- Loot from Bandits Ambush is determined by the encounter data file.

## [0.13.0] - 2025-07-02
### Added
- Autoprogress checkbox in the Adventure tab to pause encounter level ups.

## [0.12.0] - 2025-07-01
### Added
- CharacterBackground module updates left panel based on equipment.
### Changed
- Use existing 'leather+woodshield+spear.png' image for equipped character background.

## [0.10.0] - 2025-06-29
### Added
- Python script `scripts/image_pipeline.py` to auto-generate missing item images
  via OpenAI's DALL·E API.
- Documentation section on the new image pipeline.
### Fixed
- Updated image pipeline to use `client.images.generate` with API key handling.

## [0.11.0] - 2025-06-30
### Added
- Scripts `image_pipeline_encounters.py` and `image_pipeline_actions.py` for
  generating encounter and action images.
- Updated README with image pipeline details for all asset types.

## [0.6.0] - 2025-06-24
### Added
- Inventory tab with item generator. Items now drop from encounters and appear in your inventory.
### Documentation
- Updated README and docs with inventory details and modularization progress.
- Added `docs/AGENTS.md` with documentation update rules.

## [0.7.0] - 2025-06-25
### Added
- New level-gated encounters from common to legendary tiers with item rewards.
### Documentation
- Updated README with encounter tier details.

## [0.8.0] - 2025-06-26
### Changed
- Adjusted ancient vault loot table with new rare and epic items.
- Updated image references for items and encounters.
- Reduced resource cost of legendary vault encounter.

## [0.8.1] - 2025-06-27
### Fixed
- Corrected image paths for woodcutting, stone collecting, boar hunting and ore finding encounters.

## [0.9.0] - 2025-06-28
### Added
- Story encounter rarity with level-triggered events.
- New "Bandits Ambush" story encounter grants a gem and an iron sword on first completion.

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
