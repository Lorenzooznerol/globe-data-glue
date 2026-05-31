import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function SectionAccordion({
  title,
  subtitle,
  count,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const toggle = () => {
    const next = !open;
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  };
  return (
    <section className="border-t border-border/40 first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-serif text-[18px] leading-tight text-foreground">{title}</h3>
          {subtitle && (
            <p className="font-serif text-[12.5px] italic leading-snug text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {typeof count === "number" && (
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {count}
            </span>
          )}
          <ChevronDown
            className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")}
            aria-hidden
          />
        </div>
      </button>
      {open && <div className="pb-6">{children}</div>}
    </section>
  );
}
