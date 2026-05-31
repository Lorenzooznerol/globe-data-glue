import { useEffect, useRef, useState } from "react";
import { useAtlasStore } from "@/atlas/store";
import { Line } from "../Line";

interface Props {
  onSubmit: (name: string) => void;
}

/**
 * Step 1 — Nickname gate.
 *  - Greeting types itself in letter-by-letter (~40ms/char) once on load.
 *  - Inline editable field rendered as dashes with a faded "nickname" placeholder above.
 *  - Submit on Enter.
 *  - After 5s of silence post-first-keystroke, fade in a small ↵ glyph hint.
 */
export function NicknameGate({ onSubmit }: Props) {
  const reduced = useAtlasStore((s) => s.reducedMotion);
  const greeting = "Hi";
  const [typedCount, setTypedCount] = useState(reduced ? greeting.length : 0);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const firstKeyAtRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Type the greeting in letter-by-letter.
  useEffect(() => {
    if (reduced) return;
    if (typedCount >= greeting.length) return;
    const id = window.setTimeout(() => setTypedCount((n) => n + 1), 90);
    return () => window.clearTimeout(id);
  }, [typedCount, reduced]);

  // After greeting is in, autofocus.
  useEffect(() => {
    if (typedCount >= greeting.length) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 250);
      return () => window.clearTimeout(id);
    }
  }, [typedCount]);

  // 5s-after-first-keystroke hint.
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (firstKeyAtRef.current == null && next.length > 0) {
      firstKeyAtRef.current = Date.now();
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = window.setTimeout(() => setHintVisible(true), 5000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const trimmed = value.trim();
      if (trimmed.length === 0) return;
      onSubmit(trimmed);
    }
  }

  const greetingShown = greeting.slice(0, typedCount);
  const greetingReady = typedCount >= greeting.length;
  const showPlaceholder = !focused && value.length === 0;

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="relative inline-flex items-baseline gap-3 text-3xl leading-tight sm:text-4xl">
        <span className="font-serif italic">
          {greetingShown}
          {!reduced && !greetingReady && (
            <span
              aria-hidden
              className="ml-[1px] inline-block w-[2px] animate-pulse align-baseline"
              style={{ background: "var(--encounter-ink)", height: "1em" }}
            />
          )}
        </span>

        {greetingReady && (
          <span
            className="relative inline-block align-baseline"
            style={{ minWidth: "8ch" }}
          >
            {showPlaceholder && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-serif italic"
                style={{
                  color: "var(--encounter-ink-faint)",
                  top: "-1.4em",
                  fontSize: "0.55em",
                  letterSpacing: "0.18em",
                }}
              >
                nickname
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={value}
              maxLength={40}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Your nickname"
              className="w-full border-0 bg-transparent text-center font-serif italic outline-none"
              style={{
                color: "var(--encounter-ink)",
                caretColor: "var(--encounter-ink)",
                fontSize: "inherit",
                lineHeight: "inherit",
              }}
            />
            {/* Dash baseline beneath the field */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0"
              style={{
                bottom: "-0.05em",
                height: "1px",
                background:
                  showPlaceholder || value.length === 0
                    ? "var(--encounter-ink-faint)"
                    : "var(--encounter-rule)",
              }}
            />
          </span>
        )}
      </div>

      {greetingReady && hintVisible && (
        <Line
          delay={0}
          duration={700}
          className="font-serif text-xs italic"
        >
          <span style={{ color: "var(--encounter-ink-faint)" }}>press ↵</span>
        </Line>
      )}
    </div>
  );
}
