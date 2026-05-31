/**
 * Left-aligned "AI is typing" bubble: three dots that pulse independently.
 * Duration is controlled by the parent (it just unmounts us).
 */
export function TypingIndicator() {
  return (
    <div className="flex w-full justify-start">
      <div
        className="inline-flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{
          background: "var(--encounter-bubble)",
          color: "var(--encounter-ink-faint)",
        }}
        aria-label="typing"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: "currentColor",
              animation: `encounter-typing-dot 1300ms ease-in-out ${i * 220}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
