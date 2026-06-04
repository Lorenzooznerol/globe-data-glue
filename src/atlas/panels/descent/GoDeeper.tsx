import { ChevronDown } from "lucide-react";

interface Props {
  label: string;
  onClick: () => void;
}

export function GoDeeper({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono group mt-6 inline-flex items-center gap-2 self-start border-b border-border/60 pb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      <span>{label}</span>
      <ChevronDown className="h-3 w-3 transition-transform group-hover:translate-y-0.5" aria-hidden />
    </button>
  );
}
