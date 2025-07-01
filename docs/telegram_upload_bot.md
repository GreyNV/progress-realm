# Telegram Upload Bot

This bot helps contributors add images directly through Telegram. It performs
these steps:

1. **Repository Pull** – executes `git pull origin main` and reports failures.
2. **Parse & Filter** – scans JSON files for entries with missing image paths and
   verifies the image files are present.
3. **Present Options** – shows unresolved items in batches of ten for selection.
4. **Receive Upload** – validates the uploaded file size and type before saving
   to `assets/user_uploaded/`.
5. **Commit & PR** – updates the relevant JSON entry, commits the change and
   pushes to a dedicated branch. If no open PR exists the bot creates one using
   the GitHub CLI.
6. **Confirmation** – replies with a success or error message linking to the PR.

The bot exposes `/start`, `/upload_image` and `/list_unresolved` commands.
Ensure the environment variables `TELEGRAM_TOKEN` and `GITHUB_TOKEN` (for the
`gh` CLI) are configured before running `scripts/telegram_upload_bot.py`.
