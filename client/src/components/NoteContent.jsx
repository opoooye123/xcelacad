import { cx } from "./ui";

// ==========================================================
// NOTE CONTENT
// ==========================================================
// Study material bodies are stored as a plain string that an
// admin types into a textarea. Rendering that as one blob of text
// is unreadable, and running it through dangerouslySetInnerHTML
// would make every note an XSS vector the moment a second admin
// is added.
//
// So this parses a deliberately small markdown subset and builds
// real React elements: headings, lists, quotes, code, bold,
// italic, inline code. Anything it doesn't recognise stays as
// literal text, which is the safe failure mode.
//
// Shared with the admin editor's preview pane so what an admin
// sees while writing is what a student gets.
// ==========================================================

// ---------- Inline ----------

// The capturing group makes String.split keep the delimiters,
// so the pieces come back interleaved with the plain text.
const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;

const renderInline = (text, keyPrefix) =>
  String(text)
    .split(INLINE_PATTERN)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={key} className="font-bold text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={key}
            className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.875em] text-ink"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      if (
        part.length > 2 &&
        part.startsWith("*") &&
        part.endsWith("*")
      ) {
        return (
          <em key={key} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Plain text — React renders bare strings safely.
      return part;
    });

// ---------- Blocks ----------

const HEADING = /^(#{1,4})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const QUOTE = /^\s*>\s?/;
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^\s*```/;

// Used to stop a paragraph from swallowing the line that starts
// the next block.
const startsBlock = (line) =>
  HEADING.test(line) ||
  BULLET.test(line) ||
  NUMBERED.test(line) ||
  QUOTE.test(line) ||
  RULE.test(line) ||
  FENCE.test(line);

export const parseNote = (raw) => {
  const lines = String(raw || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank lines are separators, not content.
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Fenced code — taken verbatim, no inline parsing inside.
    if (FENCE.test(line)) {
      const body = [];
      i += 1;

      while (i < lines.length && !FENCE.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }

      // Skip the closing fence when there is one; an unclosed
      // fence just runs to the end of the note.
      i += 1;

      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }

    // A rule has to be checked before lists: "---" has no space
    // after the dash so BULLET won't claim it, but "***" would
    // otherwise read as an empty italic run.
    if (RULE.test(line)) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    const heading = line.match(HEADING);

    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });

      i += 1;
      continue;
    }

    if (BULLET.test(line)) {
      const items = [];

      while (i < lines.length && BULLET.test(lines[i])) {
        items.push(lines[i].replace(BULLET, ""));
        i += 1;
      }

      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (NUMBERED.test(line)) {
      const items = [];

      while (i < lines.length && NUMBERED.test(lines[i])) {
        items.push(lines[i].replace(NUMBERED, ""));
        i += 1;
      }

      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    if (QUOTE.test(line)) {
      const body = [];

      while (i < lines.length && QUOTE.test(lines[i])) {
        body.push(lines[i].replace(QUOTE, ""));
        i += 1;
      }

      blocks.push({ type: "quote", text: body.join(" ") });
      continue;
    }

    // Paragraph: run of non-blank lines, soft-wrapped into one.
    const paragraph = [];

    while (
      i < lines.length &&
      lines[i].trim() &&
      !startsBlock(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }

    blocks.push({ type: "p", text: paragraph.join(" ") });
  }

  return blocks;
};

// ---------- Component ----------

const HEADING_CLASS = {
  1: "mt-8 text-xl font-bold text-ink sm:text-2xl",
  2: "mt-8 text-lg font-bold text-ink sm:text-xl",
  3: "mt-6 text-base font-bold text-ink",
  4: "mt-5 text-sm font-bold tracking-wide text-muted uppercase",
};

const NoteContent = ({ content, className }) => {
  const blocks = parseNote(content);

  if (blocks.length === 0) {
    return (
      <p className={cx("text-sm text-subtle", className)}>
        This note is empty.
      </p>
    );
  }

  return (
    <div
      className={cx(
        // first:mt-0 keeps the leading heading from pushing a gap
        // below the card padding.
        "text-[0.9375rem] leading-relaxed text-muted [&>*:first-child]:mt-0",
        className
      )}
    >
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === "heading") {
          const Tag = block.level <= 2 ? "h2" : "h3";

          return (
            <Tag
              key={key}
              className={
                HEADING_CLASS[block.level] ||
                HEADING_CLASS[3]
              }
            >
              {renderInline(block.text, key)}
            </Tag>
          );
        }

        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";

          return (
            <Tag
              key={key}
              className={cx(
                "mt-4 space-y-1.5 pl-5",
                block.ordered ? "list-decimal" : "list-disc"
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-${itemIndex}`}
                  className="marker:text-brand-500"
                >
                  {renderInline(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </Tag>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={key}
              className="mt-5 border-l-4 border-brand-300 bg-brand-50 px-4 py-3 text-ink italic"
            >
              {renderInline(block.text, key)}
            </blockquote>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={key}
              className="scroll-x mt-5 rounded-md bg-surface-2 p-4 font-mono text-sm text-ink"
            >
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "rule") {
          return (
            <hr
              key={key}
              className="mt-6 border-t border-line"
            />
          );
        }

        return (
          <p key={key} className="mt-4">
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
};

export default NoteContent;
