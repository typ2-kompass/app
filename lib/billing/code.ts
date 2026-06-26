// Activation-code generator (TYP-49).
// Format: K-XXXX-XXXX-XXXX – literal "K" prefix ("Kompass") + 3 groups of 4
// Crockford-base32 chars. 12 random chars × 5 bits = 60 bits of entropy
// (~1.15e18 unique values), comfortably collision-safe for our volume.
//
// Crockford alphabet (32 chars, excludes I, L, O, U) — chosen because it is
// easy to read and type for the 50+ target group: no look-alikes for 0/O or
// 1/I/L. See https://www.crockford.com/base32.html.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateActivationCode(
  randomBytes: (n: number) => Uint8Array = (n) =>
    crypto.getRandomValues(new Uint8Array(n)),
): string {
  // 12 random chars across the 32-char alphabet. We read 12 bytes and mask to
  // 5 bits per char; that introduces a tiny bias (32/256 = exact), so no
  // rejection sampling needed.
  const bytes = randomBytes(12);
  let body = "";
  for (let i = 0; i < 12; i += 1) {
    body += ALPHABET[bytes[i] & 0x1f];
  }
  return `K-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export function isActivationCodeFormat(value: string): boolean {
  // Crockford alphabet: 0-9 A-H J K M N P-T V-Z (no I, L, O, U)
  return /^K-[0-9A-HJ-KMNP-TV-Z]{4}-[0-9A-HJ-KMNP-TV-Z]{4}-[0-9A-HJ-KMNP-TV-Z]{4}$/.test(
    value,
  );
}
