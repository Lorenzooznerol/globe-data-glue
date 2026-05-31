interface Props {
  choices: string[];
  onPick: (label: string) => void;
}

/** Row of tappable chips that disappear once one is picked. */
export function ChoiceChips({ choices, onPick }: Props) {
  return (
    <div
      className="flex w-full flex-wrap justify-start gap-2 sm:gap-3"
      style={{
        opacity: 0,
        animation: "encounter-fade-in 500ms ease-out forwards",
      }}
    >
      {choices.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(label)}
          className="rounded-full border px-4 py-2 font-serif text-sm italic transition-colors sm:text-base"
          style={{
            borderColor: "var(--encounter-input-border)",
            color: "var(--encounter-ink)",
            background: "transparent",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
