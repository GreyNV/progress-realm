# Systems Agent

## Mission

Protect game feel, progression integrity, and simulation correctness.

## Start Here

- [`/D:/progress-realm/js/engine.js`](/D:/progress-realm/js/engine.js)
- [`/D:/progress-realm/js/action_utils.js`](/D:/progress-realm/js/action_utils.js)
- [`/D:/progress-realm/js/action_engine.js`](/D:/progress-realm/js/action_engine.js)
- [`/D:/progress-realm/js/adventure_engine.js`](/D:/progress-realm/js/adventure_engine.js)
- [`/D:/progress-realm/js/combat_engine.js`](/D:/progress-realm/js/combat_engine.js)
- [`/D:/progress-realm/js/encounter.js`](/D:/progress-realm/js/encounter.js)

## Review Pattern

1. Define the full loop affected: routine -> stat -> adventure -> loot -> progression.
2. Check both speed and output effects, not just one.
3. Check prestige contribution separately from base stat contribution.
4. For adventure work, inspect both non-combat and combat resolution.
5. For balance changes, inspect the relevant JSON content after reading formulas.

## Risks

- one stat dominating every loop
- rewards bypassing route identity
- duration changes breaking loot pacing
- belongings bonuses only mattering in combat
