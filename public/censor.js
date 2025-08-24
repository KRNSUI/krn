// public/censor.js
// Centralized bad-word / sensitive-pattern list + sanitizer

const BANNED_PATTERNS = [
  // --- slurs / harassment (examples; extend as needed) ---
  /\b(ni+g+g*e*r+|ch[i1]nk|sp[i1]c|k[i1]ke|raghead|g[o0]o+k)\b/gi,
  /\b(fag|f[a@]gg?o+t|dyke)\b/gi,

  // --- profanity (common variations) ---
  /\b(fuck(?:ing|er|tard)?|f\W*u\W*c\W*k+)\b/gi,
  /\b(sh[i1]t(?:s|ty|tiest|head)?)\b/gi,
  /\b(bullsh[i1]t)\b/gi,
  /\b(asshole|a\W*s+\W*h[o0]l[e3])\b/gi,
  /\b(cunt|c\W*u\W*n\W*t)\b/gi,
  /\b(bitch|bi+ch|b[i1]tch)\b/gi,
  /\b(motherfucker|m[o0]fo|m[o0]therf[u*]cker)\b/gi,

  // --- sexual explicit / anatomy / acts ---
  // * Attempts to dodge some common false positives with (?!...) where sensible.
  // cock (but not cocktail/cockpit)
  /\b(c[o0]ck)s?\b(?!\s*(tail|pit))/gi,
  // dick (but not dickens/dickinson)
  /\b(d[i1]ck)s?\b(?!\s*(ens|inson))/gi,
  // penis
  /\b(p[e3]n[i1]s|p[e3]n[i1]ses)\b/gi,
  // pussy
  /\b(p[u*]ssy|p[u*]ssies)\b/gi,
  // tits / boobs
  /\b(t[i1]ts?|b[o0]{2}bs?)\b/gi,
  // balls / testicles
  /\b(b[a@]lls|test[i1]c(?:le|les))\b/gi,
  // vagina / clit
  /\b(vag[i1]na|c[l1]it)\b/gi,
  // cum / semen / jizz / orgasm
  /\b(c[u*]m(?:shot)?|semen|j[i1]zz|orga?sm)\b/gi,
  // whore / slut (var.)
  /\b(wh[o0]r[e3]|w\W*h[o0]r\W*e)\b/gi,
  /\b(slut|sl[u*]tty|sl\W*u\W*t)\b/gi,
  // explicit verbs (light set)
  /\b(masturbat(?:e|ing|ion)|jerk\s*off|blowjob|handjob|deepthroat|hentai|porn|xxx)\b/gi,
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
