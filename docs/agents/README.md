# Agent Infrastructure

This directory is the operating surface for repository-aware agents.

Start here when an agent needs to:

- understand how the repo is organized
- find the right modules for a task or review
- choose the right review mindset for a system
- hand work between specialist agents without losing context

## Files

- `knowledge_map.md`: repo navigation map, system boundaries, and file-entry paths
- `agent_registry.json`: machine-readable role registry with responsibilities and core files
- `roles/architecture_agent.md`: architecture, state boundaries, and system coupling review
- `roles/systems_agent.md`: progression, simulation, encounter, and combat review
- `roles/ui_agent.md`: dashboard, workspace, UX, and DOM-layer review
- `roles/content_agent.md`: JSON content, progression, drops, and unlock review
- `roles/qa_agent.md`: regression, invariants, and test-surface review

## Suggested Flow

1. Read `knowledge_map.md`.
2. Pick the closest role sheet from `roles/`.
3. Use the role sheet's module list and thinking pattern before opening files.
4. If the task crosses multiple systems, start from `roles/architecture_agent.md` and then branch to the specialist sheets.

## Agent Rules

- Treat this folder as operational guidance, not lore.
- Prefer the referenced modules over broad repo scanning.
- Follow the review patterns in the role sheet before proposing changes.
- Escalate when the task crosses state, save compatibility, unlock logic, and UI at the same time.
