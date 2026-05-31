import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Encounter } from "@/encounter/Encounter";
import { getNickname } from "@/encounter/nickname";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "—" },
      {
        name: "description",
        content:
          "Before the atlas: a one-minute encounter on the right to face your accuser.",
      },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  // Returning visitors (device-local check on the nickname) skip the encounter.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const n = getNickname();
    if (n && n.length > 0) {
      navigate({ to: "/atlas", replace: true });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) {
    // Render nothing during the SSR / pre-decision frame so we don't flash the encounter.
    return <div style={{ background: "var(--encounter-bg)" }} className="min-h-[100dvh] w-full" />;
  }
  return <Encounter />;
}
