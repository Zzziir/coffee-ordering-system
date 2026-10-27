import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatMessage = { role: "user" | "model"; text: string };

const CLAUDE_MODEL = "claude-haiku-4-5";
const GEMINI_MODEL = "gemini-flash-latest";
// Replies are 2 to 4 sentences; this is headroom, not a target.
const MAX_REPLY_TOKENS = 1024;
// A hung provider must fail, not leave the customer staring at a typing dot.
const CLAUDE_TIMEOUT_MS = 20_000;
const GEMINI_TIMEOUT_MS = 30_000;

/**
 * The "Ask Craffé" model call. Claude is primary; Gemini takes over whenever
 * Claude can't answer (out of credits, outage, rate limit, bad key, refusal),
 * so a provider problem never takes the chatbot down. Returns the raw reply,
 * markers and all. Throws only if every configured provider fails.
 */
export async function generateReply(system: string, messages: ChatMessage[]): Promise<string> {
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!claudeKey && !geminiKey) {
    throw new Error("No chatbot provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY.");
  }

  if (claudeKey) {
    try {
      return await askClaude(claudeKey, system, messages);
    } catch (err) {
      if (!geminiKey) throw err;
      console.warn(`[chat] Claude failed, falling back to Gemini: ${describe(err)}`);
    }
  }
  return askGemini(geminiKey!, system, messages);
}

async function askClaude(apiKey: string, system: string, messages: ChatMessage[]): Promise<string> {
  // One retry so an outage hands off to Gemini quickly.
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: CLAUDE_TIMEOUT_MS });
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_REPLY_TOKENS,
    system,
    messages: messages.map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.text,
    })),
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude refused (${response.stop_details?.category ?? "no category"})`);
  }
  return response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
}

async function askGemini(apiKey: string, system: string, messages: ChatMessage[]): Promise<string> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel(
    { model: GEMINI_MODEL, systemInstruction: system },
    { timeout: GEMINI_TIMEOUT_MS },
  );
  const history = messages.slice(0, -1).map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  const latest = messages[messages.length - 1].text;

  const resp = (await model.startChat({ history }).sendMessage(latest)).response;
  try {
    return resp.text();
  } catch {
    return "";
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
