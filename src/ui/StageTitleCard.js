import { Container, Text } from 'pixi.js';

// Stage title + victim caption (issue #20).
// Boot animation:
//   PHASE 1 (0 → FADE_IN_MS):       title fades in top-center
//   PHASE 2 (… → +HOLD_MS):          held at full opacity, centered
//   PHASE 3 (… → +FADE_OUT_MS):      title shrinks and translates to a
//                                    persistent top-right corner anchor;
//                                    caption stays under it
//   PHASE 4 (steady):                title + caption persist in top-right
//
// Caption (victim displayName + crimeBlurb) appears under the title from the
// start of PHASE 2 onward and remains in the corner with the title.
//
// Animation is driven off app.ticker via an internal listener (NOT setTimeout
// or GameLoop). Driver pattern matches the project's "no wallclock timers"
// rule. We accept the ticker in the constructor for explicitness.

const FADE_IN_MS = 800;
const HOLD_MS = 2000;
const FADE_OUT_MS = 700;

// Logical canvas width — matches CANVAS.WIDTH in placeholders.js. We use
// window.innerWidth for screen-space anchoring (same as SightMeter does).
const FALLBACK_W = 1280;

const TITLE_FONT_BIG = 32;
const TITLE_FONT_SMALL = 20;
const CAPTION_FONT = 14;
const BLURB_FONT = 14;

const COLOR_TITLE = 0xe8dfc4;
const COLOR_CAPTION = 0xbfb59a;

const PAD_TOP_BIG = 64;       // centered intro position
// QA fix 2026-05-30 evening: bumped corner top padding 8 → 64 so the title
// card parks BELOW the SightMeter (which is at top-right, ~y=32–56). Title
// + SightMeter were visually colliding at top-right corner.
const PAD_TOP_CORNER = 64;
// QA fix 2026-05-30 evening: keep right padding at 24 — the apparent overflow
// was actually a top-right COLLISION with the SightMeter, fixed by bumping
// PAD_TOP_CORNER below the meter. PAD_RIGHT_CORNER stays modest so text reads
// near the corner.
const PAD_RIGHT_CORNER = 24;
const LINE_GAP = 4;
// Min font floor for the corner-clamp shrink loop — never go below this.
const TITLE_FONT_MIN = 16;
const CAPTION_FONT_MIN = 11;
const BLURB_FONT_MIN = 11;
// Reserve at least this much horizontal breathing room on the LEFT of the
// corner card so it can't span the whole viewport at narrow widths.
const MIN_LEFT_BREATHING = 24;

