import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/** Controlled disclosure: real <button aria-expanded> + conditional render. */
export function ExpanderRow({ label, children, defaultOpen = false, className = "" }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mono flex w-full items-center justify-between gap-2 py-2 text-left text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
      >
        <span>{label}</span>
        <ChevronDown
          className={"h-3.5 w-3.5 shrink-0 transition-transform " + (open ? "rotate-180" : "")}
          aria-hidden
        />
      </button>
      {open && <div className="pb-1 pt-1">{children}</div>}
    </div>
  );
}
