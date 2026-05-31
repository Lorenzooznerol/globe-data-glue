import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Atlas of AI Governance" }],
  }),
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/atlas", replace: true });
  }, [navigate]);
  return <div style={{ background: "var(--encounter-bg)" }} className="min-h-[100dvh] w-full" />;
}
