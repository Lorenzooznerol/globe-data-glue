import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

type Phase = 0 | 1 | 2 | "leaving";

/**
 * One-screen manifesto. Two beats, then tap anywhere → /atlas.
 * No nickname, no chips, no input. The sentence is the door.
 */
export function Encounter() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setPhase(2);
      return;
    }
    const t1 = window.setTimeout(() => setPhase(1), 1200);
    const t2 = window.setTimeout(() => setPhase(2), 2000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const enter = useCallback(() => {
    if (phase !== 2) return;
    setPhase("leaving");
    window.setTimeout(() => {
      navigate({ to: "/atlas" });
    }, reduced ? 0 : 500);
  }, [phase, navigate, reduced]);

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

  const ready = phase === 2;
  const leaving = phase === "leaving";

  return (
    <main
      onClick={enter}
      role="button"
      tabIndex={0}
      aria-label="Enter the atlas"
      className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 select-none"
      style={{
        background: "var(--encounter-bg)",
        color: "var(--encounter-ink)",
        fontFamily: 'var(--font-display)',
        cursor: ready ? "pointer" : "default",
        opacity: leaving ? 0 : 1,
        transition: "opacity 500ms ease-out",
      }}
    >
      <div className="flex flex-col items-center gap-4 text-center -mt-12">
        <p
          style={{
            fontSize: "clamp(28px, 5vw, 56px)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            opacity: phase === 0 ? 0 : 1,
            transition: "opacity 350ms ease-out",
          }}
        >
          AI forms an opinion of you.
        </p>
        <p
          style={{
            fontSize: "clamp(28px, 5vw, 56px)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--encounter-accent)",
            opacity: phase === 0 ? 0 : 1,
            transition: "opacity 350ms ease-out",
          }}
        >
          Do you get a say?
        </p>
      </div>

      <div
        className="absolute bottom-12 left-0 right-0 flex justify-center"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 400ms ease-out",
        }}
      >
        <span
          className={reduced ? "" : "encounter-hint-pulse"}
          style={{
            fontSize: "11px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--encounter-hint)",
          }}
        >
          ─ tap to enter ─
        </span>
      </div>
    </main>
  );
}
