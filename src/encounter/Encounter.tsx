import { useEffect, useState } from "react";
import { useAtlasStore } from "@/atlas/store";
import { setNickname } from "./nickname";
import { Vignette } from "./Vignette";
import { ThemeToggle } from "@/atlas/panels/ThemeToggle";
import { NicknameGate } from "./steps/NicknameGate";
import { Judgment } from "./steps/Judgment";
import { LeaveBranch } from "./steps/LeaveBranch";
import { Turn } from "./steps/Turn";
import { Reveal } from "./steps/Reveal";

type Step = "gate" | "judgment" | "leave" | "turn" | "reveal";

export function Encounter() {
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);
  const [step, setStep] = useState<Step>("gate");
  const [name, setName] = useState("");
  const [choice, setChoice] = useState<"right" | "unavoidable" | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setReducedMotion(true);
  }, [setReducedMotion]);

  function handleSubmitName(n: string) {
    setName(n);
    setStep("judgment");
  }

  function handleChoose(c: "right" | "unavoidable") {
    setChoice(c);
    setStep("reveal");
  }

  function commitNickname() {
    if (name) setNickname(name);
  }

  const showName = step !== "gate";

  return (
    <main
      className="encounter relative min-h-[100dvh] w-full overflow-hidden"
      style={{
        background: "var(--encounter-bg)",
        color: "var(--encounter-ink)",
      }}
    >
      <Vignette />

      <div className="absolute right-3 top-3 z-30" style={{ opacity: 0.4 }}>
        <ThemeToggle />
      </div>

      {showName && (
        <div
          className="pointer-events-none absolute inset-x-0 top-6 z-10 text-center font-serif italic"
          style={{
            color: "var(--encounter-ink-faint)",
            fontSize: "0.95rem",
            letterSpacing: "0.04em",
            opacity: 0,
            animation: "encounter-fade-in 1200ms ease-out forwards",
          }}
        >
          {name}
        </div>
      )}

      <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-6 py-24 sm:py-28">
        <div className="w-full max-w-[44rem]">
          {step === "gate" && <NicknameGate onSubmit={handleSubmitName} />}
          {step === "judgment" && (
            <Judgment name={name} onLeave={() => setStep("leave")} />
          )}
          {step === "leave" && (
            <LeaveBranch onContinue={() => setStep("turn")} />
          )}
          {step === "turn" && <Turn onChoose={handleChoose} />}
          {step === "reveal" && choice && (
            <Reveal choice={choice} onEnter={commitNickname} />
          )}
        </div>
      </div>
    </main>
  );
}
