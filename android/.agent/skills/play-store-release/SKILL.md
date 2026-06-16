---
name: Play Store Release Management
description: Pointer — Play Console release guidance is now a generalized, family-wide skill in hora-core. This stub keeps only the Varisankya-specific track facts.
---

# Play Store Release Strategy

Generalized into the Hora-family shared repo. **Canonical version** (richer — it also
covers the App Signing SHA fix for tester sign-in, store-icon vs launcher-icon, track
promotion, version-code precedence, and the launch-day exception):
`hora-core/.github/skills/hora-play-store/SKILL.md`.

## Varisankya specifics

- **Default pre-release target is open Beta / Open Testing** — `./gradlew :app:publishBundle`
  (GPP `track` defaults to `beta`). A pre-release means a GitHub pre-release **and** a Play
  Open Testing release in parallel.
- **No testing gate here.** Varisankya is past Play's one-time 12-testers × 14-days gate
  (on the **production** track since v3.8), so betas publish straight to Open Testing — *not*
  gated to internal/closed. That gate is a one-time account/app unlock, not a per-release gate.
  See `AGENTS.md` "Current release state" and the wiki **Android Build & Release** page.
- **Launch day:** for an external/marketing launch, give users the direct **Production** link,
  not a Testing-track "Join Beta" link.
