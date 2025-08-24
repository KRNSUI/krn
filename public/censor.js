// public/censor.js
// Centralized bad-word / sensitive-pattern list + sanitizer

// ⚠️ Keep this list short-ish and specific. Add/remove as you see fit.
const BANNED_PATTERNS = [
  // slurs / racism / harassment (examples; extend as needed)
  /\b(ni+g+g*e*r+|ch[i1]nk|sp[i1]c|k[i1]ke|raghead|g[o0]o+k)\b/gi,
  /\b(fag|f[a@]gg?o+t|dyke)\b/gi,

  // profanity with common variations
  /\b(fuck(?:ing|er|tard)?|f\W*u\W*c\W*k+)\b/gi,      // fuck + variants
  /\b(sh[i1]t(?:s|ty|tiest|head)?)\b/gi,              // shit, shits, shitty…
  /\b(bullsh[i1]t)\b/gi,                              // bullshit
  /\b(asshole|a\W*s+\W*h[o0]l[e3])\b/gi,              // asshole with variations
  /\b(cunt|c\W*u\W*n\W*t)\b/gi,                       // cunt
  /\b(bitch|bi+ch|b[i1]tch)\b/gi,                     // bitch
  /\b(motherfucker|m[o0]fo|m[o0]therf[u*]cker)\b/gi,  // motherfucker

  // sexual explicit
  /\b(wh[o0]r[e3]|w\W*h[o0]r\W*e)\b/gi,               // whore, wh0re, w h o r e
  /\b(slut|sl[u*]tty|sl\W*u\W*t)\b/gi,                // slut
  /\b(anal|blowjob|handjob|cumshot|deepthroat|xxx|porn|hentai)\b/gi,
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
