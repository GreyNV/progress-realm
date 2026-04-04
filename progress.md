Original prompt: PLEASE IMPLEMENT THIS PLAN:

# Dashboard-First UI Modernization Plan

## Notes
- Converting the shell to an overview-first dashboard with focused workspaces.
- Keeping existing gameplay systems intact and refactoring presentation/routing around them.
- Preserving unlock progression from `data/ui.json` while surfacing locked layers as disabled dashboard cards.
- Selectively ported queue-threshold recovery, resource inspector drill-downs, and encounter log controls from the historical branch into the dashboard architecture.
- Added live resource trend charts to the overview and a character loadout summary card with direct belongings/equipment shortcuts.
- Moved overview module ordering into `data/ui.json`, merged resource charts into the critical resources module, and fixed the startup crash that was breaking dashboard/workspace navigation.
- Made the layer cards interactive so the overview can directly assign routines, toggle adventure auto-progress, jump to inventory subsections, and trigger quick chip actions.

## TODO
- Verify overview-to-workspace navigation and back flow in a live browser.
- Confirm inventory/home/furniture/chip sections remain usable after the shell rewrite.
- Add or adjust lightweight regression tests for the new overview/workspace structure.
- Define the first combat sprite art pack so character/enemy assets can be produced against stable filenames and framing rules.
