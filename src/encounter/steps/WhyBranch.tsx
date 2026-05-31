import { useEffect, useState } from "react";
import { Line } from "../Line";

interface Props {
  onContinue: () => void;
}

/**
 * "Why?" branch. Scripted reveal, line by line, then auto-advance to the
 * convergence step.
 */
export function WhyBranch({ onContinue }: Props) {
  const [done, setDone] = useState(false);

  const beats: { delay: number; text: string; em?: boolean }[] = [
    { delay: 400, text: "Fair question." },
    { delay: 2000, text: "Honestly? I&rsquo;m not sure myself." },
    { delay: 4000, text: "I know nothing about you." },
    { delay: 6000, text: "Yet I formed an opinion &mdash; and acted on it." },
    { delay: 8200, text: "In a second. Without telling you how." },
    { delay: 10400, text: "It bothered you, didn&rsquo;t it." },
    {
      delay: 12600,
      text: "That &ldquo;I&rsquo;m not letting you in&rdquo; &mdash; without knowing who you are, without a chance to answer.",
      em: true,
    },
  ];

  const lastDelay = beats[beats.length - 1].delay;

  useEffect(() => {
    const id = window.setTimeout(() => setDone(true), lastDelay + 2200);
    return () => window.clearTimeout(id);
  }, [lastDelay]);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(onContinue, 1400);
    return () => window.clearTimeout(id);
  }, [done, onContinue]);

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      {beats.map((b, i) => (
        <Line
          key={i}
          delay={b.delay}
          className={`font-serif leading-snug ${
            b.em ? "text-xl italic sm:text-2xl" : "text-lg sm:text-xl"
          }`}
        >
          <span dangerouslySetInnerHTML={{ __html: b.text }} />
        </Line>
      ))}
    </div>
  );
}
