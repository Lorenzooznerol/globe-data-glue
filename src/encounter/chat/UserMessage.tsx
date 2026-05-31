interface Props {
  children: React.ReactNode;
}

/** Right-aligned user bubble. */
export function UserMessage({ children }: Props) {
  return (
    <div className="flex w-full justify-end">
      <div
        className="max-w-[80%] rounded-2xl px-4 py-2 font-serif text-base sm:text-lg"
        style={{
          background: "var(--encounter-bubble)",
          color: "var(--encounter-ink)",
          opacity: 0,
          animation: "encounter-fade-in 380ms ease-out forwards",
        }}
      >
        {children}
      </div>
    </div>
  );
}
