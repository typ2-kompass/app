-- Test fixture for the B2B-Verwalter page (TYP-52).
-- Seeds a B2B order (3 seats) with an orderToken.
-- Apply *after* 0000–0004 migrations.
--
-- Local dev:
--   wrangler d1 execute typ2-kompass-db --local --file=drizzle/0004_order_token.sql
--   wrangler d1 execute typ2-kompass-db --local --file=drizzle/seed_seats_test.sql
--
-- Verification:
--   Visit http://localhost:8788/seats/test-order-token-b2b-verwalter-2026
--   → Verwalter page shows 3 codes (all pending).
--   Assign an email to code K-B2B1-0001-AAAA → status becomes 'sent', email fired.
--   CSV export → downloads aktivierungscodes.csv with all 3 rows.

INSERT OR REPLACE INTO orders
    (id, stripeSessionId, buyerEmail, productSku, quantity, amountTotalCents,
     currency, status, createdAt, orderToken)
VALUES
    ('ord_test_b2b', 'cs_test_b2b', 'firma@example.com',
     'typ2-kompass-b2b-3', 3, 14700, 'EUR', 'paid',
     '2026-06-20T08:00:00.000Z', 'test-order-token-b2b-verwalter-2026');

INSERT OR REPLACE INTO activation_codes (code, orderId, recipientEmail, status)
VALUES
    ('K-B2B1-0001-AAAA', 'ord_test_b2b', NULL, 'pending'),
    ('K-B2B1-0002-BBBB', 'ord_test_b2b', NULL, 'pending'),
    ('K-B2B1-0003-CCCC', 'ord_test_b2b', NULL, 'pending');
