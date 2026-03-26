# Admin Forwarding Workflow for Counter-Offers

## Overview

All counter-offers (from both Owner and Buyer) now require admin review and forwarding before reaching the other party. This ensures proper oversight and control over the negotiation process.

## Updated Workflow

### Initial Request Flow:

1. **Buyer** creates agreement request → Status: `pending`
2. **Admin** reviews and forwards to owner → Status: `forwarded_to_owner`
3. **Owner** sees request and can respond

### Owner Counter-Offer Flow:

1. **Owner** makes counter-offer → Status: `counter_offer`
2. **Admin** reviews and forwards to buyer → Status: `counter_offer_sent`
3. **Buyer** sees counter-offer and can respond

### Buyer Counter-Offer Flow:

1. **Buyer** makes counter-offer → Status: `buyer_counter_offer`
2. **Admin** reviews and forwards to owner → Status: `buyer_counter_offer` (visible to owner)
3. **Owner** sees counter-offer and can respond

### Acceptance Flow:

1. **Buyer** accepts counter-offer → Status: `buyer_accepted_counter`
2. **Admin** approves agreement → Status: `owner_approved`
3. **Admin** generates PDF → Status: `completed`

## Status Meanings

| Status                   | Description                 | Who Can See  | Who Can Act                                              |
| ------------------------ | --------------------------- | ------------ | -------------------------------------------------------- |
| `pending`                | New request from buyer      | Admin        | Admin (forward to owner)                                 |
| `forwarded_to_owner`     | Admin forwarded to owner    | Owner, Admin | Owner (approve/reject/counter)                           |
| `counter_offer`          | Owner made counter-offer    | Admin        | Admin (forward to buyer)                                 |
| `counter_offer_sent`     | Admin sent counter to buyer | Buyer, Admin | Buyer (accept/reject/counter)                            |
| `buyer_counter_offer`    | Buyer made counter-offer    | Owner, Admin | Admin (forward to owner), Owner (approve/reject/counter) |
| `buyer_accepted_counter` | Buyer accepted counter      | Admin        | Admin (approve agreement)                                |
| `buyer_rejected_counter` | Buyer rejected counter      | All          | None (negotiation ended)                                 |
| `owner_approved`         | Owner approved              | Admin        | Admin (generate PDF)                                     |
| `owner_rejected`         | Owner rejected              | All          | None (negotiation ended)                                 |
| `completed`              | PDF generated               | All          | None (view PDF)                                          |

## Admin Actions by Status

### PropertyAdmin Detail Page Actions:

**Status: `pending`**

- Action: "📨 Forward to Owner"
- Result: Changes status to `forwarded_to_owner`

**Status: `counter_offer`**

- Message: "Owner has made a counter-offer. Review and forward it to the buyer."
- Action: "📨 Send Counter-Offer to Buyer"
- Result: Changes status to `counter_offer_sent`

**Status: `buyer_counter_offer`**

- Message: "Buyer has made a counter-offer. Review and forward it to the owner."
- Action: "📨 Forward Counter-Offer to Owner"
- Result: Status stays `buyer_counter_offer` (now visible to owner)

**Status: `buyer_accepted_counter`**

- Action: "✓ Approve Agreement"
- Result: Changes status to `owner_approved`

**Status: `owner_approved`**

- Action: "📄 Generate PDF"
- Result: Creates PDF and changes status to `completed`

**Status: `forwarded_to_owner` or `counter_offer_sent`**

- Message: "Waiting for [owner/buyer] response..."
- No action available

## User Experience

### Buyer Experience:

- Makes initial request → Sees "pending admin review"
- Receives counter-offer → Can Accept/Reject/Counter
- Makes counter-offer → Sees "sent to admin for review, they will forward to owner"
- Accepts counter → Sees "waiting for admin to finalize"

### Owner Experience:

- Receives request → Can Approve/Reject/Counter
- Makes counter-offer → Sees "pending admin review"
- Receives buyer counter → Can Approve/Reject/Counter
- Approves → Sees "waiting for admin to generate PDF"

### Admin Experience:

- Reviews all requests and counter-offers
- Forwards each step of negotiation
- Approves final agreement when buyer accepts
- Generates PDF for completed agreements
- Has full visibility and control over process

## Benefits

1. **Quality Control**: Admin reviews all offers before forwarding
2. **Compliance**: Ensures all negotiations follow proper procedures
3. **Transparency**: Clear status messages for all parties
4. **Audit Trail**: Every step requires admin action
5. **Dispute Prevention**: Admin can add notes at each step
6. **Flexibility**: Admin can intervene if needed

## Technical Implementation

### Backend:

- Owner counter-offers set status to `counter_offer`
- Buyer counter-offers set status to `buyer_counter_offer`
- Admin endpoints forward counter-offers
- Database constraint updated to include new statuses

### Frontend:

- Admin detail page shows context-aware messages
- Action buttons appear based on current status
- Buyer/Owner pages show waiting messages
- Timeline shows all offers regardless of forwarding status

## Database Changes

Updated CHECK constraint on `agreements.status`:

```sql
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_status_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_status_check
CHECK (status IN (
    'pending',
    'forwarded_to_owner',
    'counter_offer',
    'counter_offer_sent',
    'buyer_accepted_counter',
    'buyer_rejected_counter',
    'buyer_counter_offer',
    'owner_approved',
    'owner_rejected',
    'completed'
));
```

## Testing

1. **Test Owner Counter-Offer**:
   - Owner makes counter → Status = `counter_offer`
   - Admin forwards → Status = `counter_offer_sent`
   - Buyer sees counter-offer

2. **Test Buyer Counter-Offer**:
   - Buyer makes counter → Status = `buyer_counter_offer`
   - Admin forwards → Owner sees counter-offer
   - Owner can respond

3. **Test Acceptance**:
   - Buyer accepts → Status = `buyer_accepted_counter`
   - Admin approves → Status = `owner_approved`
   - Admin generates PDF → Status = `completed`

## Notes

- All counter-offers require admin action
- Timeline shows offers even before forwarding
- Status messages clearly indicate waiting for admin
- Admin has full control over negotiation flow
