import { Fragment, type ReactNode } from "react";

/**
 * A tiny Markdown renderer for Ask Craffé replies.
 *
 * The model answers in light Markdown (bold item names, bullet lists, the odd
 * heading). Rendering the raw text leaked the markers as literal "*" and "-",
 * which read as broken. This turns that subset into clean, branded blocks
 * without pulling in a full Markdown dependency. It is deliberately small:
 * paragraphs, bullet and numbered lists, short headings, and inline
 * bold/italic. Anything fancier just falls through as plain text.
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

const BULLET = /^[-*•]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const HEADING = /^#{1,6}\s+(.*)$/;

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = ORDERED.exec(line);
    const heading = HEADING.exec(line);

    if (bullet) {
      flushPara();
      if (list?.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(bullet[1]);
    } else if (ordered) {
      flushPara();
      if (list?.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ordered[1]);
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ kind: "h", text: heading[1] });
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

const INLINE = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|_([^_\n]+)_)/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) nodes.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    const bold = m[2] ?? m[3];
    const italic = m[4] ?? m[5];
    if (bold != null) {
      nodes.push(
        <strong key={key++} className="font-semibold text-ink">
          {bold}
        </strong>,
      );
    } else if (italic != null) {
      nodes.push(
        <em key={key++} className="italic">
          {italic}
        </em>,
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return nodes;
}

export function RichText({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        if (block.kind === "h") {
          return (
            <p key={i} className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
              {renderInline(block.text)}
            </p>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-coffee" />
                  <span className="min-w-0 flex-1">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-coffee-tint text-[11px] font-bold text-coffee"
                  >
                    {j + 1}
                  </span>
                  <span className="min-w-0 flex-1">{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="leading-relaxed">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
