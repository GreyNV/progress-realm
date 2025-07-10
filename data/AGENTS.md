# Data File Guidelines

- Use JSON format with 4 spaces for indentation and double quotes for all keys and strings.
- Keys are written in lowerCamelCase.
- When adding new entries with an `image` field, provide a unique asset path in `assets/` and do not reuse existing images.
- Update translation files under `data/lang/` for any new `name` or `description` fields.
- Keep JSON entries purely declarative; do not mix code or comments.
- Avoid trailing commas and keep the structure consistent with existing files.
