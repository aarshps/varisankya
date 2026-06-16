---
name: Agent Session Closing
description: Pointer — the session-closing checklist is now a generalized, family-wide skill in hora-core. This stub keeps only the Varisankya-specific specifics.
---

# Agent Session Closing Protocol

This checklist was generalized into the Hora-family shared repo. **Canonical version:**
`hora-core/.github/skills/agent-session-closing/SKILL.md`
(`C:\Users\Aarsh\Source\hora-core`, GitHub `aarshps/hora-core`) — run through that.

## Varisankya specifics on top of the shared checklist

- **Never stage secrets.** Confirm `git status` shows none of `local.properties`,
  `android/.env.local`, `google-services.json`, `*.jks`/`*.keystore`,
  `play_console_key.json`. The secret-retrieval script is `android/retrieve_secrets.sh`.
- **Commit straight to `main` (repo) / `master` (wiki) — no PRs, no feature branches**
  (see `AGENTS.md` mandate 6). Only commit/push when the user asks.
- **Build sanity:** `:app:assembleDebug` for a quick compile; `:app:bundleRelease` +
  `:app:minifyReleaseWithR8` green before a release.
- **Update memory** (project file) with the live version + one line on what shipped.
