import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { ModeSwitch } from "@/atlas/panels/ModeSwitch";

export function TopBar() {
  return (
    <header className="landing-topbar">
      <Link to="/atlas" className="landing-wordmark">
        Atlante
      </Link>
      <nav className="hidden items-center gap-7 md:flex">
        <a className="nav-link" data-active="true" href="#">
          Explore
        </a>
        <a className="nav-link" href="#">
          Method
        </a>
        <a className="nav-link" href="#">
          FAQ
        </a>
        <div className="ml-2 w-[260px]">
          <ModeSwitch />
        </div>
      </nav>
      <button
        type="button"
        aria-label="More"
        className="rounded-full border border-border/50 p-1.5 text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </header>
  );
}
