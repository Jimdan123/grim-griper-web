---
title: Reaper's Debt — Stage Roster
status: stage-1-mvp; stages-2-6-post-mvp (re-reverted 2026-05-30)
---

# Stage Roster

Medieval gothic, plague era. One Reaper. Many debts.

**The MVP ships stage 1 only — The Confession Room.** Stages 2–6 are post-MVP roadmap, sketched under `docs/narrative/post-mvp/<stage>.md` and tracked by tickets #13–17 with `status: post-mvp`. The 2026-05-30 morning expansion to all 6 stages was reverted the same afternoon after the slice-1 + slice-2 combined play-test surfaced narrative-framing gaps that proved out the Team Lead persona's *"six great Stages beats nine uneven ones — cut Stages, don't dilute them"* discipline. Polish stage 1 (Father Aldric, full Phase 1 + Phase 2 + scoring) before adding more.

**Architecture invariant:** every stage uses the same 4-haunt vocabulary (`SHATTER`, `VOICE`, `WHISPER`, `RISE`), the same Phase 1 → Phase 2 → Score loop, and the same `stage.json` schema. Stages differ in **setting, waypoint kinds, evidence flavor, victim personality bias, and per-stage haunt → waypoint mapping**.

The haunt-to-waypoint mapping is **per-stage data**, not a global constant. The Confession Room maps `SHATTER→Altar`; the Apothecary's Loft maps `SHATTER→Counter`. The rule "correct waypoint = +35 fear" is the constant; *which* waypoint is correct for which haunt is authored per stage.

## Roster

| # | Stage | Doc | Victim | Crime (one line) |
|---|---|---|---|---|
| 1 | Confession Room | [`confession-room.md`](confession-room.md) | Father Aldric, priest | Four-stage racket on dying parishioners |
| 2 | Apothecary's Loft | [`post-mvp/apothecary.md`](post-mvp/apothecary.md) | Mistress Bryn, apothecary | Mislabeled cures for profit; harvests organs from the dead |
| 3 | Magistrate's Hall | [`post-mvp/magistrate.md`](post-mvp/magistrate.md) | Lord Vesry, magistrate | Sells verdicts; condemns innocents to seize their property |
| 4 | Mill on the Bog | [`post-mvp/mill.md`](post-mvp/mill.md) | Goodman Rauk, miller | Grinds bones into flour during famine, sells to nobles |
| 5 | Surgeon's Tent | [`post-mvp/surgeon.md`](post-mvp/surgeon.md) | Brother Carrion, surgeon | Lets the wounded die for their gear; fakes triage |
| 6 | Schoolmaster's Loft | [`post-mvp/schoolmaster.md`](post-mvp/schoolmaster.md) | Master Ode, cathedral schoolmaster | Abuses choirboys; buries them in cathedral walls |

## Roster-level design rules

- **One scene per victim.** Each stage is a single hand-authored room/space (not a multi-room level). Player parses the space in 5–8 minutes.
- **Visual variety.** No two stages should read the same at thumbnail. Different palette, different waypoint silhouettes, different evidence object grammar.
- **Tonal continuity.** All stages are quiet, dispassionate horror. The Reaper does not gloat. Ghost replays are silent re-enactments of *what already happened*.
- **Victim personality bias variety.** Each victim biases one of the four reaction states (NEUTRAL/AGGRESSIVE/FLEEING/CALLING_FOR_HELP) with a per-stage probability. The bias should fit the character — Aldric calls for help (public priest); the magistrate gets aggressive (used to power); the miller flees (peasant instinct); the schoolmaster calls for help (institutional cover); the surgeon goes aggressive (battlefield-hardened); the apothecary flees (lone operator, no allies).
- **Reaper stays spectral.** Never a slasher. Across all six stages he is the *quiet consequence*, not the violence. See [`reference-happy-hills-touchstone`](../../../.claude/projects/-Users-khangnguyen-Documents-Grip-Griper-game-grim-griper/memory/reference_happy_hills_touchstone.md) memory.

## Out of scope (for the roster itself)

- Story arc connecting the six victims. They are independent debts. A future build may thread them; the MVP roster does not commit to it.
- Player-character (Reaper) backstory. He is the function, not a character with a journey, in this generation.
- Stage-unlock progression / hub UI. Each stage is selectable from the main menu in the post-MVP build; ordering rules are not part of this roster doc.
