/**
 * The honest counterpart to the judgment. A browser tab cannot self-close
 * once the user navigated here, so this blank state IS the close: a single
 * cold word, no controls. Reloading is the only way back — that small
 * friction is the point.
 */
export function Goodbye() {
  return (
    <main
      className="flex min-h-[100dvh] w-full items-center justify-center"
      style={{
        background: "var(--encounter-bg)",
        color: "var(--encounter-ink-faint)",
      }}
    >
      <p
        className="font-serif text-2xl italic sm:text-3xl"
        style={{
          opacity: 0,
          animation: "encounter-fade-in 1400ms ease-out forwards",
        }}
      >
        Goodbye.
      </p>
    </main>
  );
}
