import { describe, it, expect } from "vitest";
import { getProduct, paymentMethodsFor, PRODUCTS } from "./products";

describe("getProduct", () => {
  it("returns B2C product for valid SKU", () => {
    const p = getProduct("kompass_b2c_einmal_v1");
    expect(p).not.toBeNull();
    expect(p?.sku).toBe("kompass_b2c_einmal_v1");
    expect(p?.isB2B).toBe(false);
    expect(p?.mode).toBe("payment");
    expect(p?.maxQuantity).toBe(1);
  });

  it("returns B2B product for valid SKU", () => {
    const p = getProduct("kompass_b2b_seat_v1");
    expect(p).not.toBeNull();
    expect(p?.isB2B).toBe(true);
    expect(p?.maxQuantity).toBeGreaterThan(1);
  });

  it("returns null for unknown SKU", () => {
    expect(getProduct("unknown_sku")).toBeNull();
  });

  it("returns null for non-string input", () => {
    expect(getProduct(null)).toBeNull();
    expect(getProduct(42)).toBeNull();
    expect(getProduct(undefined)).toBeNull();
  });

  it("rejects prototype-pollution attempts", () => {
    expect(getProduct("__proto__")).toBeNull();
    expect(getProduct("constructor")).toBeNull();
  });

  it("all products have a priceEnvKey", () => {
    for (const p of Object.values(PRODUCTS)) {
      expect(typeof p.priceEnvKey).toBe("string");
      expect(p.priceEnvKey.length).toBeGreaterThan(0);
    }
  });
});

describe("paymentMethodsFor", () => {
  it("includes required DACH methods for payment mode", () => {
    const methods = paymentMethodsFor("payment");
    expect(methods).toContain("card");
    expect(methods).toContain("sepa_debit");
    expect(methods).toContain("sofort");
    expect(methods).toContain("klarna");
    expect(methods).toContain("paypal");
  });

  it("excludes sofort and klarna for subscription mode", () => {
    const methods = paymentMethodsFor("subscription");
    expect(methods).toContain("card");
    expect(methods).toContain("sepa_debit");
    expect(methods).not.toContain("sofort");
    expect(methods).not.toContain("klarna");
  });
});
