const VALID_HAUNT_IDS = new Set(['RISE', 'WHISPER', 'SHATTER', 'VOICE']);

const FALLBACK = {
  id: 'confession-room',
  displayName: 'The Confession Room',
  chapelBounds: { x: 80, y: 200, width: 1120, height: 420 },
  waypoints: [
    { id: 'altar', label: 'Altar', x: 220, kind: 'Altar' },
    { id: 'lectern', label: 'Lectern', x: 500, kind: 'Lectern' },
    { id: 'confessionBooth', label: 'Confession Booth', x: 780, kind: 'ConfessionBooth' },
    { id: 'sacristy', label: 'Sacristy', x: 1060, kind: 'Sacristy' },
  ],
  evidence: [],
  victim: null,
  doors: { x: 1180 },
};

export async function loadStage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`stage fetch ${res.status}`);
    const data = await res.json();
    return normalize(data);
  } catch (err) {
    console.warn(`[StageLoader] using fallback (${err.message})`);
    return normalize(FALLBACK);
  }
}

function normalize(data) {
  // PRD Resolved Design Q5: the `fallback` key must be ABSENT from
  // victim.personality.bias — wrong-waypoint else-branch is the haunt's primary
  // tendency, not a per-victim fallback. Reject loudly on load.
  const bias = data?.victim?.personality?.bias;
  if (bias && Object.prototype.hasOwnProperty.call(bias, 'fallback')) {
    throw new Error(
      '[StageLoader] victim.personality.bias.fallback is forbidden (PRD Resolved Q5). ' +
        "Remove the 'fallback' key — the else-branch is the haunt's primary reaction tendency.",
    );
  }

  const merged = {
    ...FALLBACK,
    ...data,
    chapelBounds: { ...FALLBACK.chapelBounds, ...(data.chapelBounds || {}) },
    waypoints:
      data.waypoints && data.waypoints.length
        ? data.waypoints.map((w) => ({ ...w }))
        : FALLBACK.waypoints.map((w) => ({ ...w })),
    evidence: Array.isArray(data.evidence)
      ? data.evidence.map((e) => ({ ...e })).filter((e) => validateEvidence(e, data.waypoints))
      : [],
    victim: data.victim ? { ...data.victim } : null,
    doors: { ...FALLBACK.doors, ...(data.doors || {}) },
  };
  return merged;
}

function validateEvidence(evidence, waypoints) {
  if (!evidence.id || !evidence.hauntId) {
    console.warn(`[StageLoader] evidence missing id/hauntId — skipping`, evidence);
    return false;
  }
  if (!VALID_HAUNT_IDS.has(evidence.hauntId)) {
    console.warn(`[StageLoader] evidence ${evidence.id} has invalid hauntId ${evidence.hauntId} — skipping`);
    return false;
  }
  if (
    !Number.isFinite(evidence.x) ||
    !Number.isFinite(evidence.y) ||
    !Number.isFinite(evidence.ghostX) ||
    !Number.isFinite(evidence.ghostY)
  ) {
    console.warn(`[StageLoader] evidence ${evidence.id} missing x/y/ghostX/ghostY — skipping`);
    return false;
  }
  // hauntSourceWaypointId validation is non-fatal (slice 3 concern).
  if (evidence.hauntSourceWaypointId && Array.isArray(waypoints)) {
    const found = waypoints.some((w) => w.id === evidence.hauntSourceWaypointId);
    if (!found) {
      console.warn(
        `[StageLoader] evidence ${evidence.id} hauntSourceWaypointId ${evidence.hauntSourceWaypointId} ` +
          `does not match any waypoint — keeping anyway (slice 3 concern)`,
      );
    }
  }
  return true;
}
