# UI Module Guidelines

Legacy scripts remain in this `js/ui/` folder, but all new UI work should be
implemented as Vue components under `vue-ui/src`.
- Keep modules focused on rendering and user interaction.
- Do **not** mutate the global `State` object directly in UI modules.
  Publish events via `PubSub` or call system APIs instead.
- Reuse shared components like `BaseSlot` for slot-based layouts.
- Use 4-space indentation, semicolons and camelCase naming.
