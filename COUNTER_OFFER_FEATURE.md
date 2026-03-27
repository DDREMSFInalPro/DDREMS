# Buyer Counter-Offer Feature Implementation

## Overview

This feature enables buyers to respond to owner counter-offers with three actions:

1. **Accept** - Accept the owner's counter-offer price
2. **Reject** - Decline the counter-offer
3. **Counter** - Make a new counter-offer with a different price

## New Agreement Statuses

### Added Statuses:

- `buyer_accepted_counter` - Buyer accepted the owner's counter-offer
- `buyer_rejected_counter` - Buyer rejected the owner's counter-offer
- `buyer_counter_offer` - Buyer made a new counter-offer

## Workflow

### Original Flow:

1. Buyer requests agreement → `pending`
2. Admin forwards to owner → `forwarded_to_owner`
3. Owner makes counter-offer → `counter_offer`
4. Admin sends to buyer → `counter_offer_sent`
5. ❌ Buyer had no way to respond

### New Enhanced Flow:

1. Buyer requests agreement → `pending`
2. Admin forwards to owner → `forwarded_to_owner`
3. Owner makes counter-offer → `counter_offer`
4. Admin sends to buyer → `counter_offer_sent`
5. **Buyer responds:**
   - **Accept** → `buyer_accepted_counter` → Admin approves → `owner_approved` → PDF generated
   - **Reject** → `buyer_rejected_counter` (negotiation ends)
   - **Counter** → `buyer_counter_offer` → Owner reviews (back to step 3)

## Database Changes

### New Columns in `agreements` table:

- `buyer_counter_price` (DECIMAL 15,2) - Buyer's counter-offer price
- `buyer_notes` (TEXT) - Buyer's notes/explanation for counter-offer

**Migration file:** `migrations/003_buyer_counter_offer.sql`

## Backend Changes

### Buyer Module (`DDREMS-main/Buyer/backend/`)

#### New Endpoint:

- `PATCH /api/agreements/:id/respond-counter`
  - Actions: `accept`, `reject`, `counter_offer`
  - Body: `{ action, counterOfferPrice?, buyerNotes? }`

#### Files Modified:

- `controllers/agreementController.js` - Added `respondToCounterOffer()` function
- `routes/agreementRoutes.js` - Added new route
- `models/Agreement.js` - Added new columns and statuses

### Owner Module (`DDREMS-main/Owner/Owner/backend/`)

#### Changes:

- `controllers/agreementController.js` - Updated to accept `buyer_counter_offer` status for owner response
- `models/Agreement.js` - Added new columns and statuses

### PropertyAdmin Module (`DDREMS-main/PropertyAdmin/backend/`)

#### New Endpoints:

- `PATCH /api/agreements/:id/forward-buyer-counter` - Acknowledge buyer counter-offer
- `PATCH /api/agreements/:id/approve-buyer-acceptance` - Approve when buyer accepts counter

#### Files Modified:

- `controllers/agreementController.js` - Added new functions
- `routes/agreementRoutes.js` - Added new routes
- `models/Agreement.js` - Added new columns and statuses

## Frontend Changes

### Buyer Module (`DDREMS-main/Buyer/frontend/`)

#### AgreementRequestsPage.jsx:

- Added action buttons for counter-offers (Accept, Reject, Counter)
- Added counter-offer modal for entering new price and notes
- Updated status badges and labels
- Shows owner's counter-offer price and notes
- Shows buyer's counter-offer when sent

#### API Service:

- Added `respondToCounter(id, data)` method

### Owner Module (`DDREMS-main/Owner/Owner/frontend/`)

#### AgreementPage.jsx:

- Updated to show buyer counter-offers in pending requests
- Displays buyer's counter-offer price and notes
- Owner can respond to buyer counter-offers same as initial requests
- Updated status configuration

### PropertyAdmin Module (`DDREMS-main/PropertyAdmin/frontend/`)

#### AgreementManagementPage.jsx:

- Added action buttons for buyer counter-offers
- "Acknowledge" button for `buyer_counter_offer` status
- "Approve Agreement" button for `buyer_accepted_counter` status
- Updated status filters and badges
- Shows both owner and buyer counter-offer prices

#### API Service:

- Added `forwardBuyerCounterToOwner(id, data)` method
- Added `approveBuyerAcceptance(id, data)` method

## Testing the Feature

### 1. Setup Database:

Run the migration to add new columns (see `migrations/RUN_THIS_MANUALLY.md`)

### 2. Test Scenario:

**Step 1:** As Buyer (http://localhost:5174)

- Browse properties and request an agreement

**Step 2:** As Admin (http://localhost:5175)

- Forward the agreement to the owner

**Step 3:** As Owner (http://localhost:5173)

- Make a counter-offer with a different price

**Step 4:** As Admin

- Send the counter-offer to the buyer

**Step 5:** As Buyer - Test all three actions:

**Option A - Accept:**

- Click "Accept" button
- Status changes to `buyer_accepted_counter`
- Admin can now approve and generate PDF

**Option B - Reject:**

- Click "Reject" button
- Status changes to `buyer_rejected_counter`
- Negotiation ends

**Option C - Counter:**

- Click "Counter" button
- Enter new price and notes
- Submit counter-offer
- Status changes to `buyer_counter_offer`
- Owner sees the buyer's counter in their pending requests
- Owner can accept, reject, or counter again (cycle continues)

## UI Features

### Buyer View:

- Clear action buttons when counter-offer is received
- Modal for entering counter-offer details
- Visual distinction between owner and buyer counter-offers
- Success/error messages for all actions

### Owner View:

- Buyer counter-offers appear in "Incoming Requests" section
- Blue highlight box showing buyer's counter-offer price and notes
- Same response options (Accept, Reject, Counter)

### Admin View:

- New status filters for all buyer response types
- Action buttons for processing buyer responses
- Visual indicators showing who made which counter-offer
- Streamlined approval process for accepted counter-offers

## Status Badge Colors:

- `buyer_accepted_counter` - Green (success)
- `buyer_rejected_counter` - Red (danger)
- `buyer_counter_offer` - Orange (warning)

## Notes:

- All services are currently running and will pick up the changes
- Database migration must be run manually (PostgreSQL columns)
- The negotiation can cycle multiple times between buyer and owner
- Admin facilitates the process but doesn't need to intervene for each counter
- Once buyer accepts, admin approves to move to `owner_approved` for PDF generation
