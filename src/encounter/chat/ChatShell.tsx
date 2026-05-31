import { type ReactNode, useEffect, useRef } from "react";
import { ThemeToggle } from "@/atlas/panels/ThemeToggle";
import { ChatInput } from "./ChatInput";

interface Props {
  messages: ReactNode[];
  inputActive: boolean;
  inputPlaceholder?: string;
  onSubmitInput?: (value: string) => void;
  fadingOut?: boolean;
}

/**
 * The chat container. Centered ~640px column, scrollable message list,
 * sticky bottom input, tiny low-contrast theme toggle in the corner.
 */
export function ChatShell({
  messages,
  inputActive,
  inputPlaceholder,
  onSubmitInput,
  fadingOut,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <main
      className="relative flex min-h-[100dvh] w-full flex-col"
      style={{
        background: "var(--encounter-bg)",
        color: "var(--encounter-ink)",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 600ms ease-out",
      }}
    >
      <div className="absolute right-3 top-3 z-30" style={{ opacity: 0.4 }}>
        <ThemeToggle />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-5 px-4 pb-8 pt-20 sm:gap-6 sm:pt-28">
          {messages.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div
        className="sticky bottom-0 w-full"
        style={{
          background:
            "linear-gradient(to top, var(--encounter-bg) 60%, transparent)",
        }}
      >
        <div className="mx-auto w-full max-w-[40rem] px-4 pb-6 pt-4">
          <ChatInput
            active={inputActive}
            placeholder={inputPlaceholder}
            onSubmit={onSubmitInput}
          />
        </div>
      </div>
    </main>
  );
}
