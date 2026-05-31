import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  label: string;          // aria-label
  children: React.ReactNode;
  size?: number;          // icon size in px
}

export function InfoPopover({ label, children, size = 13 }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          <Info style={{ width: size, height: size }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[280px] border-border/60 bg-popover/95 p-3.5 text-popover-foreground backdrop-blur-md"
      >
        <p className="font-serif text-[12.5px] leading-relaxed text-foreground/90">
          {children}
        </p>
      </PopoverContent>
    </Popover>
  );
}

export const GIRAI_INFO_TEXT =
  "GIRAI — the Global Index on Responsible AI. It scores how much each of 138 countries is doing on responsible-AI governance, from 0 to 100. Higher = more in place. Data collected 2023. Source: Global Center on AI Governance (CC BY-NC-SA).";
