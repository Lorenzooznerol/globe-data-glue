import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Props {
  items: string[];
}

export function ToVerify({ items }: Props) {
  if (!items?.length) return null;
  return (
    <Collapsible>
      <CollapsibleTrigger className="mono flex w-full items-center justify-between border-t border-border/40 pt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
        <span>To verify</span>
        <span className="flex items-center gap-1.5">
          <span>{items.length}</span>
          <ChevronDown
            className="h-3 w-3 transition-transform data-[state=open]:rotate-180"
            aria-hidden
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <ul className="flex flex-col">
          {items.map((s, i) => (
            <li
              key={i}
              className="border-t border-border/30 py-2.5 font-serif text-[12.5px] leading-relaxed text-foreground/75 first:border-t-0 first:pt-0"
            >
              {s}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
