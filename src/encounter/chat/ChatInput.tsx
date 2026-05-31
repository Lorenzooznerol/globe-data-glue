import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  active: boolean;
  placeholder?: string;
  onSubmit?: (value: string) => void;
}

/**
 * ChatGPT/Claude-style input. Disabled by default — present, familiar, and
 * deliberately unusable. Only enabled on the nickname turn.
 */
export function ChatInput({ active, placeholder = "Message…", onSubmit }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(id);
    } else {
      setValue("");
    }
  }, [active]);

  function submit() {
    const trimmed = value.trim();
    if (!active || !trimmed || !onSubmit) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full"
      aria-disabled={!active}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border px-4 py-2.5"
        style={{
          background: "var(--encounter-input-bg)",
          borderColor: "var(--encounter-input-border)",
          opacity: active ? 1 : 0.55,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          maxLength={40}
          onChange={(e) => setValue(e.target.value)}
          placeholder={active ? placeholder : "Message…"}
          disabled={!active}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Message"
          className="flex-1 border-0 bg-transparent font-serif text-base outline-none placeholder:italic disabled:cursor-not-allowed"
          style={{
            color: "var(--encounter-ink)",
            caretColor: "var(--encounter-ink)",
          }}
        />
        <button
          type="submit"
          disabled={!active || value.trim().length === 0}
          aria-label="Send"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          style={{
            background: "var(--encounter-ink)",
            color: "var(--encounter-bg)",
          }}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
