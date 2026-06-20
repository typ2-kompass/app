import { describe, it, expect } from "vitest";
import { renderActivationEmail } from "./mail";

describe("renderActivationEmail – B2C", () => {
  const result = renderActivationEmail({
    kind: "b2c",
    code: "ABC-123",
    activationUrl: "https://typ2-kompass.de/aktivieren?token=xyz",
  });

  it("has correct subject", () => {
    expect(result.subject).toBe("Dein Aktivierungscode für Typ2-Kompass");
  });

  it("plaintext contains code and URL", () => {
    expect(result.text).toContain("ABC-123");
    expect(result.text).toContain("https://typ2-kompass.de/aktivieren?token=xyz");
  });

  it("plaintext contains support email", () => {
    expect(result.text).toContain("support@typ2-kompass.de");
  });

  it("HTML contains code", () => {
    expect(result.html).toContain("ABC-123");
  });

  it("HTML contains activation button link", () => {
    expect(result.html).toContain("https://typ2-kompass.de/aktivieren?token=xyz");
  });

  it("HTML is valid shell (doctype + lang=de)", () => {
    expect(result.html).toContain("<!doctype html>");
    expect(result.html).toContain('lang="de"');
  });

  it("HTML contains support email in footer", () => {
    expect(result.html).toContain("support@typ2-kompass.de");
  });
});

describe("renderActivationEmail – B2B admin", () => {
  const codes = ["TEAM-001", "TEAM-002", "TEAM-003"];
  const result = renderActivationEmail({
    kind: "b2b_admin",
    codes,
    adminUrl: "https://typ2-kompass.de/seats/ORDER-TOKEN",
  });

  it("subject mentions code count", () => {
    expect(result.subject).toContain("3");
  });

  it("plaintext lists all codes", () => {
    for (const code of codes) {
      expect(result.text).toContain(code);
    }
  });

  it("plaintext contains admin URL", () => {
    expect(result.text).toContain("https://typ2-kompass.de/seats/ORDER-TOKEN");
  });

  it("HTML lists all codes", () => {
    for (const code of codes) {
      expect(result.html).toContain(code);
    }
  });

  it("HTML contains admin URL button", () => {
    expect(result.html).toContain("https://typ2-kompass.de/seats/ORDER-TOKEN");
  });

  it("HTML contains support email in footer", () => {
    expect(result.html).toContain("support@typ2-kompass.de");
  });
});

describe("renderActivationEmail – B2B employee", () => {
  const result = renderActivationEmail({
    kind: "b2b_employee",
    code: "EMP-999",
    activationUrl: "https://typ2-kompass.de/aktivieren?token=emp",
    companyName: "Musterfirma GmbH",
  });

  it("has correct subject", () => {
    expect(result.subject).toBe("Dein Zugang zu Typ2-Kompass");
  });

  it("plaintext mentions company name", () => {
    expect(result.text).toContain("Musterfirma GmbH");
  });

  it("plaintext contains code and URL", () => {
    expect(result.text).toContain("EMP-999");
    expect(result.text).toContain("https://typ2-kompass.de/aktivieren?token=emp");
  });

  it("HTML contains code and company name", () => {
    expect(result.html).toContain("EMP-999");
    expect(result.html).toContain("Musterfirma GmbH");
  });

  it("HTML contains support email in footer", () => {
    expect(result.html).toContain("support@typ2-kompass.de");
  });
});

describe("renderActivationEmail – B2B employee without companyName", () => {
  const result = renderActivationEmail({
    kind: "b2b_employee",
    code: "EMP-000",
    activationUrl: "https://typ2-kompass.de/aktivieren?token=anon",
  });

  it("renders without crashing", () => {
    expect(result.html).toContain("EMP-000");
    expect(result.subject).toBe("Dein Zugang zu Typ2-Kompass");
  });
});
