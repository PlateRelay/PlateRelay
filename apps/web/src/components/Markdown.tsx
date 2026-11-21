import type { ReactNode } from "react";
import { cx } from "../lib/cx";

/*
 * A small Markdown subset for admin-written text shown to applicants: paragraphs, line breaks,
 * # headings, - and 1. lists, **bold**, *italics*, `code` and [links](https://…). Everything is
 * built as React elements, never as HTML, so the text cannot inject markup or scripts.
 */

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`([^`]+)`|\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g;

function inline(text: string, key = ""): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}${m.index}`;
    if (m[1] !== undefined) out.push(<strong key={k} className="font-semibold text-on-surface">{inline(m[1], k)}</strong>);
    else if (m[2] !== undefined || m[3] !== undefined) out.push(<em key={k}>{inline(m[2] ?? m[3], k)}</em>);
    else if (m[4] !== undefined) out.push(<code key={k} className="rounded bg-sc-highest px-1 py-px font-num text-[0.92em] text-on-surface">{m[4]}</code>);
    else out.push(<a key={k} href={m[6]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{inline(m[5], k)}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block = { kind: "p"; lines: string[] } | { kind: "h"; lines: string[] } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] };

function blocks(src: string): Block[] {
  const out: Block[] = [];
  for (const raw of src.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const prev = out.at(-1);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    if (!line.trim()) out.push({ kind: "p", lines: [] });
    else if (heading) out.push({ kind: "h", lines: [heading[1]] });
    else if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)![1];
      if (prev?.kind === kind) prev.items.push(item);
      else out.push({ kind, items: [item] });
    } else if (prev?.kind === "p") prev.lines.push(line);
    else out.push({ kind: "p", lines: [line] });
  }
  return out.filter((b) => ("lines" in b ? b.lines.length : b.items.length));
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1.5 text-body-m text-on-variant [overflow-wrap:anywhere]", className)}>
      {blocks(text).map((b, i) =>
        b.kind === "h" ? (
          <b key={i} className="text-label-l font-medium text-on-surface">{inline(b.lines[0])}</b>
        ) : b.kind === "p" ? (
          <p key={i} className="m-0">{b.lines.flatMap((l, j) => (j ? [<br key={`br${j}`} />, ...inline(l, `${j}-`)] : inline(l, `${j}-`)))}</p>
        ) : b.kind === "ul" ? (
          <ul key={i} className="m-0 list-disc pl-5">{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>
        ) : (
          <ol key={i} className="m-0 list-decimal pl-5">{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>
        ),
      )}
    </div>
  );
}
