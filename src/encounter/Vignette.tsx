/**
 * A fixed, edge-darkening (or edge-greying in light mode) radial overlay.
 * Pulls the eye gently toward center. Pointer-events: none.
 */
export function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 45%, var(--encounter-vignette) 100%)",
      }}
    />
  );
}
