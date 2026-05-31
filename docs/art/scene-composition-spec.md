---
title: Scene Composition Spec — All Stages
status: design
touchstone: The Happy Hills Homicide
owner: Scene Composition Director
---

# Scene Composition Spec — All Stages

The Happy Hills Homicide (Copperbolt, 2024) is our visual + tonal anchor for *Reaper's Debt*. It is a 2D side-view pixel-art stalker game. We are not pixel-art (yet), but the **compositional grammar** transfers cleanly to primitive shapes.

Reference sources used:
- User-supplied screenshot (`/Users/khangnguyen/.claude/image-cache/8affef59-db8a-490e-8453-bde134902b06/1.png`) — Happyhills Slaughterhouse exterior. Primary visual analysis source.
- Steam store page — [The Happyhills Homicide](https://store.steampowered.com/app/3278760/The_Happyhills_Homicide/) (palette + tone tags).
- Giant Bomb gallery — [images](https://www.giantbomb.com/the-happyhills-homicide/3030-92218/images/) (text-only access).
- Alpha Beta Gamer write-up — [download page](https://www.alphabetagamer.com/the-happyhills-homicide-alpha-download/) (tone confirmation).
- Free Game Planet — [downloadable game](https://www.freegameplanet.com/the-happyhills-homicide-downloadable-game/) (genre confirmation).

This doc supersedes nothing in `docs/art/style-guide.md`; it layers *composition* on top of the palette + shape grammar already locked there.

---

## Part A — Composition rules (apply to all 6 stages)

The Happy Hills slaughterhouse frame is structured in five readable layers from camera to back. Every stage in *Reaper's Debt* must obey the same five layers.

### 1. Foreground silhouette layer (camera-edge, decor only)

1–3 props at the camera-edge that **cut off the frame**, drawn in the darkest tonal value in the scene. They sit *in front of* the action plane. They are **decor only** — never interactive, never on the navigation surface, never overlap a waypoint or evidence pickup. Purpose: depth, claustrophobia, and the "you are peering past something at the act" voyeur framing that the touchstone makes its whole identity.

- Tonal value: **darker than the chapel floor** — at or near `CHAPEL_FRAME` (`#0d0a12`).
- Placement: anchored to one canvas edge (usually left, where the eye enters in LTR cultures); never centered, never both edges (that would make a window frame, which Happy Hills explicitly avoids).
- Silhouette discipline: irregular outlines (a tipped object, a corner of a cloth, a leaning pole). Avoid clean rectangles — the foreground must look *unintended*, like a passerby's view.
- Width budget: <= 18% of canvas width, so the midground stays readable.

### 2. Midground action zone (the diorama)

Where Reaper, victim, evidence and waypoints live. Mid-tone (chapel-floor + chapel-accent range). This is the **only interactive layer**. Characters live in the floor strip; never crowd the canvas edges (keep a 80px margin to either side so the foreground silhouettes can do their job without overlapping a waypoint hitbox).

### 3. Background plate (the locked-in setting)

A flat back wall plane. Coolest-toned, slightly desaturated. Holds the architecture suggestion — pillars, doors, hung objects. No motion. Reads as "the room the act happened in."

### 4. Signage / framing element

Every Happy Hills scene has a **stage-identifier graphic**: the slaughterhouse sign with the pig logo, top-left, partially obscured by the foreground silhouette. It tells the player *where they are* in one glance and seeds the menace (a smiling pig over a slaughterhouse).

Every *Reaper's Debt* stage gets an equivalent — a hanging plaque, banner, icon, or carved emblem — sited top-left (or top-corner that matches the lighting direction). It must read at thumbnail.

### 5. Lighting direction + vignette

- **Single dominant light source per stage**, off-canvas. Pick a direction (top-left, top-right, high-center). Hold it across all of that stage's content. The reference shot uses **warm top-right** light spilling diagonally over the slaughterhouse and the masked character.
- **Vignette**: heavy dark edges. Roughly 12–15% canvas-edge darken. Implemented as either four corner alpha rects or a layered border. The vignette is what sells the stalker-cam framing — without it the scene reads as a stage, not a peephole.

### Color discipline

60–70% **muted base palette** (the stage's wall + floor + foreground silhouettes — all dark, all desaturated). 1–2 **strategic warm accent colors** that re-occur 2–4 times per scene, never more. In Happy Hills the accents are the **pig pink** (sign), the **red truck**, the **red flannel shirt** — three placements of the same chromatic family, anchoring the eye. Each *Reaper's Debt* stage picks its own 1–2 accent colors and re-uses them.

### Character placement (universal)

- Characters live in the midground floor strip, vertically pinned to the floor line.
- Never within 80px of either canvas edge (the foreground silhouettes own that real estate).
- Reaper occupies the deepest shadow plane (already enforced by `REAPER_BODY`).
- Victim is the **lightest object in frame** by value (already enforced by `ALDRIC_BODY`).

### Anti-slasher discipline (universal)

No blood splatter, no bone piles, no gore visuals in the present-tense scene. Implications only — a stained chalice, a lime-dusted spade, a closed basin. The horror is *what the prop implies*, not what the prop depicts. Ghost replays may show *the act in silhouette* but never with arterial spray or wound geometry.

---

## Part B — Per-stage composition

### B.1 Confession Room (MVP)

1. **Foreground prop set** — three darks at the left edge:
   - A tipped candelabra leaning into the frame from off-canvas-bottom-left, drawn as a tall thin silhouette with two small horizontal arm-stubs.
   - A fallen prayer book at floor level, a squat rectangle tilted off-axis.
   - An altar cloth corner draping from the top-left, a triangular silhouette hanging into the frame.
2. **Midground action zone** — the existing `chapelBounds` (1120 × 420 from x=80,y=200). Four waypoints sit along the floor strip at the existing JSON-driven X positions.
3. **Background plate** — the existing back-wall mass + 4 pillars at 0.2/0.4/0.6/0.8 width. **Add**: a tall narrow stained-window silhouette behind the Altar (a vertical dark-cool rect with a faint warm-yellow inset — the implied "window").
4. **Signage / framing element** — a **hanging cross plaque** top-left, on the wall above the foreground silhouettes. A thin vertical rect + horizontal cross-bar, painted in `CHAPEL_WALL_TRIM` so it reads as carved stone, with a single warm pixel glint (catchlight) on the cross-bar.
5. **Lighting direction + source** — **high-left candle catchlight** (matching the Happy Hills top-right direction but mirrored to match the cross-plaque corner). Implemented as a soft warm rect/gradient simulating candle bloom on the wall near the cross. Color: warm gold (~`#a07840`).
6. **Accent color palette** — **warm gold candle bloom** + **chalice gleam** (already in palette as `EVIDENCE.CHALICE` and `EVIDENCE_GLOW`). Three placements: cross-plaque glint, lighting accent rect, chalice highlight. No further warm accents.
7. **Tone vignette** — standard 12–15% edge darken, slightly heavier on the bottom corners (the player is peering *down* into the chapel from a high vantage).
8. **Anti-slasher discipline** — the chalice is *stained*, never bloody. The spade is *lime-dusted*, never red-stained. Quicklime cream is the visual euphemism for what's actually being covered up.

### B.2 Apothecary's Loft (sketch)

1. **Foreground prop set** — a swinging bundle of dried herbs hanging from the top edge (long thin silhouette), a tipped mortar at the floor edge, a stool back.
2. **Midground action zone** — narrower than the chapel (timber-framed shop is intimate). Waypoints: Counter (front), Hearth (left), Shelf (back wall, runs full width), Trapdoor (right floor seam).
3. **Background plate** — a tall grid of shelf jars across the back wall as the primary readability anchor. Each jar a small flat rect, all on a single hung shelf line.
4. **Signage / framing element** — a **hanging mortar-and-pestle plaque** top-left, swinging on a chain (the shop sign).
5. **Lighting direction + source** — single **hearth-flame key-light** from low-left. Trapdoor is the only cold pool in the room (light does not reach it).
6. **Accent color palette** — **warm hearth orange** + **trapdoor cold cyan** (the only cold note in an otherwise warm room — narrative tells the eye "danger lives here").
7. **Tone vignette** — heavy on right edge (where the trapdoor is — the dark literally pools where the bodies go).
8. **Anti-slasher discipline** — no organs visible. The mortar is *stained*, not red. The trapdoor is a flush seam, opens only in ghost replay.

### B.3 Magistrate's Hall (sketch)

1. **Foreground prop set** — an iron-railed dock railing cutting up from the bottom edge (vertical bars in silhouette), a corner of a chained ledger on the left.
2. **Midground action zone** — wide and tall (vertical-dominant). Waypoints: Bench (back-right, raised), Dock (front-left), Hearth (left wall), Window (back-center).
3. **Background plate** — a tall window with a gallows-hill silhouette beyond — the visual anchor of the room, dominates the upper-center.
4. **Signage / framing element** — a **carved royal seal** plaque mounted above the bench, top-right (lighting direction reversed for this stage).
5. **Lighting direction + source** — **cold high-back window light** from top-center. Branding iron in hearth glows red as a secondary warm pool.
6. **Accent color palette** — **branding-iron red** + **gallows-hill cold blue-grey**. Red used sparingly: hearth coals + verdict-seal wax.
7. **Tone vignette** — top corners heavy (the ceiling presses down on the accused).
8. **Anti-slasher discipline** — the iron is *glowing*, never shown pressed against skin in the present scene. Gallows on the hill silhouette only — no figures hanging.

### B.4 Mill on the Bog (sketch)

1. **Foreground prop set** — a stack of flour sacks at left foreground (lumpy silhouette), a low coil of rope at the floor edge.
2. **Midground action zone** — vertical-dominant (millstone, hopper, sluice, beams). Waypoints: Millstone (center-left, only constantly-moving object), Sacks (right), Sluice (front-floor), Window (back-right looking onto bog).
3. **Background plate** — a **flat near-black bog band** along the lower third visible through the window. In ghost replays, faint pale shapes drift in it.
4. **Signage / framing element** — a **hanging wheat-bundle icon** plaque top-left, painted in faded ochre — the miller's guild mark.
5. **Lighting direction + source** — **dim grey window light** from back-right (overcast bog daylight). The millstone is the only consistent shadow-caster.
6. **Accent color palette** — **bone cream** (the actual flour color, doubles as the lime-dust callback) + **bog-water cold near-black**. Cream re-occurs on sack stripes, hopper edge, and the bone evidence.
7. **Tone vignette** — heavy on bottom edge (the bog is pulling down).
8. **Anti-slasher discipline** — bones inside sacks not visible until ghost replay. The bog shows pale shapes only as silhouettes under water, never as faces.

### B.5 Surgeon's Tent (sketch)

1. **Foreground prop set** — a tent rope/stake at left edge (taut diagonal line), a stacked crate corner.
2. **Midground action zone** — canvas-walled, light bleeds through. Waypoints: Board (center, the operating table), Sawrack (left wall), Basin (front-right), Loot (back-right crates).
3. **Background plate** — **canvas tent wall as the brightest surface in the scene** (inversion of all other stages — light comes *through* the back). Carrion is silhouetted against it.
4. **Signage / framing element** — a **hanging surgeon's caduceus** banner top-left, painted in faded red on canvas.
5. **Lighting direction + source** — **diffuse back-lit canvas** (the only stage with rear lighting). Foreground props are darkest because the light is behind them.
6. **Accent color palette** — **iron grey** (saw rack, blades) + **muted blood-rust brown** (basin water, leather straps). Red used only as rust, never as fresh blood.
7. **Tone vignette** — heavy on the back-flap area (the corpse-pile is implied to be just beyond that darker patch).
8. **Anti-slasher discipline** — no visible bodies in the present scene. The pile outside the back flap is *implied* — visible only in ghost replays. The board is empty in the present.

### B.6 Schoolmaster's Loft (sketch)

1. **Foreground prop set** — a single **choir-bench corner** silhouette at left edge, a stack of hymnbooks at floor.
2. **Midground action zone** — enclosed, low-ceilinged, narrow. Waypoints: Desk (left), Choir (front-center bench row), Niche (back-right wall recess, subtly inset), Window (back-left, high).
3. **Background plate** — a **stone wall with the bricked niche subtly inset** as a slightly differently-toned square seam. Visible at all times, only *meaningful* once the ghost replay shows what's inside.
4. **Signage / framing element** — a **hanging hymnal icon** plaque top-left (a small open-book silhouette with a cross above it).
5. **Lighting direction + source** — **single bright pool from the high window** at back-left. The rest of the loft is candle-shadow.
6. **Accent color palette** — **window-pool cold white** (the only bright thing in the loft) + **cane-polish warm brown**.
7. **Tone vignette** — heaviest of any stage — top + side corners both pulled dark, sells the claustrophobia.
8. **Anti-slasher discipline** — **CRITICAL FLAG.** The foreground "choir-bench corner" silhouette must NOT read as a child-shaped silhouette. The bench corner is geometric (rectangular slats), never figurative. The niche must NOT show any contents in the present scene; even the seam is *subtle*, not a body-shaped outline. **Design review required before authoring** — see report.

---

## Part C — Confession Room implementation plan (MVP scope)

Apply Part B.1 to slice-1 placeholders. All edits in `src/art/placeholders.js`. Foundation (`src/stage/Stage.js`, `src/main.js`) wires the new factories — that integration is **not** done by this role.

### Palette additions (~6 LOC)

```js
// Composition layer (Happy Hills touchstone — see docs/art/scene-composition-spec.md)
COMPOSITION: {
  FOREGROUND_SILHOUETTE: 0x0d0a12,  // = CHAPEL_FRAME tone; the darkest thing in scene
  CANDLE_WARM: 0xa07840,            // soft warm bloom for lighting accent
  CANDLE_WARM_CORE: 0xc9a24a,       // brighter inner core of the bloom
  VIGNETTE: 0x000000,               // edge-darken overlay tone; alpha applied at draw
  CROSS_PLAQUE: 0x352a40,           // = CHAPEL_WALL_TRIM; carved-stone read
  STAINED_WINDOW_GLOW: 0x6a4a2a,    // dim warm inset of the implied stained-glass
},
```

### Factories to add (~120 LOC total)

1. **`createConfessionRoomForeground()`** — returns a `Container` with three dark silhouettes anchored at the canvas left edge. Draws:
   - tipped candelabra (tall thin vertical rect + two horizontal arm-stubs)
   - fallen prayer book (low squat rect, rotated 15deg)
   - draped altar-cloth corner (triangle from top-left)
   - All filled `COMPOSITION.FOREGROUND_SILHOUETTE`.
   - Container has `label = 'confession-room-foreground'`. Pivot = (0, 0); caller places at world (0, 0).
   - **Wiring:** Foundation must add this to `world` *after* the chapel background but *before* the characters/waypoints (so it sits in front compositionally — but it's decor, so collision/interaction layers don't touch it).

2. **`createConfessionRoomSignage()`** — returns a `Container` with a hanging cross plaque. Draws:
   - small vertical rect + horizontal cross-bar (filled `COMPOSITION.CROSS_PLAQUE`)
   - 2x2 catchlight pixel of `COMPOSITION.CANDLE_WARM_CORE` on the cross-bar
   - Container has `label = 'confession-room-signage'`. Caller places at world (~70, ~40) so it sits top-left above the foreground silhouettes.
   - **Wiring:** Foundation adds to `world` near the background layer.

3. **`createLightingAccent()`** — returns a `Container` simulating candle bloom on the wall. Draws:
   - one large softer rect (alpha 0.18, `COMPOSITION.CANDLE_WARM`) — outer bloom
   - one smaller brighter rect (alpha 0.35, `COMPOSITION.CANDLE_WARM_CORE`) — inner bloom
   - Container `label = 'lighting-accent'`. Caller places near the cross plaque (high-left). Pivot = (0,0).
   - **Wiring:** Foundation adds to `world` above the background pillars but below the foreground silhouettes.

4. **`createVignette()`** — returns a `Container` of 4 alpha-rect borders (top, bottom, left, right). Each rect is `COMPOSITION.VIGNETTE` (black) with a graded alpha (~0.55 at the edge, fading toward 0 — implemented as 3 stacked rects per side with stepped alpha for a poor-man's gradient). Container `label = 'vignette'`. Caller adds to `app.stage` (NOT `world`) so it sits *above* everything including UI candidates.
   - Bottom corners get an extra ~12% alpha (Part B.1 §7).
   - **Wiring:** Foundation calls `app.stage.addChild(vignette)` *last*, after the world and any UI is mounted.

5. **`createStainedWindowSilhouette()`** — returns a `Container` with a tall narrow rect behind where the Altar sits. Outer rect `CHAPEL_FRAME` (silhouette of the window frame), inner rect `COMPOSITION.STAINED_WINDOW_GLOW` (the dim warm inset). Container `label = 'stained-window'`. Caller places at the back wall above the Altar waypoint x position.
   - **Wiring:** Foundation adds to `world` between the background wall and the pillars.

### Estimated LOC: ~140 lines added to `src/art/placeholders.js`. No deletions; no edits to existing factories.

### What Foundation must add (integration checklist)

In `src/stage/Stage.js` or `src/main.js`, after the existing world build:

```js
// Background-plate addition (between chapel background and pillars)
const stainedWindow = createStainedWindowSilhouette();
stainedWindow.x = <altar waypoint x - 30>;
stainedWindow.y = <floorTopY - 220>;
world.addChild(stainedWindow);

// Signage (top-left, sits on the wall)
const signage = createConfessionRoomSignage();
signage.x = 70;
signage.y = 40;
world.addChild(signage);

// Lighting accent (top-left, on the wall near the cross)
const lighting = createLightingAccent();
lighting.x = 30;
lighting.y = 30;
world.addChild(lighting);

// Foreground silhouettes (left canvas edge, in FRONT of characters)
const foreground = createConfessionRoomForeground();
world.addChild(foreground);  // added last in world => renders on top of midground

// Vignette (on app.stage, above everything)
const vignette = createVignette();
app.stage.addChild(vignette);
```

The foreground container is added to `world` *last* so PIXI's default render order puts it in front of waypoints/characters. If Foundation needs the foreground to *not* obscure interactive markers, they can `zIndex`-sort or move the foreground to a sibling container above world but below stage.

---

## Out of scope

- Texture upgrade pass (textures, sprite sheets) — not in MVP, see `docs/art/style-guide.md` §"Out of scope".
- Per-stage post-MVP implementation — Part B.2–B.6 are sketches only; implementation gated on MVP play-test sign-off.
- Animation of any composition layer (candle flicker, herb-sway, millstone-turn). Static only in MVP.
