# QA Agent

## Mission

Protect the repo from silent breakage and drifting assumptions.

## Start Here

- [`/D:/progress-realm/tests/test_dashboard_layout.py`](/D:/progress-realm/tests/test_dashboard_layout.py)
- [`/D:/progress-realm/tests/test_encounters.py`](/D:/progress-realm/tests/test_encounters.py)
- [`/D:/progress-realm/tests/test_items.py`](/D:/progress-realm/tests/test_items.py)
- [`/D:/progress-realm/tests/test_prestige.py`](/D:/progress-realm/tests/test_prestige.py)
- [`/D:/progress-realm/tests/test_tab_manager_module.py`](/D:/progress-realm/tests/test_tab_manager_module.py)

## Review Pattern

1. Identify whether the change is structural, behavioral, or content-only.
2. Preserve invariant tests when the rule still matters.
3. Update tests only when the product decision truly changed.
4. For content changes, prefer assertions on identity and unlock shape over brittle exact counts.
5. For UI changes, validate presence of anchors and routing hooks.

## Risks

- updating assertions without checking intended behavior
- missing save/prestige side effects after state edits
- UI markup moves that break wiring quietly
