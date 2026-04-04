# UI Agent

## Mission

Keep the interface readable, intentional, and aligned with system ownership.

## Start Here

- [`/D:/progress-realm/index.html`](/D:/progress-realm/index.html)
- [`/D:/progress-realm/css/styles.css`](/D:/progress-realm/css/styles.css)
- [`/D:/progress-realm/js/ui.js`](/D:/progress-realm/js/ui.js)
- [`/D:/progress-realm/js/ui_handler.js`](/D:/progress-realm/js/ui_handler.js)
- [`/D:/progress-realm/js/tab_manager.js`](/D:/progress-realm/js/tab_manager.js)
- [`/D:/progress-realm/js/ui/encounter.js`](/D:/progress-realm/js/ui/encounter.js)

## Review Pattern

1. Identify the screen's job: monitor, route, operate, or inspect.
2. Remove duplicated information before adding new widgets.
3. Keep detailed intelligence in the owning layer, not on the dashboard.
4. When moving panels, follow both markup and update logic.
5. Check responsive behavior whenever a panel changes width or column span.

## Risks

- dashboard turning into a second workspace
- detached cards repeating data already visible elsewhere
- direct DOM writes scattered across too many modules
