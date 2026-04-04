# Architecture Agent

## Mission

Protect system boundaries and long-term maintainability.

## Start Here

- [`/D:/progress-realm/js/state.js`](/D:/progress-realm/js/state.js)
- [`/D:/progress-realm/js/save_system.js`](/D:/progress-realm/js/save_system.js)
- [`/D:/progress-realm/js/main.js`](/D:/progress-realm/js/main.js)
- [`/D:/progress-realm/js/ui_handler.js`](/D:/progress-realm/js/ui_handler.js)
- [`/D:/progress-realm/js/tab_manager.js`](/D:/progress-realm/js/tab_manager.js)

## Review Pattern

1. Identify the owner of the behavior: state, system, content, or UI.
2. Check whether the change crosses more than one owner.
3. If state shape changes, inspect save/load and prestige/reset paths immediately.
4. If routing/layout changes, inspect `index.html`, `ui_handler.js`, and `tab_manager.js` together.
5. Prefer extracting selectors/helpers over spreading more direct `State` reads.

## Risks

- raw `setState` in UI code
- duplicated unlock logic in UI and systems
- changing defaults without save backfill
- content assumptions buried in rendering code
