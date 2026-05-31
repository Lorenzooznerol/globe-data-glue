import { createFileRoute } from "@tanstack/react-router";
import { Encounter } from "@/encounter/Encounter";

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
  // Always show the encounter from the start — no returning-visitor skip.
  return <Encounter />;
}
