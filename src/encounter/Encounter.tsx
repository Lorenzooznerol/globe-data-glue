import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const LINE_1 = "AI forms an opinion of you.";
const LINE_2 = "Do you get a say?";
const GLYPHS = "!<>-_\\/[]{}—=+*^?#$%&@▓░▒█";
const STAGGER_PER_CHAR = 18; // ms — left-to-right reveal
const SCRAMBLE_DURATION = 280; // ms — how long each char glitches before locking
const LINE_GAP = 200; // ms — second line starts after first begins
const FRAME_INTERVAL = 45; // ms — glyph swap cadence (independent of FPS)

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/**
 * One-screen manifesto. Glitch-decoder reveal starts immediately on mount;
 * tap anywhere → /atlas (tapping during the reveal skips to the end first).
 */
export function Encounter() {
  const navigate = useNavigate();
  const [out1, setOut1] = useState<string>(() => LINE_1.replace(/\S/g, " "));
  const [out2, setOut2] = useState<string>(() => LINE_2.replace(/\S/g, " "));
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [reduced, setReduced] = useState(false);
  const rafRef = useRef<number | null>(null);
  const skipRef = useRef<() => void>(() => {});

  // Run glitch-decoder reveal on mount.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setOut1(LINE_1);
      setOut2(LINE_2);
      setReady(true);
      return;
    }

    const start = performance.now();
    let lastFrame = 0;
    let done = false;

    function finish() {
      done = true;
      setOut1(LINE_1);
      setOut2(LINE_2);
      setReady(true);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    skipRef.current = finish;

    function buildLine(text: string, t: number, lineDelay: number): string {
      let result = "";
      for (let i = 0; i < text.length; i++) {
        const target = text[i];
        if (target === " ") {
          result += " ";
          continue;
        }
        const charStart = lineDelay + i * STAGGER_PER_CHAR;
        const charLock = charStart + SCRAMBLE_DURATION;
        if (t < charStart) {
          result += " "; // not yet revealed — invisible to preserve layout
        } else if (t >= charLock) {
          result += target;
        } else {
          result += randomGlyph();
        }
      }
      return result;
    }

    function tick(now: number) {
      const t = now - start;
      if (now - lastFrame >= FRAME_INTERVAL) {
        lastFrame = now;
        const s1 = buildLine(LINE_1, t, 0);
        const s2 = buildLine(LINE_2, t, LINE_GAP);
        setOut1(s1);
        setOut2(s2);
        const total =
          LINE_GAP + LINE_2.length * STAGGER_PER_CHAR + SCRAMBLE_DURATION + 40;
        if (t >= total) {
          finish();
          return;
        }
      }
      if (!done) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const enter = useCallback(() => {
    if (!ready) {
      // skip reveal if still animating
      skipRef.current();
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      navigate({ to: "/atlas" });
    }, reduced ? 0 : 360);
  }, [ready, navigate, reduced]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enter();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enter]);

  return (
    <main
      onClick={enter}
      role="button"
      tabIndex={0}
      aria-label="Enter the atlas"
      className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 select-none cursor-pointer"
      style={{
        background: "var(--encounter-bg)",
        color: "var(--encounter-ink)",
        fontFamily: "var(--font-display)",
        opacity: leaving ? 0 : 1,
        transition: "opacity 360ms cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <div className="flex flex-col items-start gap-3 text-left -mt-12">
        <p
          aria-label={LINE_1}
          style={{
            fontSize: "clamp(32px, 5.5vw, 64px)",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "pre",
          }}
        >
          {out1}
        </p>
        <p
          aria-label={LINE_2}
          style={{
            fontSize: "clamp(32px, 5.5vw, 64px)",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "pre",
            color: "var(--encounter-accent)",
          }}
        >
          {out2}
        </p>
      </div>

      <div
        className="absolute bottom-12 left-0 right-0 flex justify-center"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 320ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        <span
          className={reduced ? "" : "encounter-hint-breathe"}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "10.5px",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "var(--encounter-hint)",
          }}
        >
          tap anywhere to enter
        </span>
      </div>
    </main>
  );
}
