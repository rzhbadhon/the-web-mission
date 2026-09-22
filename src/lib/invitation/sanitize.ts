// ─────────────────────────────────────────────────────────────────────────────
// sanitize.ts — defensive reply scrubber.
//
// The guide's replies come from an AI model (or an offline fallback). This
// function makes them safe to render in HTML and strips a few risky patterns
// (e.g. raw URLs, angle-bracket tags the model sometimes emits).
//
// It is the LAST line of defence — even if the agent endpoint returns a
// hostile reply, it can never inject markup into the page.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip control chars, collapse whitespace, escape HTML. Returns a plain
 * string safe to insert into a text node (the React tree renders it inside a
 * `whitespace-pre-wrap` bubble, so line breaks survive).
 */
export function sanitizeReply(text: string): string {
  if (!text) return "";
  return (
    text
      // strip control characters (incl. RTL/LTR overrides used in spoofing)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u202E\u202D\u202A-\u202E]/g, "")
      // collapse runs of spaces (but preserve newlines)
      .replace(/[^\S\n]+/g, " ")
      // limit length — never let the model flood the chat
      .slice(0, 2000)
      .trim()
  );
}