export class StageTitleCard {
  constructor({ stageData, ticker }) {
    this.view = new Container();
    this.view.label = 'stage-title-card';

    const displayName = stageData?.displayName ?? 'Untitled Stage';
    const victimName = stageData?.victim?.displayName ?? '';
    const crimeBlurb = stageData?.victim?.crimeBlurb ?? '';

    this._title = new Text({
      text: displayName,
      style: {
        fontFamily: 'serif',
        fontSize: TITLE_FONT_BIG,
        fontWeight: '600',
        fill: COLOR_TITLE,
        align: 'center',
      },
    });
    this._title.anchor.set(0.5, 0);
    this.view.addChild(this._title);

    this._caption = new Text({
      text: victimName,
      style: {
        fontFamily: 'serif',
        fontSize: CAPTION_FONT,
        fill: COLOR_CAPTION,
        align: 'center',
      },
    });
    this._caption.anchor.set(0.5, 0);
    this.view.addChild(this._caption);

    this._blurb = new Text({
      text: crimeBlurb,
      style: {
        fontFamily: 'serif',
        fontSize: BLURB_FONT,
        fontStyle: 'italic',
        fill: COLOR_CAPTION,
        align: 'center',
      },
    });
    this._blurb.anchor.set(0.5, 0);
    this.view.addChild(this._blurb);

    // Phase 1: caption + blurb start invisible (revealed at the start of PHASE 2).
    this._caption.alpha = 0;
    this._blurb.alpha = 0;
    this._title.alpha = 0;

    this._elapsedMs = 0;
    this._ticker = ticker;
    this._onTick = (t) => {
      const dtMs = t?.deltaMS ?? 16.6667;
      this._advance(Math.min(dtMs, 50));
    };
    ticker.add(this._onTick);

    this._onResize = () => this._layout();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onResize);
    }

    this._layout();
  }

  _advance(dtMs) {
    this._elapsedMs += dtMs;
    const e = this._elapsedMs;
    const t1End = FADE_IN_MS;
    const t2End = FADE_IN_MS + HOLD_MS;
    const t3End = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;

    if (e < t1End) {
      // Phase 1: title fade-in only.
      const t = e / FADE_IN_MS;
      this._title.alpha = t;
      this._caption.alpha = 0;
      this._blurb.alpha = 0;
      this._setTitleSize(TITLE_FONT_BIG);
      this._setLayoutAnchor('center');
    } else if (e < t2End) {
      // Phase 2: hold. Caption + blurb fade in over first 300ms of the hold.
      const tHold = (e - t1End) / Math.min(300, HOLD_MS);
      const k = Math.min(1, tHold);
      this._title.alpha = 1;
      this._caption.alpha = k;
      this._blurb.alpha = k;
      this._setTitleSize(TITLE_FONT_BIG);
      this._setLayoutAnchor('center');
    } else if (e < t3End) {
      // Phase 3: shrink + translate to top-right corner.
      const t = (e - t2End) / FADE_OUT_MS;
      const fontSize = TITLE_FONT_BIG + (TITLE_FONT_SMALL - TITLE_FONT_BIG) * t;
      this._setTitleSize(fontSize);
      this._title.alpha = 1;
      this._caption.alpha = 1;
      this._blurb.alpha = 1;
      this._setLayoutAnchor('blend', t);
    } else {
      // Phase 4: parked in corner. Stop ticking to save cycles.
      this._setTitleSize(TITLE_FONT_SMALL);
      this._setLayoutAnchor('corner');
      this._title.alpha = 1;
      this._caption.alpha = 1;
      this._blurb.alpha = 1;
      if (this._ticker) {
        this._ticker.remove(this._onTick);
        this._ticker = null;
      }
    }
  }

  _setTitleSize(px) {
    if (this._title.style.fontSize !== px) {
      this._title.style.fontSize = px;
    }
  }

  // mode = 'center' | 'corner' | 'blend' (with t param 0→1)
  _setLayoutAnchor(mode, t = 0) {
    const w =
      typeof window !== 'undefined' && window.innerWidth
        ? window.innerWidth
        : FALLBACK_W;

    // POLISH PASS 2026-05-30 (late): when we're parked in the corner, shrink
    // fonts so the widest of {title, caption, blurb} fits within
    // (w - PAD_RIGHT_CORNER - MIN_LEFT_BREATHING). Center / blend modes keep
    // the running interpolated sizes — they're transient and the corner clamp
    // will run once the parked state is reached.
    if (mode === 'corner') {
      this._clampCornerFontsToFit(w);
    }

    // Center position: title pinned to top-center, ~PAD_TOP_BIG down.
    const centerX = Math.round(w / 2);
    const centerY = PAD_TOP_BIG;

    // Corner position: right-anchored, PAD_TOP_CORNER down. The Text anchors
    // are (0.5, 0), so we still position by what corresponds to the title
    // center-x. Right-edge = w - PAD_RIGHT_CORNER; we offset by half title
    // width to read as right-aligned.
    const cornerCenterX = w - PAD_RIGHT_CORNER - this._title.width / 2;
    const cornerY = PAD_TOP_CORNER;

    let titleX, titleY;
    if (mode === 'center') {
      titleX = centerX;
      titleY = centerY;
    } else if (mode === 'corner') {
      titleX = cornerCenterX;
      titleY = cornerY;
    } else {
      titleX = centerX + (cornerCenterX - centerX) * t;
      titleY = centerY + (cornerY - centerY) * t;
    }

    this._title.x = titleX;
    this._title.y = titleY;

    // POLISH PASS: caption + blurb get their OWN right-anchored center-x in
    // corner mode so a long crime-blurb doesn't push past the right edge
    // even when the title is shorter than the blurb.
    let captionX = titleX;
    let blurbX = titleX;
    if (mode === 'corner') {
      captionX = w - PAD_RIGHT_CORNER - this._caption.width / 2;
      blurbX = w - PAD_RIGHT_CORNER - this._blurb.width / 2;
    } else if (mode === 'blend') {
      const captionCorner = w - PAD_RIGHT_CORNER - this._caption.width / 2;
      const blurbCorner = w - PAD_RIGHT_CORNER - this._blurb.width / 2;
      captionX = centerX + (captionCorner - centerX) * t;
      blurbX = centerX + (blurbCorner - centerX) * t;
    }

    // Caption + blurb stack under the title.
    const captionY = titleY + this._title.height + LINE_GAP;
    this._caption.x = captionX;
    this._caption.y = captionY;

    const blurbY = captionY + this._caption.height + LINE_GAP;
    this._blurb.x = blurbX;
    this._blurb.y = blurbY;
  }

  // POLISH PASS 2026-05-30 (late): shrink title/caption/blurb font sizes
  // until the widest one fits in (w - PAD_RIGHT_CORNER - MIN_LEFT_BREATHING).
  // Bounded by TITLE_FONT_MIN / CAPTION_FONT_MIN / BLURB_FONT_MIN floors. We
  // shrink ALL three proportionally (2px at a time) so they stay visually
  // balanced. PIXI Text width updates synchronously after a fontSize change.
  _clampCornerFontsToFit(w) {
    const available = w - PAD_RIGHT_CORNER - MIN_LEFT_BREATHING;
    if (available <= 0) return;

    // Always start from the corner-mode baseline sizes; otherwise repeated
    // resizes would compound shrinkage.
    let titleSize = TITLE_FONT_SMALL;
    let captionSize = CAPTION_FONT;
    let blurbSize = BLURB_FONT;
    this._setTitleSize(titleSize);
    this._setCaptionSize(captionSize);
    this._setBlurbSize(blurbSize);

    // Bail fast if nothing overflows.
    if (
      this._title.width <= available &&
      this._caption.width <= available &&
      this._blurb.width <= available
    ) {
      return;
    }

    // Shrink loop — 2px steps, bounded by per-text floors. Worst-case
    // ~5 iterations from 20→16 / 14→11.
    let iter = 0;
    while (iter < 8) {
      const titleFits = this._title.width <= available;
      const captionFits = this._caption.width <= available;
      const blurbFits = this._blurb.width <= available;
      if (titleFits && captionFits && blurbFits) return;

      let didShrink = false;
      if (!titleFits && titleSize - 2 >= TITLE_FONT_MIN) {
        titleSize -= 2;
        this._setTitleSize(titleSize);
        didShrink = true;
      }
      if (!captionFits && captionSize - 1 >= CAPTION_FONT_MIN) {
        captionSize -= 1;
        this._setCaptionSize(captionSize);
        didShrink = true;
      }
      if (!blurbFits && blurbSize - 1 >= BLURB_FONT_MIN) {
        blurbSize -= 1;
        this._setBlurbSize(blurbSize);
        didShrink = true;
      }
      if (!didShrink) return; // hit floors — accept residual overflow
      iter++;
    }
  }

  _setCaptionSize(px) {
    if (this._caption.style.fontSize !== px) {
      this._caption.style.fontSize = px;
    }
  }

  _setBlurbSize(px) {
    if (this._blurb.style.fontSize !== px) {
      this._blurb.style.fontSize = px;
    }
  }

  _layout() {
    // Re-trigger current-phase layout on resize.
    const e = this._elapsedMs;
    if (e < FADE_IN_MS + HOLD_MS) {
      this._setLayoutAnchor('center');
    } else if (e < FADE_IN_MS + HOLD_MS + FADE_OUT_MS) {
      const t = (e - FADE_IN_MS - HOLD_MS) / FADE_OUT_MS;
      this._setLayoutAnchor('blend', t);
    } else {
      this._setLayoutAnchor('corner');
    }
  }

  destroy() {
    if (this._ticker) {
      this._ticker.remove(this._onTick);
      this._ticker = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onResize);
    }
    this.view.destroy({ children: true });
  }
}
