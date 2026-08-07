import { subscribe } from "@/lib/store";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events stream of order changes. Both the staff queue and each
 * customer's order-status page subscribe here for live updates.
 *
 * PRODUCTION PATH (future): drop this route and subscribe to Supabase Realtime
 * on the client instead — the store's `subscribe` is the same seam.
 */
export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (order: Order) => {
        controller.enqueue(
          encoder.encode(`event: order\ndata: ${JSON.stringify(order)}\n\n`),
        );
      };

      // Greet so the client knows the connection is live.
      controller.enqueue(encoder.encode(`event: ping\ndata: "ok"\n\n`));

      const unsubscribe = subscribe(send);

      // Keep-alive comment every 25s (proxies drop idle connections).
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          /* closed */
        }
      }, 25_000);

      const close = () => {
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
