# Agent Guidelines

## Project Structure

- `assets/` – images and static assets used by the site
- `css/` – stylesheets
- `js/` – JavaScript for game logic and UI
- `data/` – JSON files for tasks and actions
- `docs/` – design documents and other project notes
- `index.html` – main HTML entry point
- `README.md` – high‑level overview and design goals

## Coding Standards

- Use **4‑space indentation** for all languages
- Follow **PEP8** when writing Python code
- Prefer descriptive variable and function names
- Keep code modular and comment important sections
- When creatimg new keys in json files do not reuse existing image sources

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

## Review Protocol

- Spawn sub-agents to gather context about the codebase before making changes.
- Each sub-agent should identify dependencies, imported libraries, and function calls for the files being modified.
- After gathering context, analyze the logic for readability, efficiency, and optimization opportunities.
- Add or update comments to clarify the purpose of the code sections you touch.
- Follow these steps on every run.
