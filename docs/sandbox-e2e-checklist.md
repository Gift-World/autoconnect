# Sandbox end-to-end checklist

Use a separate Supabase project and Stripe test-mode keys. Never enable preview personas in the production build.

Create four separate verified test identities: buyer, parts supplier, service provider, and administrator. Give the supplier one approved `parts_shops` record. The service provider must claim its listed `service_providers` record, then an administrator approves that claim before testing its inbox. Apply migrations `0022_connected_aftercare_hardening.sql`, `0023_aftercare_receipts_reviews.sql`, `0025_service_booking_policy_alignment.sql`, and `0026_service_provider_activation.sql` before testing.

## Journeys to pass

1. Buyer adds a vehicle, requests a part quote, and links it to that vehicle. The supplier can see only its own inquiry.
2. Buyer requests service against its vehicle. The provider quotes it, buyer approves it, provider confirms, starts, and completes it with completion notes. A receipt number is created; the buyer submits exactly one review.
3. Buyer submits a bank-transfer reservation. It stays `awaiting_manual_payment` until an administrator verifies the real test transfer.
4. Buyer completes Stripe with Stripe’s test payment method. The UI must remain "verification in progress" until the signed Stripe webhook changes the transaction to `payment_received`.
5. Buyer completes an M-Pesa sandbox request. The UI must remain pending until `checkMpesaPaymentStatus` receives a successful provider response and the transaction changes to `payment_received`.
6. Repeat every request while signed in as another customer. It must be denied by RLS and never expose the other account’s Garage, booking, inquiry, or transaction.

Record the test transaction, provider event, and final database status for each case. A missing response is an outage/error, not an empty successful result.
