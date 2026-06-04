interface Layer {
  key: number;
  label: string;
}

interface Props {
  layers: Layer[];
  active: number;
  onJump: (idx: number) => void;
  onOpenToVerify: () => void;
  toVerifyCount: number;
}

export function LayerBreadcrumb({
  layers,
  active,
  onJump,
  onOpenToVerify,
  toVerifyCount,
}: Props) {
  return (
    <nav
      aria-label="Descent layers"
      className="pointer-events-auto absolute left-3 top-1/2 z-10 -translate-y-1/2"
    >
      <ol className="flex flex-col gap-3">
        {layers.map((l) => {
          const isActive = l.key === active;
          const passed = l.key < active;
          return (
            <li key={l.key}>
              <button
                type="button"
                onClick={() => onJump(l.key)}
                aria-current={isActive ? "step" : undefined}
                className="group flex items-center gap-2 outline-none"
              >
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full transition-all"
                  style={{
                    background: isActive
                      ? "var(--foreground)"
                      : passed
                        ? "color-mix(in oklab, var(--foreground) 60%, transparent)"
                        : "color-mix(in oklab, var(--foreground) 20%, transparent)",
                    transform: isActive ? "scale(1.6)" : "scale(1)",
                  }}
                />
                <span
                  className={[
                    "mono text-[9px] uppercase tracking-[0.22em] transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground/60 group-hover:text-foreground",
                  ].join(" ")}
                >
                  {l.label}
                </span>
              </button>
            </li>
          );
        })}
        {toVerifyCount > 0 && (
          <li className="mt-3 border-t border-border/40 pt-3">
            <button
              type="button"
              onClick={onOpenToVerify}
              className="mono flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70 hover:text-foreground"
            >
              <span
                aria-hidden
                className="inline-block h-1 w-1 rounded-full"
                style={{ background: "var(--epistemic-to-verify)" }}
              />
              <span>To verify ({toVerifyCount})</span>
            </button>
          </li>
        )}
      </ol>
    </nav>
  );
}
