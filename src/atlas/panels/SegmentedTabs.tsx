interface Tab<K extends string> {
  key: K;
  label: string;
  count?: number;
}

interface Props<K extends string> {
  tabs: Tab<K>[];
  value: K;
  onChange: (k: K) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Shared segmented tab control used in the country panel, Index, and Forecast.
 * Same visual grammar everywhere.
 */
export function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className = "",
}: Props<K>) {
  return (
    <nav
      role="tablist"
      aria-label={ariaLabel}
      className={`flex shrink-0 overflow-hidden rounded-sm border border-border/60 bg-secondary/30 ${className}`}
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={[
              "flex-1 px-2 py-2 font-serif text-[11px] transition-colors",
              active
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className="ml-1 text-muted-foreground">({t.count})</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
