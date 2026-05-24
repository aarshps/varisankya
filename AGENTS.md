# AI Agents Context

This repository utilizes AI agents (such as Claude Code, Gemini CLI, Cline, etc.) for development, maintenance, and orchestration.

## Branch Strategy (READ FIRST)

This repo has exactly **one canonical branch**: **`main`**. Everything you do should land on `main` unless the user explicitly tells you otherwise.

- ✅ **`main`** — the only active development branch. The Varisankya subscription-manager app. All releases (tags `v3.5`, `v3.7`, `v3.8-*`, ongoing) are cut from here.
- ❌ **`master`** — **removed**. There was previously a `master` branch carrying a minimal "Hello World + Google Sign-In" starter (the seed of the project); it was deleted from the remote on the v3.8-beta.5 cleanup pass and is not coming back. If a `master` branch ever reappears, it is not authoritative — work on `main`.
- ✅ **Wiki** (`varisankya-android.wiki` repo) — human-facing docs live on the wiki's `master` branch (GitHub wikis only have one branch). The wiki documents `main`-branch behavior.

Companion repos:

| Repo | Active branch | What lives there |
| --- | --- | --- |
| `varisankya-android` | `main` | App source code (this file is here) |
| `varisankya-android.wiki` | `master` | Human-facing documentation |

If you ever find yourself on `master` of this repo: switch back to `main` (`git checkout main`).

## Core Agent Mandates

1. **Security First:** Agents must NEVER log, print, stage, or commit secrets, API keys, keystores, or sensitive credentials. All deployment secrets and API keys for this project are securely managed via Bitwarden. 
   - **Important:** The project now builds on a headless Ubuntu Linux machine.
   - Run `./retrieve_secrets.sh` to extract the keystore and Firebase config securely from Bitwarden CLI into the local workspace (`app/google-services.json`, `varisankya-upload-key`, and `local.properties`).
2. **Context Efficiency:** Agents should minimize unnecessary context usage by targeting file reads and searches efficiently.
3. **Engineering Standards:** Adhere strictly to existing workspace conventions, architectural patterns, and styling. Never bypass type systems or suppress warnings without explicit user instruction.
   - **Firestore Models:** Ensure all data classes used with Firebase Firestore (e.g., `Subscription`, `PaymentRecord`) are explicitly preserved in `app/proguard-rules.pro` to prevent R8 serialization errors in release builds.
4. **Validation:** Agents must empirically validate all changes (e.g., compile checks with `./gradlew assembleDebug`, linting, tests) before considering a task complete.

## Operational Workflows
* **Execution:** Operate in a Plan -> Act -> Validate cycle.
* **Session Closing:** Before closing a session, agents MUST follow the `Agent Session Closing Protocol` (see `.agent/skills/agent-session-closing/SKILL.md`) to update documentation, clean up, and push changes to the repository.
* **Tool Usage:** Prefer specific tools (e.g., targeted file replacement) over rewriting entire files. Run commands non-interactively where possible.
* **Headless Build Environment:** The project is configured for Linux CLI builds without Android Studio. `ANDROID_HOME` is set to `~/Android/Sdk`.
* **Releases:** See `CLI_RELEASE_GUIDE.md` for building and distributing updates via GitHub or Google Play Console.
