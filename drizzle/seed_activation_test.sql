-- Manual test fixture for the activation flow (TYP-50).
-- Seeds one B2C order + one pending activation code. Run *after* the 0000/0001/0002
-- migrations against a local D1 (`wrangler d1 execute typ2-kompass-db --local`).
-- Until TYP-49 (the Stripe webhook) lands, this is how we exercise /aktivieren
-- end-to-end against a real D1 binding.
--
-- Verification:
--   1) Insert this fixture.
--   2) Visit http://localhost:8788/aktivieren/K-TEST-0001-AAAA
--      → expected: 303 redirect to /onboarding (new user), session cookie set,
--        users row created with email=test+activation@example.com, entitlement
--        row inserted, consent receipt (kind=purchase) written, activation_code
--        flipped to status=redeemed.
--   3) Visit the same URL again.
--      → expected: 303 redirect to /aktivieren/fehler?reason=ungueltig
--        with the "bereits eingelöst" copy and magic-link CTA.

INSERT OR REPLACE INTO orders
    (id, stripeSessionId, buyerEmail, productSku, quantity, amountTotalCents, currency, status, createdAt)
VALUES
    ('ord_test_typ50', 'cs_test_typ50', 'test+activation@example.com',
     'typ2-kompass-basic', 1, 4900, 'EUR', 'paid', '2026-06-19T00:00:00.000Z');

INSERT OR REPLACE INTO activation_codes
    (code, orderId, recipientEmail, status, sentAt)
VALUES
    ('K-TEST-0001-AAAA', 'ord_test_typ50', NULL, 'pending', '2026-06-19T00:00:00.000Z');
