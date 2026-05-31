// Device-local by design. We collect nothing else; the nickname is the only
// "account". A privacy choice, not real auth — clearing the browser wipes it.
const KEY = "atlas.nickname";

export const getNickname = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const setNickname = (n: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, n.trim());
  } catch {
    /* quota / privacy mode — silently ignore */
  }
};
