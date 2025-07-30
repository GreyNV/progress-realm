# Layout Refactor Overview

The UI is now organized using **Tabs** and collapsible **Sections**. Tabs are displayed across the bottom of the screen on mobile for easier navigation. Each tab lists one or more sections. A section has a `name` and a `type` which determines how its content is rendered.

## Components

- **TabContainer** – initializes tab navigation and delegates to `TabManager`. It also activates all section components.
- **SectionComponent** – sets up behavior for each section type. The initial implementation supports the `buttons` type which toggles visibility of its body when the heading is clicked.

## Adding Section Types

1. Implement a new handler inside `SectionComponent` for the desired `type`.
2. Mark the section in `index.html` or the layout data with `data-type="yourType"`.
3. Re-run `SectionComponent.initAll()` after creating the elements to attach the behavior.

## Layout Changes

- Tab headers are now placed at the bottom of the page and fixed on mobile screens.
- Each tab in `index.html` contains `<div class="tab-section" data-type="...">` wrappers.
- Content for sections lives inside a `.section-body` container which can be collapsed.

This modular approach makes it straightforward to add new UI sections without altering the overall layout.
