-- Migration 008: Formal Agreement workflow
-- Creates a separate formal_agreements table linked to the negotiation agreement

CREATE TABLE IF NOT EXISTS formal_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negotiation_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    final_price DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_deadline DATE NOT NULL,
    terms TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'agreement_created',
    owner_signed BOOLEAN NOT NULL DEFAULT FALSE,
    owner_signed_at TIMESTAMP,
    buyer_signed BOOLEAN NOT NULL DEFAULT FALSE,
    buyer_signed_at TIMESTAMP,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_proof_url VARCHAR(500),
    payment_uploaded_at TIMESTAMP,
    payment_verified_at TIMESTAMP,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formal_agreements_negotiation ON formal_agreements(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_formal_agreements_owner ON formal_agreements(owner_id);
CREATE INDEX IF NOT EXISTS idx_formal_agreements_buyer ON formal_agreements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_formal_agreements_status ON formal_agreements(status);

-- Also update the negotiation agreements status constraint to include price_agreed
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_status_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_status_check CHECK (
    status::text = ANY (ARRAY[
        'pending','forwarded_to_owner','counter_offer','counter_offer_sent',
        'buyer_accepted_counter','buyer_rejected_counter','buyer_counter_offer',
        'buyer_counter_forwarded','owner_approved','owner_rejected',
        'payment_submitted','payment_confirmed','payment_verified',
        'price_agreed','completed'
    ])
);

CREATE TRIGGER update_formal_agreements_updated_at
    BEFORE UPDATE ON formal_agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
