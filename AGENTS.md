# Agent Guidelines

## Project Structure

- `assets/` – images and static assets used by the site
- `css/` – stylesheets
- `js/` – JavaScript for game logic and UI
- `js/ui_handler.js` – builds stat, resource, and tab elements from JSON and coordinates UI modules
- `data/` – JSON files for tasks, actions, and UI layout
- `docs/` – design documents and other project notes
- `index.html` – main HTML entry point
- `README.md` – high‑level overview and design goals

## Coding Standards

- Use **4‑space indentation** for all languages
- Follow **PEP8** when writing Python code
- Prefer descriptive variable and function names
- Keep code modular and comment important sections
- When creatimg new keys in json files do not reuse existing image sources

- Prefer using `UIHandler` for new UI sections instead of manual DOM creation

## Architecture Guidelines
- Separate game logic, UI, and data into dedicated modules.
- Place game logic modules in `js/` as single-purpose files and export them for testing.
- Communicate across modules using the `PubSub` event bus rather than direct references.
- Modify the global `State` object only through helper functions in `state.js` or system APIs.
- UI modules should read state and publish events but avoid altering `State` directly.
- Load gameplay values from JSON files under `data/` instead of hardcoding them.
- Add unit tests in `tests/` when introducing or changing modules to keep coverage above 80%.

## Dependency Guidelines
- Track Python packages in `requirements.txt` and keep them up to date.
- Install dependencies with `pip install -r requirements.txt` before running scripts or tests.
- Primary packages include `openai`, `requests`, and `python-telegram-bot`.


## Testing Protocols

- Run all tests with `pytest`
- Use `pytest --cov` to check coverage; aim for **80%** or higher
- Ensure dependencies are installed in a local virtual environment before running tests

## Security Guidelines

- Validate all user input and sanitize data before processing
- Avoid SQL injection and similar vulnerabilities
- Never expose secrets or credentials in the codebase

## Workflow Guidelines

- Commit messages should include an issue reference when applicable, e.g. `Fix #123: short summary`
- Keep commit messages concise but descriptive
- Open a pull request for every change instead of pushing directly to `main`
- Provide a clear PR title and summary of the changes
- Update `CHANGELOG.md` with a short note describing each change
- Add new entries to the **top** of the changelog so the latest changes appear first
- Use the current date in `YYYY-MM-DD` format when creating new changelog entries
- Unless a task explicitly requires a version bump, update the notes under the
  latest version header instead of adding a new one

## Review Protocol

- Spawn sub-agents to gather context about the codebase before making changes.
- Each sub-agent should identify dependencies, imported libraries, and function calls for the files being modified.
- After gathering context, analyze the logic for readability, efficiency, and optimization opportunities.
- Add or update comments to clarify the purpose of the code sections you touch.
- Follow these steps on every run.
