// public/censor.js
// Centralized bad-word / sensitive-pattern list + sanitizer

// ⚠️ Keep this list short-ish and specific. Add/remove as you see fit.
const BANNED_PATTERNS = [
  // slurs / racism / harassment (examples; extend to your needs)
  /\b(ni+g+g+e*r+|chink|sp[i1]c|k[i1]ke|raghead|g[o0]o+k)\b/gi,
  /\b(fag|f[a@]gg?o+t|dyke)\b/gi,

  // generic profanity (lighter set; you can expand)
  /\b(fuck(?:ing|er)?|sh[i1]t|bullsh[i1]t|asshole|cunt|bitch|motherfucker)\b/gi,

  // sexual explicit / solicitation
  /\b(anal|blowjob|handjob|cumshot|deepthroat|xxx|porn|hentai)\b/gi,

  // doxing-like terms (emails/phones are often sensitive; choose policy)
  // /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,   // uncomment to mask emails
];

// Any EVM/Sui-like address “0x...” gets redacted to avoid doxing/piling-on.
const ADDRESS_RE = /\b0x[a-fA-F0-9]{10,}\b/g;

export function censorText(input) {
  if (!input || typeof input !== "string") {
    return { text: "", flagged: false };
  }

  let out = input;
  let flagged = false;

  // Redact addresses
  if (ADDRESS_RE.test(out)) {
    flagged = true;
    out = out.replace(ADDRESS_RE, (m) => `${m.slice(0, 4)}…[redacted]`);
  }

  // Mask banned terms
  for (const re of BANNED_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(out)) {
      flagged = true;
      out = out.replace(re, (m) => "*".repeat(Math.min(m.length, 8)) || "***");
    }
  }

  // Normalize repeated asterisks into a tidy token (optional)
  out = out.replace(/\*{6,}/g, "[censored]");

  // Basic trim
  out = out.trim();

  return { text: out, flagged };
}
