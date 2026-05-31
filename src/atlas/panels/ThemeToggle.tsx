import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useAtlasStore } from "@/atlas/store";

export function ThemeToggle() {
  const theme = useAtlasStore((s) => s.theme);
  const toggle = useAtlasStore((s) => s.toggleTheme);

  // Mirror theme onto the <html> element so Tailwind's `dark:` variant flips.
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") el.classList.add("dark");
    else el.classList.remove("dark");
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Toggle ${next} mode`}
      title={`Switch to ${next} mode`}
      className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-muted-foreground backdrop-blur-md transition-colors hover:bg-background hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
