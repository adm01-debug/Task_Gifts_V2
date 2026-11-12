# ECC for Codex CLI

This supplements the root `AGENTS.md` (the source of truth for this repo — read it first, it is in
PT-BR and governs database, Git flow, deploy and communication) with a repo-local ECC baseline.

## Repo Skill

- Repo-generated Codex skill: `.agents/skills/task-gifts-v2/SKILL.md`
- Claude-facing companion skill: `.claude/skills/task-gifts-v2/SKILL.md`
- Keep user-specific credentials and private MCPs in `~/.codex/config.toml`, not in this repo.
  **This repository is public** — anything committed here is world-readable.

## MCP Baseline

Treat `.codex/config.toml` as the default ECC-safe baseline for work in this repository.
The generated baseline enables GitHub, Context7, Exa, Memory, Playwright, and Sequential Thinking.
The project's own database gateway lives in `.mcp.json`; see `docs/agentes/banco.md` before running SQL.

## Multi-Agent Support

- Explorer: read-only evidence gathering
- Reviewer: correctness, security, and regression review
- Docs researcher: API and release-note verification

## Workflow Files

- No dedicated workflow command files were generated for this repo.

Use these workflow files as reusable task scaffolds when the detected repository workflows recur.
