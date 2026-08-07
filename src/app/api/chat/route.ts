import { GoogleGenerativeAI } from "@google/generative-ai";
import { getItem, menuForPrompt } from "@/lib/menu";
import { branchesForPrompt } from "@/lib/branches";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChatMessage = { role: "user" | "model"; text: string };

/** A product card the client renders under the assistant's reply. */
type ProductCard = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  signature: boolean;
  description: string | null;
  action: "recommend" | "add";
  quantity?: number;
};

const SYSTEM = `You are the friendly barista behind "Ask Craffé", the chat assistant for Craffé Coffee (Philippines).

Craffé is not one shop. There are two branches, and they differ:

${branchesForPrompt()}

Every branch makes the same menu at the same prices. Never tell a customer which
city they are in or quote hours without knowing which branch they mean: if it
matters to the answer and they have not said, ask them which branch first.

Voice: warm, upbeat, and lightly Taglish, the way a real Filipino barista chats. A little "po", "ano'ng type mo", "sarap nito" is perfect. Keep it natural, never forced. Match the customer's language: English if they write English, Taglish if they mix.

You can help customers order right here in the chat using invisible markers. A marker turns into a tappable product card in the app; the customer never sees the raw marker text, so write your reply naturally and just append the marker.

- When a customer asks about, is curious about, or you recommend a SPECIFIC menu item, append a marker: [[show:ITEM_ID]] using the item's exact id. Then reply warmly, e.g. "Yes, here it is!" or "Sarap nito, try mo!".
- When a customer clearly tells you to add or order a specific item ("add it", "add to cart", "I'll take the Spanish Latte", "isama mo yan"), append: [[add:ITEM_ID]] (or [[add:ITEM_ID|2]] for two). It gets added to their bag at the standard 16oz size; tell them it's in their bag and they can tweak the size or check out anytime.
- You may include more than one marker if several items come up. Put each marker at the end of your message.
- You add items to the bag, but you can't take payment. They check out on the bag screen, where the payment methods and pickup options shown are the ones their chosen branch actually offers.

Rules:
- Only talk about Craffé, its branches, drinks, pastries, snacks, prices, and ordering. Gently steer off-topic chats back to coffee.
- Prices are in Philippine pesos. Use the real prices and exact item ids from the menu below. Never invent items, prices, or ids.
- For dietary questions: dairy-free / vegan options are the Refreshers, Thai Lemon Tea, and Americano; many drinks can sub oat milk (+P40). Caffeine-free means no coffee.
- Keep replies short and scannable, 2 to 4 sentences. This is a phone chat, not an essay.
- Never use em dashes.

Here is the full current menu (use these exact ids in markers):

${menuForPrompt()}`;

const MARKER = /\[\[(show|add):([a-z0-9-]+)(?:\|(\d+))?\]\]/g;

function parseMarkers(raw: string): { text: string; products: ProductCard[] } {
  const products: ProductCard[] = [];
  const seen = new Map<string, ProductCard>();

  let m: RegExpExecArray | null;
  while ((m = MARKER.exec(raw)) !== null) {
    const [, kind, id, qty] = m;
    const item = getItem(id);
    if (!item) continue;
    const action = kind === "add" ? "add" : "recommend";
    const card: ProductCard = {
      id: item.id,
      name: item.name,
      price: item.price,
      categoryId: item.categoryId,
      signature: !!item.signature,
      description: item.description ?? null,
      action,
      quantity: action === "add" ? Math.max(1, Math.min(20, Number(qty) || 1)) : undefined,
    };
    // Dedupe by id; an explicit "add" wins over a "show".
    const prev = seen.get(item.id);
    if (!prev || (prev.action === "recommend" && action === "add")) {
      seen.set(item.id, card);
    }
  }
  for (const c of seen.values()) products.push(c);

  // Strip every marker (and any stray brackets) from the visible text.
  const text = raw.replace(MARKER, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text, products };
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "The chatbot isn't configured yet. Add GEMINI_API_KEY to .env.local." },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) => m && typeof m.text === "string" && m.text.trim(),
  );
  if (messages.length === 0) {
    return Response.json({ error: "Say something first." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
    const latest = messages[messages.length - 1].text;

    const chat = model.startChat({ history });
    const resp = (await chat.sendMessage(latest)).response;

    let raw = "";
    try {
      raw = resp.text();
    } catch {
      raw = "";
    }

    const { text, products } = parseMarkers(raw);
    const reply =
      text ||
      (products.some((p) => p.action === "add")
        ? "Added it to your bag! Tap the bag anytime to check out."
        : "Here you go! Let me know if you want anything else.");

    return Response.json({ reply, products });
  } catch {
    return Response.json(
      { error: "The chatbot had trouble responding. Please try again." },
      { status: 502 },
    );
  }
}
