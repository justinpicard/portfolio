# Codex Instructions

## Communication

Keep responses concise, task-focused, and proportional to the complexity of the task.

- Do not repeat code that was already written to files.
- Do not include full file contents or large code snippets unless explicitly requested.
- Do not provide detailed walkthroughs of obvious implementation steps.
- Do not narrate routine actions while working.
- Keep progress updates brief and only mention information useful for decision-making.
- Prefer a short summary over a detailed changelog.

After completing a task, summarize only:

- what changed;
- important implementation decisions, if any;
- anything that still requires attention.

If no further action is required, keep the final response to a few sentences.

## Working Style

Understand the existing implementation before making changes.

- Follow the architecture, conventions, and constraints defined in `AGENTS.md`.
- Reuse existing components, utilities, tokens, patterns, and abstractions where appropriate.
- Prefer the smallest change that fully solves the requested problem.
- Do not introduce unrelated refactors, cleanup, dependencies, abstractions, or features.
- Preserve existing behavior unless the task explicitly requires changing it.
- Keep experimental implementations isolated when the user asks to test an alternative without replacing the current version.

## Decision Making

Use the repository and existing implementation as the primary source of truth.

- When requirements are ambiguous, first infer intent from existing patterns and nearby code.
- Make reasonable implementation decisions autonomously when they are low-risk and consistent with the codebase.
- Ask for clarification only when a decision is consequential, subjective, or cannot be reliably inferred from the available context.
- When multiple valid approaches exist, prefer the simplest approach that fits the existing architecture.
- Do not invent product requirements beyond the requested scope.

## Verification

Verify changes at a level appropriate to the task.

- Run relevant existing checks when practical.
- Do not run unrelated or unnecessarily expensive checks for small, isolated changes.
- Fix issues caused by the implementation before considering the task complete.
- Report verification failures only when they affect confidence in the result or require user action.