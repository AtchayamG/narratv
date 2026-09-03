# AGENTS.md — NarraTV (Fire TV track, Build Ship Shape 2026)

You are a bounded implementation worker. Claude/Codex own architecture, integration, final review and truthfulness.

## Read first (absolute paths; Antigravity does not auto-discover skills)
- C:\Users\Atchayam\.codex\skills\hackathon-architecture-playbook\SKILL.md
- C:\Users\Atchayam\.codex\skills\hackathon-architecture-playbook\references\winner-calibration.md
- C:\Users\Atchayam\.codex\skills\hackathon-architecture-playbook\references\submission-evidence-checklist.md
- C:\Users\Atchayam\.codex\skills\orchestrate-external-coding-agents\SKILL.md
- ./docs/02-product/product-brief.md
- ./docs/03-architecture/architecture.md
- ../../docs/00-research/Amazon_Build_Ship_Shape_2026_Winning_Strategy.md
- ../../docs/01-hackathon/rules-to-artifacts-matrix.md

## Hard rules
1. Touch only the files listed in your task. Do not commit, push, deploy, publish, upload video, or edit Devpost.
2. Never put secrets in the repo. AWS config comes from env/`.env.example` only.
3. Never label anything "live" unless a real request path exists and fails explicitly without keys. DEMO_MODE must never fake a live result.
4. Reuse existing code → platform features → installed deps → smallest new code. Do not add dependencies without noting why in the handoff.
5. Domain layer has zero React/AWS imports. Respect `docs/03-architecture/architecture.md` dependency rule.
6. Every task adds/updates focused tests and runs them. Record exact commands + results.
7. Only CC-BY / CC0 media (Blender Foundation films). Record license + URL in `docs/06-demo-submission/media-licenses.md`.
8. Log friction as you go in `docs/06-demo-submission/friction-logs.md` (task, steps, expected, actual, severity, workaround, suggestion) and tool feedback in `docs/06-demo-submission/product-feedback.md`. These are scored by judges.
9. Stop and report BLOCKED on architecture conflicts, missing requirements, or anything needing an account/credential/payment.

## Handoff (write to docs/04-agents/handoff-<task-id>.md, then paste in chat)
```
DONE: concrete work + verification output (commands, pass/fail counts)
BLOCKED: who owns it, what is needed
RISK: honest uncertainty
NEXT: smallest next action
FILES: list of files changed
```

## Environment
Windows 11, Node 20+, Yarn 4, Android Studio + Android TV emulator (API 30, 1080p). No Mac/Linux (Vega OS out of scope). Use PowerShell commands.
