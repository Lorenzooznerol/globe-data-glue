import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: string[];
}

export function ToVerifyDrawer({ open, onOpenChange, items }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full max-w-[420px] border-r border-border/60 bg-background/95 backdrop-blur-md"
      >
        <SheetHeader>
          <SheetTitle className="mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            What&apos;s still being verified
          </SheetTitle>
        </SheetHeader>
        <ul className="mt-5 flex flex-col">
          {items.map((s, i) => (
            <li
              key={i}
              className="border-t border-border/30 py-3 font-serif text-[13px] leading-relaxed text-foreground/80 first:border-t-0 first:pt-0"
            >
              {s}
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
