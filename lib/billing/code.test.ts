import { describe, it, expect } from "vitest";
import { generateActivationCode, isActivationCodeFormat } from "./code";

const CROCKFORD = /^[0-9A-HJ-NP-TV-Z]+$/;

describe("generateActivationCode", () => {
  it("returns a string matching K-XXXX-XXXX-XXXX", () => {
    const code = generateActivationCode();
    expect(code).toMatch(/^K-[0-9A-HJ-NP-TV-Z]{4}-[0-9A-HJ-NP-TV-Z]{4}-[0-9A-HJ-NP-TV-Z]{4}$/);
  });

  it("each segment uses only Crockford-base32 chars (no I, L, O, U)", () => {
    for (let i = 0; i < 20; i++) {
      const [, a, b, c] = generateActivationCode().split("-");
      expect(a).toMatch(CROCKFORD);
      expect(b).toMatch(CROCKFORD);
      expect(c).toMatch(CROCKFORD);
    }
  });

  it("produces unique codes across 200 calls", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateActivationCode()));
    expect(codes.size).toBe(200);
  });

  it("respects injected randomBytes (deterministic test)", () => {
    const fixed = new Uint8Array([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    ]);
    const code = generateActivationCode(() => fixed);
    // Each byte & 0x1f: 0,1,2,3,4,5,6,7,8,9,10,11 → ALPHABET[n]
    // ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
    // 0→'0',1→'1',2→'2',3→'3',4→'4',5→'5',6→'6',7→'7',8→'8',9→'9',10→'A',11→'B'
    expect(code).toBe("K-0123-4567-89AB");
  });
});

describe("isActivationCodeFormat", () => {
  it("accepts a valid code", () => {
    expect(isActivationCodeFormat("K-0123-ABCD-WXYZ")).toBe(true);
  });

  it("rejects codes with disallowed chars (I, L, O, U)", () => {
    expect(isActivationCodeFormat("K-IOIU-ABCD-1234")).toBe(false);
    expect(isActivationCodeFormat("K-LLLL-LLLL-LLLL")).toBe(false);
  });

  it("rejects wrong prefix", () => {
    expect(isActivationCodeFormat("A-0123-ABCD-WXYZ")).toBe(false);
  });

  it("rejects wrong segment length", () => {
    expect(isActivationCodeFormat("K-012-ABCD-WXYZ")).toBe(false);
    expect(isActivationCodeFormat("K-01234-ABCD-WXY")).toBe(false);
  });

  it("rejects lowercase", () => {
    expect(isActivationCodeFormat("K-abcd-ABCD-WXYZ")).toBe(false);
  });

  it("rejects generated codes (all should pass)", () => {
    for (let i = 0; i < 50; i++) {
      expect(isActivationCodeFormat(generateActivationCode())).toBe(true);
    }
  });
});
