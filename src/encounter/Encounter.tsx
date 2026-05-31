import { ChatController } from "./ChatController";

/**
 * Public entry point. Renders the chat-style encounter. All state and
 * scripting lives in ChatController.
 */
export function Encounter() {
  return <ChatController />;
}
