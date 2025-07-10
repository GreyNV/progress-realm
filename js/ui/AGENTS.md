# UI Module Guidelines

- Place all UI-only scripts in this `js/ui/` directory.
- Keep UI modules focused on rendering and user interaction.
- Do **not** mutate the global `State` object directly in UI modules.
  Publish events via `PubSub` or call system APIs instead.
- Reuse shared components like `BaseSlot` for slot-based layouts.
- Use 4-space indentation, semicolons and camelCase naming.
- When adding new UI scripts, update `index.html` to include them after their
  data dependencies.
