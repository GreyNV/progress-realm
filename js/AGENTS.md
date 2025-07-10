# JavaScript Guidelines

- Each file should define a single module focused on one system (e.g. AgeSystem, SaveSystem).
- Use object literals or classes and export them with `module.exports` when running under Node so tests can import them.
- Document dependencies and exported functions at the top of the file.
- Interact with other modules via the `PubSub` event bus. Avoid global variables other than the `State` object.
- Non-UI modules must not manipulate the DOM directly; UI logic lives in `ui.js`, `ui_handler.js`, or other UI modules.
- Keep functions short and prefer pure functions where possible.
- Use 4-space indentation, semicolons, and camelCase naming for variables and functions.
- Include or update tests in `tests/` whenever modules change.
