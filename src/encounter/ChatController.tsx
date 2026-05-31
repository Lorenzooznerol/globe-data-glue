import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAtlasStore } from "@/atlas/store";
import { setNickname } from "./nickname";
import { ChatShell } from "./chat/ChatShell";
import { AIMessage } from "./chat/AIMessage";
import { UserMessage } from "./chat/UserMessage";
import { TypingIndicator } from "./chat/TypingIndicator";
import { ChoiceChips } from "./chat/ChoiceChips";
import { Goodbye } from "./chat/Goodbye";

type Stance = "yes" | "no";

/**
 * Drives the entry conversation. AI messages are preceded by a typing
 * indicator. User replies are chips that, once picked, render as a
 * right-aligned user bubble. Two real outcomes:
 *  - "See where you are" → cross-fade to /atlas with the user's stance.
 *  - "Fine, I'll leave." → cross-fade to a blank "Goodbye." screen. The
 *    only way back is to reload the page; that friction is intentional.
 */
export function ChatController() {
  const navigate = useNavigate();
  const setReducedMotion = useAtlasStore((s) => s.setReducedMotion);

  const [messages, setMessages] = useState<ReactNode[]>([]);
  const [inputActive, setInputActive] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [goodbye, setGoodbye] = useState(false);

  const nameRef = useRef<string>("");
  const stanceRef = useRef<Stance | null>(null);
  const submitNicknameRef = useRef<((value: string) => void) | null>(null);
  const startedRef = useRef(false);

  // Detect reduced motion once.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setReducedMotion(true);
  }, [setReducedMotion]);

  const append = useCallback((node: ReactNode) => {
    setMessages((prev) => [...prev, node]);
  }, []);

  const replaceLast = useCallback((node: ReactNode) => {
    setMessages((prev) => [...prev.slice(0, -1), node]);
  }, []);

  // Helpers wrapped in refs so the long script reads cleanly.
  const wait = (ms: number) =>
    new Promise<void>((r) => window.setTimeout(r, ms));

  const sayAI = useCallback(
    async (
      text: ReactNode,
      opts: {
        typing?: number;
        dwell?: number;
        emphasis?: boolean;
        multiplied?: boolean;
      } = {},
    ) => {
      const typing = opts.typing ?? 950;
      const dwell = opts.dwell ?? 650;
      append(<TypingIndicator />);
      await wait(typing);
      replaceLast(
        <AIMessage emphasis={opts.emphasis} multiplied={opts.multiplied}>
          {text}
        </AIMessage>,
      );
      await wait(dwell);
    },
    [append, replaceLast],
  );

  const userSays = useCallback(
    async (label: string) => {
      append(<UserMessage>{label}</UserMessage>);
      await wait(550);
    },
    [append],
  );

  const askChips = useCallback(
    (choices: string[]) =>
      new Promise<string>((resolve) => {
        const handlePick = (label: string) => {
          // Remove the chips row before resolving.
          setMessages((prev) =>
            prev.filter((m) => (m as { key?: unknown })?.toString() !== "chips"),
          );
          resolve(label);
        };
        append(
          <ChoiceChips choices={choices} onPick={handlePick} />,
        );
      }),
    [append],
  );

  const askNickname = useCallback(
    () =>
      new Promise<string>((resolve) => {
        submitNicknameRef.current = (value: string) => {
          resolve(value);
        };
        setInputActive(true);
      }),
    [],
  );

  const handleInputSubmit = useCallback(
    (value: string) => {
      setInputActive(false);
      const fn = submitNicknameRef.current;
      submitNicknameRef.current = null;
      if (fn) fn(value);
    },
    [],
  );

  // The full script.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      await wait(600);
      if (cancelled) return;

      await sayAI("Hi.");
      await sayAI("What should I call you?");

      const name = await askNickname();
      if (cancelled) return;
      nameRef.current = name;
      setNickname(name); // device-local by design (a privacy choice, not real auth)
      await userSays(name);

      await sayAI(`Hi ${name}.`);
      await sayAI("I've formed an opinion of you.");
      // Longer "deliberation" beat before the verdict.
      await sayAI("I'm not letting you in.", { typing: 3000 });

      const door = await askChips(["Why?", "Fine, I'll leave."]);
      if (cancelled) return;
      await userSays(door);

      if (door === "Fine, I'll leave.") {
        // Real close. Do NOT save anything beyond what's already saved
        // (nickname was saved on submit; that's intentional — the next visit
        // still skips the encounter).
        await wait(900);
        setFadingOut(true);
        await wait(650);
        setGoodbye(true);
        return;
      }

      await sayAI("I formed an opinion and acted on it.");
      await sayAI("AI does this too. It forms an opinion of you.", {
        multiplied: true,
        dwell: 900,
      });
      await sayAI(
        "The opinion it formed of you? You can't see it. You can't correct it.",
      );
      await sayAI("It made up its mind about you. Do you get a say?", {
        emphasis: true,
      });

      const verdict = await askChips(["Yes", "No"]);
      if (cancelled) return;
      stanceRef.current = verdict === "Yes" ? "yes" : "no";
      await userSays(verdict);

      await sayAI(
        "Right now, every country is deciding on this. None the same.",
      );

      // Final affordance — the user's first real choice. Tappable AI message.
      const handleEnter = () => {
        setFadingOut(true);
        window.setTimeout(() => {
          navigate({
            to: "/atlas",
            search: { stance: stanceRef.current ?? undefined },
          });
        }, 600);
      };
      append(<TypingIndicator />);
      await wait(950);
      replaceLast(
        <AIMessage pulse onClick={handleEnter}>
          See where you are.
        </AIMessage>,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [sayAI, userSays, askNickname, askChips, append, replaceLast, navigate]);

  if (goodbye) return <Goodbye />;

  return (
    <ChatShell
      messages={messages}
      inputActive={inputActive}
      inputPlaceholder="nickname"
      onSubmitInput={handleInputSubmit}
      fadingOut={fadingOut}
    />
  );
}
