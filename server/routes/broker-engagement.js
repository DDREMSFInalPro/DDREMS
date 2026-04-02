const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ============================================================================
// HELPER: Log engagement history
// ============================================================================
async function logHistory(engagementId, action, userId, userRole, prevStatus, newStatus, notes, metadata) {
  await db.query(
    `INSERT INTO broker_engagement_history
       (engagement_id, action, action_by_id, action_by_role, previous_status, new_status, notes, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [engagementId, action, userId, userRole, prevStatus, newStatus, notes, metadata ? JSON.stringify(metadata) : null]
  );
}

// HELPER: Add system message to engagement thread
async function systemMessage(engagementId, message, metadata) {
  await db.query(
    `INSERT INTO broker_engagement_messages
       (engagement_id, sender_id, sender_role, message_type, message, metadata)
     VALUES (?, NULL, 'system', 'system', ?, ?)`,
    [engagementId, message, metadata ? JSON.stringify(metadata) : null]
  );
}

// HELPER: Notify user
async function notifyUser(userId, title, message, type) {
  await db.query(
    "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
    [userId, title, message, type || "info"]
  );
}

// ============================================================================
// GET /api/broker-engagement/available-brokers
// Buyer fetches list of approved brokers
// ============================================================================
router.get("/available-brokers", async (req, res) => {
  try {
    const [brokers] = await db.query(`
      SELECT u.id, u.name, u.email, u.phone,
             bp.license_number, bp.profile_photo, bp.address,
             bp.profile_status
      FROM users u
      LEFT JOIN broker_profiles bp ON u.id = bp.user_id
      WHERE u.role = 'broker' AND u.status = 'active'
      ORDER BY u.name ASC
    `);
    res.json({ success: true, brokers });
  } catch (error) {
    console.error("Error fetching available brokers:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// POST /api/broker-engagement/hire
// Buyer hires a broker for a property
// ============================================================================
router.post("/hire", async (req, res) => {
  try {
    const { buyer_id, broker_id, property_id, starting_offer, buyer_message } = req.body;

    if (!buyer_id || !broker_id || !property_id) {
      return res.status(400).json({ success: false, message: "Buyer ID, Broker ID, and Property ID are required" });
    }

    // Get property details (owner)
    const [property] = await db.query("SELECT owner_id, price FROM properties WHERE id = ?", [property_id]);
    if (property.length === 0) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    const owner_id = property[0].owner_id;
    if (!owner_id) {
      return res.status(400).json({ success: false, message: "Property has no owner assigned" });
    }

    // Check for existing active engagement
    const [existing] = await db.query(
      `SELECT id FROM broker_engagements
       WHERE buyer_id = ? AND property_id = ? AND status NOT IN ('completed', 'cancelled', 'broker_declined')`,
      [buyer_id, property_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "You already have an active broker engagement for this property" });
    }

    // Create engagement
    const offer = starting_offer || property[0].price;
    const [result] = await db.query(
      `INSERT INTO broker_engagements
         (buyer_id, broker_id, property_id, owner_id, status, starting_offer, current_offer, buyer_message)
       VALUES (?, ?, ?, ?, 'pending_broker_acceptance', ?, ?, ?)`,
      [buyer_id, broker_id, property_id, owner_id, offer, offer, buyer_message || null]
    );

    const engId = result.insertId;

    // Log history
    await logHistory(engId, "engagement_created", buyer_id, "buyer", null, "pending_broker_acceptance",
      "Buyer hired broker for property negotiation", { starting_offer: offer });

    // System message
    await systemMessage(engId, `Buyer has requested broker representation with a starting offer of ${Number(offer).toLocaleString()} ETB.`);

    // If buyer sent a message, record it
    if (buyer_message) {
      await db.query(
        `INSERT INTO broker_engagement_messages
           (engagement_id, sender_id, sender_role, message_type, message)
         VALUES (?, ?, 'buyer', 'general', ?)`,
        [engId, buyer_id, buyer_message]
      );
    }

    // Notify broker
    await notifyUser(broker_id, "🤝 New Broker Engagement Request",
      "A buyer has requested you to represent them in a property purchase. Please review and accept/decline.", "info");

    res.json({
      success: true,
      message: "Broker engagement request created successfully",
      engagement_id: engId,
      status: "pending_broker_acceptance"
    });
  } catch (error) {
    console.error("Error creating broker engagement:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/broker-accept
// Broker accepts or declines representation
// ============================================================================
router.put("/:id/broker-accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { broker_id, decision, decline_reason } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "pending_broker_acceptance") {
      return res.status(400).json({ success: false, message: "Engagement is not pending broker acceptance" });
    }
    if (eng.broker_id !== broker_id) {
      return res.status(403).json({ success: false, message: "You are not the assigned broker" });
    }

    if (decision === "accept") {
      await db.query(
        `UPDATE broker_engagements SET status = 'broker_negotiating', broker_accepted_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [id]
      );
      await logHistory(id, "broker_accepted", broker_id, "broker", "pending_broker_acceptance", "broker_negotiating", "Broker accepted representation");
      await systemMessage(id, "Broker has accepted the engagement and will begin negotiating with the property owner.");
      await notifyUser(eng.buyer_id, "✅ Broker Accepted", "Your broker has accepted to represent you. They will now begin negotiations with the owner.", "success");

      res.json({ success: true, message: "Engagement accepted. You can now negotiate with the owner.", status: "broker_negotiating" });
    } else {
      await db.query(
        `UPDATE broker_engagements SET status = 'broker_declined', broker_decline_reason = ?, updated_at = NOW() WHERE id = ?`,
        [decline_reason || null, id]
      );
      await logHistory(id, "broker_declined", broker_id, "broker", "pending_broker_acceptance", "broker_declined",
        decline_reason || "Broker declined representation");
      await systemMessage(id, `Broker has declined the engagement.${decline_reason ? " Reason: " + decline_reason : ""}`);
      await notifyUser(eng.buyer_id, "❌ Broker Declined", `Your broker has declined representation.${decline_reason ? " Reason: " + decline_reason : ""}`, "error");

      res.json({ success: true, message: "Engagement declined.", status: "broker_declined" });
    }
  } catch (error) {
    console.error("Error processing broker acceptance:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/broker-negotiate
// Broker sends an offer to the owner
// ============================================================================
router.put("/:id/broker-negotiate", async (req, res) => {
  try {
    const { id } = req.params;
    const { broker_id, offer_price, message } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (!["broker_negotiating"].includes(eng.status)) {
      return res.status(400).json({ success: false, message: "Cannot negotiate in current status: " + eng.status });
    }
    if (eng.broker_id !== broker_id) {
      return res.status(403).json({ success: false, message: "You are not the assigned broker" });
    }

    const price = offer_price || eng.current_offer;

    await db.query(
      `UPDATE broker_engagements SET current_offer = ?, updated_at = NOW() WHERE id = ?`,
      [price, id]
    );

    // Record negotiation message
    await db.query(
      `INSERT INTO broker_engagement_messages
         (engagement_id, sender_id, sender_role, message_type, message, metadata)
       VALUES (?, ?, 'broker', 'negotiation', ?, ?)`,
      [id, broker_id, message || `Offer of ${Number(price).toLocaleString()} ETB`, JSON.stringify({ offer_price: price })]
    );

    await logHistory(id, "broker_sent_offer", broker_id, "broker", eng.status, eng.status,
      `Broker sent offer of ${Number(price).toLocaleString()} ETB to owner`, { offer_price: price });

    await notifyUser(eng.owner_id, "📋 New Offer from Broker",
      `A broker has sent an offer of ${Number(price).toLocaleString()} ETB for your property. Please review and respond.`, "info");

    res.json({ success: true, message: "Offer sent to owner", current_offer: price });
  } catch (error) {
    console.error("Error sending broker offer:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/owner-respond
// Owner accepts or sends counter-offer (goes to broker, NOT buyer)
// ============================================================================
router.put("/:id/owner-respond", async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_id, decision, counter_price, message } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (!["broker_negotiating"].includes(eng.status)) {
      return res.status(400).json({ success: false, message: "Cannot respond in current status: " + eng.status });
    }
    if (eng.owner_id !== owner_id) {
      return res.status(403).json({ success: false, message: "You are not the property owner" });
    }

    if (decision === "accept") {
      // Owner accepted the broker's offer
      await db.query(
        `UPDATE broker_engagements SET
           status = 'broker_finalizing', agreed_price = ?, owner_responded_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [eng.current_offer, id]
      );

      await db.query(
        `INSERT INTO broker_engagement_messages
           (engagement_id, sender_id, sender_role, message_type, message, metadata)
         VALUES (?, ?, 'owner', 'negotiation', ?, ?)`,
        [id, owner_id, message || "Owner accepted the offer.", JSON.stringify({ decision: "accept", accepted_price: eng.current_offer })]
      );

      await logHistory(id, "owner_accepted", owner_id, "owner", eng.status, "broker_finalizing",
        `Owner accepted offer of ${Number(eng.current_offer).toLocaleString()} ETB`, { accepted_price: eng.current_offer });
      await systemMessage(id, `Owner has accepted the offer of ${Number(eng.current_offer).toLocaleString()} ETB.`);

      // Notify broker
      await notifyUser(eng.broker_id, "✅ Owner Accepted Offer",
        `The owner has accepted your offer of ${Number(eng.current_offer).toLocaleString()} ETB. Please finalize with the buyer.`, "success");
      // Notify buyer
      await notifyUser(eng.buyer_id, "✅ Offer Accepted!",
        `Great news! The owner has accepted the offer. Your broker will finalize the deal.`, "success");

      res.json({ success: true, message: "Offer accepted by owner", status: "broker_finalizing", agreed_price: eng.current_offer });

    } else if (decision === "counter") {
      // Owner sends counter-offer → goes to broker
      if (!counter_price) {
        return res.status(400).json({ success: false, message: "Counter price is required" });
      }

      await db.query(
        `UPDATE broker_engagements SET
           status = 'broker_reviewing_counter', owner_counter_price = ?, owner_counter_message = ?,
           owner_responded_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [counter_price, message || null, id]
      );

      await db.query(
        `INSERT INTO broker_engagement_messages
           (engagement_id, sender_id, sender_role, message_type, message, metadata)
         VALUES (?, ?, 'owner', 'counter_offer', ?, ?)`,
        [id, owner_id, message || `Counter offer: ${Number(counter_price).toLocaleString()} ETB`,
         JSON.stringify({ counter_price, original_offer: eng.current_offer })]
      );

      await logHistory(id, "owner_counter_offered", owner_id, "owner", eng.status, "broker_reviewing_counter",
        `Owner sent counter-offer of ${Number(counter_price).toLocaleString()} ETB`, { counter_price });
      await systemMessage(id, `Owner has sent a counter-offer of ${Number(counter_price).toLocaleString()} ETB.`);

      // Notify broker only (NOT buyer — broker reviews first)
      await notifyUser(eng.broker_id, "🔄 Owner Counter-Offer",
        `The owner has sent a counter-offer of ${Number(counter_price).toLocaleString()} ETB. Please review and advise the buyer.`, "info");

      res.json({ success: true, message: "Counter-offer sent to broker", status: "broker_reviewing_counter", counter_price });

    } else if (decision === "reject") {
      await db.query(
        `UPDATE broker_engagements SET status = 'cancelled', owner_responded_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [id]
      );

      await db.query(
        `INSERT INTO broker_engagement_messages
           (engagement_id, sender_id, sender_role, message_type, message)
         VALUES (?, ?, 'owner', 'negotiation', ?)`,
        [id, owner_id, message || "Owner rejected the offer."]
      );

      await logHistory(id, "owner_rejected", owner_id, "owner", eng.status, "cancelled", "Owner rejected the offer");
      await systemMessage(id, "Owner has rejected the offer. The engagement has been cancelled.");
      await notifyUser(eng.broker_id, "❌ Owner Rejected Offer", "The property owner has rejected the offer.", "error");
      await notifyUser(eng.buyer_id, "❌ Offer Rejected", "The property owner has rejected the offer.", "error");

      res.json({ success: true, message: "Offer rejected by owner", status: "cancelled" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid decision. Use 'accept', 'counter', or 'reject'." });
    }
  } catch (error) {
    console.error("Error processing owner response:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/broker-advise
// Broker reviews counter-offer and advises buyer
// ============================================================================
router.put("/:id/broker-advise", async (req, res) => {
  try {
    const { id } = req.params;
    const { broker_id, recommendation, advice_message } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "broker_reviewing_counter") {
      return res.status(400).json({ success: false, message: "No counter-offer to review in current status: " + eng.status });
    }
    if (eng.broker_id !== broker_id) {
      return res.status(403).json({ success: false, message: "You are not the assigned broker" });
    }
    if (!["accept", "counter", "walk_away"].includes(recommendation)) {
      return res.status(400).json({ success: false, message: "Recommendation must be 'accept', 'counter', or 'walk_away'" });
    }

    await db.query(
      `UPDATE broker_engagements SET
         status = 'awaiting_buyer_authorization', broker_advice = ?, broker_recommendation = ?,
         broker_advised_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [advice_message || null, recommendation, id]
    );

    // Record advice as message
    const recEmoji = recommendation === "accept" ? "✅" : recommendation === "counter" ? "🔄" : "🚫";
    const recLabel = recommendation === "accept" ? "Accept" : recommendation === "counter" ? "Counter" : "Walk Away";

    await db.query(
      `INSERT INTO broker_engagement_messages
         (engagement_id, sender_id, sender_role, message_type, message, metadata)
       VALUES (?, ?, 'broker', 'advice', ?, ?)`,
      [id, broker_id,
       `${recEmoji} Broker Recommendation: ${recLabel}\n\n${advice_message || "No additional comments."}`,
       JSON.stringify({
         recommendation,
         owner_counter_price: eng.owner_counter_price,
         current_offer: eng.current_offer
       })]
    );

    await logHistory(id, "broker_advised", broker_id, "broker", "broker_reviewing_counter", "awaiting_buyer_authorization",
      `Broker recommends: ${recLabel}`, { recommendation, owner_counter_price: eng.owner_counter_price });
    await systemMessage(id, `Broker has reviewed the counter-offer and recommends: ${recLabel}. Awaiting buyer authorization.`);

    // Notify buyer — they need to authorize
    await notifyUser(eng.buyer_id, `📬 Broker Advice: ${recEmoji} ${recLabel}`,
      `Your broker has reviewed the owner's counter-offer of ${Number(eng.owner_counter_price).toLocaleString()} ETB and recommends: ${recLabel}. Please review and authorize.`, "info");

    res.json({
      success: true,
      message: "Advice sent to buyer. Awaiting authorization.",
      status: "awaiting_buyer_authorization",
      recommendation
    });
  } catch (error) {
    console.error("Error sending broker advice:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/buyer-authorize
// Buyer authorizes acceptance, counter, or cancels
// ============================================================================
router.put("/:id/buyer-authorize", async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer_id, authorization, counter_price, message } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "awaiting_buyer_authorization") {
      return res.status(400).json({ success: false, message: "Not awaiting buyer authorization. Current status: " + eng.status });
    }
    if (eng.buyer_id !== buyer_id) {
      return res.status(403).json({ success: false, message: "You are not the buyer" });
    }
    if (!["authorize_accept", "authorize_counter", "cancel"].includes(authorization)) {
      return res.status(400).json({ success: false, message: "Authorization must be 'authorize_accept', 'authorize_counter', or 'cancel'" });
    }

    if (authorization === "authorize_accept") {
      // Buyer accepts the owner's counter-offer price
      await db.query(
        `UPDATE broker_engagements SET
           status = 'broker_finalizing', buyer_authorization = 'authorize_accept',
           agreed_price = ?, current_offer = ?,
           buyer_auth_message = ?, buyer_authorized_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [eng.owner_counter_price, eng.owner_counter_price, message || null, id]
      );

      await db.query(
        `INSERT INTO broker_engagement_messages
           (engagement_id, sender_id, sender_role, message_type, message, metadata)
         VALUES (?, ?, 'buyer', 'authorization', ?, ?)`,
        [id, buyer_id, message || "Buyer authorized acceptance of the counter-offer.",
         JSON.stringify({ authorization: "authorize_accept", accepted_price: eng.owner_counter_price })]
      );

      await logHistory(id, "buyer_authorized_accept", buyer_id, "buyer", eng.status, "broker_finalizing",
        `Buyer authorized acceptance at ${Number(eng.owner_counter_price).toLocaleString()} ETB`,
        { accepted_price: eng.owner_counter_price });
      await systemMessage(id, `Buyer has authorized acceptance of the counter-offer at ${Number(eng.owner_counter_price).toLocaleString()} ETB. Broker can now finalize.`);

      await notifyUser(eng.broker_id, "✅ Buyer Authorized Acceptance",
        `The buyer has authorized acceptance of the counter-offer. Please finalize the deal.`, "success");

      res.json({ success: true, message: "Acceptance authorized. Broker will finalize.", status: "broker_finalizing" });

    } else if (authorization === "authorize_counter") {
      if (!counter_price) {
        return res.status(400).json({ success: false, message: "Counter price is required for authorize_counter" });
      }

      await db.query(
        `UPDATE broker_engagements SET
           status = 'broker_negotiating', buyer_authorization = 'authorize_counter',
           buyer_auth_counter_price = ?, current_offer = ?,
           buyer_auth_message = ?, buyer_authorized_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [counter_price, counter_price, message || null, id]
      );

      await db.query(
        `INSERT INTO broker_engagement_messages
           (engagement_id, sender_id, sender_role, message_type, message, metadata)
         VALUES (?, ?, 'buyer', 'authorization', ?, ?)`,
        [id, buyer_id, message || `Buyer authorized counter at ${Number(counter_price).toLocaleString()} ETB.`,
         JSON.stringify({ authorization: "authorize_counter", counter_price })]
      );

      await logHistory(id, "buyer_authorized_counter", buyer_id, "buyer", eng.status, "broker_negotiating",
        `Buyer authorized counter-offer at ${Number(counter_price).toLocaleString()} ETB`,
        { counter_price });
      await systemMessage(id, `Buyer has authorized a counter-offer of ${Number(counter_price).toLocaleString()} ETB. Broker returns to negotiation.`);

      await notifyUser(eng.broker_id, "🔄 Buyer Authorized Counter",
        `The buyer has authorized a counter-offer of ${Number(counter_price).toLocaleString()} ETB. Please negotiate with the owner.`, "info");

      res.json({ success: true, message: "Counter authorized. Broker will negotiate.", status: "broker_negotiating" });

    } else {
      // cancel
      await db.query(
        `UPDATE broker_engagements SET
           status = 'cancelled', buyer_authorization = 'cancel',
           buyer_auth_message = ?, buyer_authorized_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [message || null, id]
      );

      await db.query(
        `INSERT INTO broker_engagement_messages
           (engagement_id, sender_id, sender_role, message_type, message)
         VALUES (?, ?, 'buyer', 'authorization', ?)`,
        [id, buyer_id, message || "Buyer cancelled broker representation."]
      );

      await logHistory(id, "buyer_cancelled", buyer_id, "buyer", eng.status, "cancelled", "Buyer cancelled representation");
      await systemMessage(id, "Buyer has cancelled broker representation. The engagement is now closed.");

      await notifyUser(eng.broker_id, "❌ Buyer Cancelled Representation",
        "The buyer has cancelled broker representation.", "error");

      res.json({ success: true, message: "Representation cancelled.", status: "cancelled" });
    }
  } catch (error) {
    console.error("Error processing buyer authorization:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/broker-finalize
// Broker finalizes the accepted deal
// ============================================================================
router.put("/:id/broker-finalize", async (req, res) => {
  try {
    const { id } = req.params;
    const { broker_id } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "broker_finalizing") {
      return res.status(400).json({ success: false, message: "Cannot finalize in current status: " + eng.status });
    }
    if (eng.broker_id !== broker_id) {
      return res.status(403).json({ success: false, message: "You are not the assigned broker" });
    }

    await db.query(
      `UPDATE broker_engagements SET
         status = 'agreement_generated', finalized_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    await logHistory(id, "broker_finalized", broker_id, "broker", "broker_finalizing", "agreement_generated",
      `Broker finalized deal at ${Number(eng.agreed_price).toLocaleString()} ETB`);
    await systemMessage(id, `Broker has finalized the deal at ${Number(eng.agreed_price).toLocaleString()} ETB. Admin will generate the contract.`);

    // Notify admin
    const [admins] = await db.query("SELECT id FROM users WHERE role IN ('property_admin', 'system_admin') LIMIT 1");
    if (admins.length > 0) {
      await notifyUser(admins[0].id, "📄 Contract Ready for Generation",
        `Broker-assisted deal finalized at ${Number(eng.agreed_price).toLocaleString()} ETB. Please generate the PDF contract.`, "info");
    }

    await notifyUser(eng.buyer_id, "🎉 Deal Finalized!",
      `Your broker has finalized the deal at ${Number(eng.agreed_price).toLocaleString()} ETB. The admin will generate the contract for signing.`, "success");
    await notifyUser(eng.owner_id, "🎉 Deal Finalized!",
      `The deal has been finalized at ${Number(eng.agreed_price).toLocaleString()} ETB. A contract will be generated for signing.`, "success");

    res.json({ success: true, message: "Deal finalized. Admin will generate contract.", status: "agreement_generated" });
  } catch (error) {
    console.error("Error finalizing engagement:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// POST /api/broker-engagement/:id/generate-contract
// Admin generates PDF contract with agreed price
// ============================================================================
router.post("/:id/generate-contract", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "agreement_generated") {
      return res.status(400).json({ success: false, message: "Deal must be finalized before generating contract. Status: " + eng.status });
    }

    // Create agreement document
    const documentContent = JSON.stringify({
      engagement_id: eng.id,
      type: "broker_assisted_purchase",
      buyer_id: eng.buyer_id,
      broker_id: eng.broker_id,
      owner_id: eng.owner_id,
      property_id: eng.property_id,
      agreed_price: eng.agreed_price,
      starting_offer: eng.starting_offer,
      commission_percentage: eng.commission_percentage,
      generated_date: new Date().toISOString(),
      generated_by: admin_id
    });

    await db.query(
      `INSERT INTO agreement_documents
         (agreement_request_id, version, document_type, document_content, generated_by_id)
       VALUES (NULL, 1, 'broker_assisted', ?, ?)`,
      [documentContent, admin_id]
    );

    await db.query(
      `UPDATE broker_engagements SET
         status = 'pending_signatures', contract_generated_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    await logHistory(id, "contract_generated", admin_id, "admin", "agreement_generated", "pending_signatures",
      "Admin generated the PDF contract");
    await systemMessage(id, "Contract has been generated. All three parties must now sign: Buyer → Broker → Owner.");

    await notifyUser(eng.buyer_id, "📄 Contract Ready to Sign",
      "The contract has been generated. Please review and sign it.", "info");
    await notifyUser(eng.broker_id, "📄 Contract Generated",
      "The contract has been generated. Buyer will sign first, then you.", "info");
    await notifyUser(eng.owner_id, "📄 Contract Generated",
      "The contract has been generated. It will be sent to you for signing after the buyer and broker have signed.", "info");

    res.json({ success: true, message: "Contract generated. Awaiting signatures.", status: "pending_signatures" });
  } catch (error) {
    console.error("Error generating contract:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/sign
// Triple digital signature: Buyer → Broker → Owner
// ============================================================================
router.put("/:id/sign", async (req, res) => {
  try {
    const { id } = req.params;
    const { signer_id, signer_role, signature_data } = req.body;

    if (!["buyer", "broker", "owner"].includes(signer_role)) {
      return res.status(400).json({ success: false, message: "Invalid signer role" });
    }

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (!["pending_signatures", "agreement_generated"].includes(eng.status)) {
      return res.status(400).json({ success: false, message: "Not in signing phase. Status: " + eng.status });
    }

    // Verify signer identity
    const expectedSignerId =
      signer_role === "buyer" ? eng.buyer_id :
      signer_role === "broker" ? eng.broker_id : eng.owner_id;
    if (signer_id !== expectedSignerId) {
      return res.status(403).json({ success: false, message: "You are not authorized to sign as " + signer_role });
    }

    // Check existing signatures to enforce order
    const [existingSigs] = await db.query(
      "SELECT signer_role FROM broker_engagement_signatures WHERE engagement_id = ? ORDER BY signed_at ASC",
      [id]
    );
    const signedRoles = existingSigs.map(s => s.signer_role);

    // Enforce order: buyer → broker → owner
    if (signer_role === "broker" && !signedRoles.includes("buyer")) {
      return res.status(400).json({ success: false, message: "Buyer must sign before broker" });
    }
    if (signer_role === "owner" && (!signedRoles.includes("buyer") || !signedRoles.includes("broker"))) {
      return res.status(400).json({ success: false, message: "Buyer and broker must sign before owner" });
    }
    if (signedRoles.includes(signer_role)) {
      return res.status(400).json({ success: false, message: signer_role + " has already signed" });
    }

    // Record signature
    await db.query(
      `INSERT INTO broker_engagement_signatures
         (engagement_id, signer_id, signer_role, signature_data)
       VALUES (?, ?, ?, ?)`,
      [id, signer_id, signer_role, signature_data || "digital_signature_" + Date.now()]
    );

    await logHistory(id, signer_role + "_signed", signer_id, signer_role, eng.status, eng.status,
      signer_role.charAt(0).toUpperCase() + signer_role.slice(1) + " signed the contract",
      { signer_role, signed_at: new Date().toISOString() });

    const roleLabel = signer_role.charAt(0).toUpperCase() + signer_role.slice(1);
    await systemMessage(id, `${roleLabel} has signed the contract.`);

    // Check if all three have signed
    const allSigned = [...signedRoles, signer_role];
    if (allSigned.includes("buyer") && allSigned.includes("broker") && allSigned.includes("owner")) {
      await db.query(
        `UPDATE broker_engagements SET status = 'fully_signed', completed_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [id]
      );
      await logHistory(id, "fully_signed", signer_id, signer_role, eng.status, "fully_signed",
        "All three parties have signed. Contract is legally binding.");
      await systemMessage(id, "🎉 All three parties have signed the contract. The agreement is now legally binding!");

      await notifyUser(eng.buyer_id, "🎉 Contract Fully Signed!", "All parties have signed. The contract is now legally binding.", "success");
      await notifyUser(eng.broker_id, "🎉 Contract Fully Signed!", "All parties have signed. The contract is now legally binding.", "success");
      await notifyUser(eng.owner_id, "🎉 Contract Fully Signed!", "All parties have signed. The contract is now legally binding.", "success");

      res.json({ success: true, message: "All parties signed. Contract is binding.", status: "fully_signed" });
    } else {
      // Notify next signer
      const nextRole = !allSigned.includes("buyer") ? "buyer" : !allSigned.includes("broker") ? "broker" : "owner";
      const nextId = nextRole === "buyer" ? eng.buyer_id : nextRole === "broker" ? eng.broker_id : eng.owner_id;
      await notifyUser(nextId, `✍️ Your Signature Needed`,
        `The ${roleLabel} has signed the contract. It's now your turn to sign.`, "info");

      res.json({ success: true, message: `${roleLabel} signature recorded. Awaiting ${nextRole} signature.`, status: "pending_signatures" });
    }
  } catch (error) {
    console.error("Error processing signature:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// GET /api/broker-engagement/:id
// Get engagement details
// ============================================================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [engagement] = await db.query("SELECT * FROM v_broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    // Get signatures
    const [signatures] = await db.query(
      `SELECT bes.*, u.name AS signer_name
       FROM broker_engagement_signatures bes
       JOIN users u ON bes.signer_id = u.id
       WHERE bes.engagement_id = ? ORDER BY bes.signed_at ASC`,
      [id]
    );

    // Get history
    const [history] = await db.query(
      `SELECT beh.*, u.name AS action_by_name
       FROM broker_engagement_history beh
       LEFT JOIN users u ON beh.action_by_id = u.id
       WHERE beh.engagement_id = ? ORDER BY beh.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      engagement: engagement[0],
      signatures,
      history
    });
  } catch (error) {
    console.error("Error fetching engagement:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// GET /api/broker-engagement/:id/messages
// Get engagement message thread
// ============================================================================
router.get("/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;

    let filterClause = "";
    if (role === "owner") {
      filterClause = " AND bem.message_type NOT IN ('advice', 'authorization') ";
    }

    const [messages] = await db.query(
      `SELECT bem.*, u.name AS sender_name
       FROM broker_engagement_messages bem
       LEFT JOIN users u ON bem.sender_id = u.id
       WHERE bem.engagement_id = ? ${filterClause}
       ORDER BY bem.created_at ASC`,
      [id]
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// POST /api/broker-engagement/:id/messages
// Send a message in the engagement thread
// ============================================================================
router.post("/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_id, sender_role, message, message_type } = req.body;

    if (!sender_id || !message) {
      return res.status(400).json({ success: false, message: "Sender ID and message are required" });
    }

    // Verify engagement exists
    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    // Verify sender is a party
    const eng = engagement[0];
    const isParty = [eng.buyer_id, eng.broker_id, eng.owner_id].includes(sender_id);
    if (!isParty) {
      // Check if admin
      const [user] = await db.query("SELECT role FROM users WHERE id = ?", [sender_id]);
      if (user.length === 0 || !["property_admin", "system_admin", "admin"].includes(user[0].role)) {
        return res.status(403).json({ success: false, message: "You are not a party to this engagement" });
      }
    }

    const [result] = await db.query(
      `INSERT INTO broker_engagement_messages
         (engagement_id, sender_id, sender_role, message_type, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, sender_id, sender_role || "buyer", message_type || "general", message]
    );

    res.json({ success: true, message: "Message sent", message_id: result.insertId });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// GET /api/broker-engagement/:id/history
// Get audit trail
// ============================================================================
router.get("/:id/history", async (req, res) => {
  try {
    const { id } = req.params;
    const [history] = await db.query(
      `SELECT beh.*, u.name AS action_by_name
       FROM broker_engagement_history beh
       LEFT JOIN users u ON beh.action_by_id = u.id
       WHERE beh.engagement_id = ? ORDER BY beh.created_at DESC`,
      [id]
    );
    res.json({ success: true, history });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// GET /api/broker-engagement/buyer/:buyerId
// Get buyer's engagements
// ============================================================================
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const [engagements] = await db.query(
      "SELECT * FROM v_broker_engagements WHERE buyer_id = ? ORDER BY created_at DESC",
      [req.params.buyerId]
    );
    res.json({ success: true, engagements });
  } catch (error) {
    console.error("Error fetching buyer engagements:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// GET /api/broker-engagement/broker/:brokerId
// Get broker's engagements
// ============================================================================
router.get("/broker/:brokerId", async (req, res) => {
  try {
    const [engagements] = await db.query(
      "SELECT * FROM v_broker_engagements WHERE broker_id = ? ORDER BY created_at DESC",
      [req.params.brokerId]
    );
    res.json({ success: true, engagements });
  } catch (error) {
    console.error("Error fetching broker engagements:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// GET /api/broker-engagement/owner/:ownerId
// Get owner's engagements
// ============================================================================
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const [engagements] = await db.query(
      "SELECT * FROM v_broker_engagements WHERE owner_id = ? ORDER BY created_at DESC",
      [req.params.ownerId]
    );
    res.json({ success: true, engagements });
  } catch (error) {
    console.error("Error fetching owner engagements:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// GET /api/broker-engagement/admin/all
// Get all engagements for admin dashboard
// ============================================================================
router.get("/admin/all", async (req, res) => {
  try {
    const [engagements] = await db.query(
      "SELECT * FROM v_broker_engagements ORDER BY created_at DESC"
    );
    res.json({ success: true, engagements });
  } catch (error) {
    console.error("Error fetching all engagements:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/submit-payment
// Buyer submits payment details (Step 7)
// ============================================================================
router.put("/:id/submit-payment", async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer_id, payment_method, payment_reference, payment_receipt } = req.body;

    if (!payment_method || !payment_reference) {
      return res.status(400).json({ success: false, message: "Payment method and reference are required" });
    }

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "fully_signed") {
      return res.status(400).json({ success: false, message: "Contract must be fully signed before payment. Current status: " + eng.status });
    }
    if (eng.buyer_id !== buyer_id) {
      return res.status(403).json({ success: false, message: "You are not the buyer" });
    }

    await db.query(
      `UPDATE broker_engagements SET
         status = 'payment_submitted', payment_method = ?, payment_reference = ?,
         payment_receipt = ?, payment_submitted_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [payment_method, payment_reference, payment_receipt || null, id]
    );

    await logHistory(id, "payment_submitted", buyer_id, "buyer", "fully_signed", "payment_submitted",
      `Buyer submitted payment via ${payment_method} (Ref: ${payment_reference})`,
      { payment_method, payment_reference, agreed_price: eng.agreed_price });
    await systemMessage(id, `Buyer has submitted payment of ${Number(eng.agreed_price).toLocaleString()} ETB via ${payment_method}. Reference: ${payment_reference}. Awaiting admin verification.`);

    // Notify admin
    const [admins] = await db.query("SELECT id FROM users WHERE role IN ('property_admin', 'system_admin', 'admin') LIMIT 5");
    for (const admin of admins) {
      await notifyUser(admin.id, "💰 Payment Submitted for Verification",
        `Buyer has submitted payment of ${Number(eng.agreed_price).toLocaleString()} ETB for engagement #${id}. Please verify.`, "info");
    }
    // Notify broker
    await notifyUser(eng.broker_id, "💰 Buyer Payment Submitted",
      `Your buyer has submitted payment of ${Number(eng.agreed_price).toLocaleString()} ETB. Awaiting admin verification.`, "info");

    res.json({ success: true, message: "Payment submitted successfully. Awaiting admin verification.", status: "payment_submitted" });
  } catch (error) {
    console.error("Error submitting payment:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/verify-payment
// Admin verifies payment (Step 8)
// ============================================================================
router.put("/:id/verify-payment", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "payment_submitted") {
      return res.status(400).json({ success: false, message: "No payment to verify. Current status: " + eng.status });
    }

    await db.query(
      `UPDATE broker_engagements SET
         status = 'payment_verified', payment_verified_at = NOW(), payment_verified_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [admin_id, id]
    );

    await logHistory(id, "payment_verified", admin_id, "admin", "payment_submitted", "payment_verified",
      "Admin verified payment has been received");
    await systemMessage(id, "Payment has been verified by admin. Funds are secured. Buyer can now confirm property handover.");

    // Notify buyer
    await notifyUser(eng.buyer_id, "✅ Payment Verified!",
      "Your payment has been verified. After you receive the property keys, please confirm handover.", "success");
    // Notify broker
    await notifyUser(eng.broker_id, "✅ Payment Verified!",
      "The buyer's payment has been verified. Please coordinate the property handover.", "success");
    // Notify owner
    await notifyUser(eng.owner_id, "✅ Payment Received & Verified!",
      `The payment of ${Number(eng.agreed_price).toLocaleString()} ETB has been secured. Please proceed with handing over the property, keys, and any required documents to the buyer.`, "success");

    res.json({ success: true, message: "Payment verified. Awaiting buyer handover confirmation.", status: "payment_verified" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/reject-payment
// Admin rejects payment (Step 8a)
// ============================================================================
router.put("/:id/reject-payment", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, reason } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "payment_submitted") {
      return res.status(400).json({ success: false, message: "No payment to reject. Current status: " + eng.status });
    }

    await db.query(
      `UPDATE broker_engagements SET
         status = 'payment_rejected', updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    const logMsg = reason ? `Payment rejected by admin. Reason: ${reason}` : "Payment rejected by admin. Please resubmit.";
    await logHistory(id, "payment_rejected", admin_id, "admin", "payment_submitted", "payment_rejected", logMsg);
    await systemMessage(id, `❌ Admin rejected the submitted payment. Reason: ${reason || "Invalid or unconfirmed payment"}. Buyer must submit payment again.`);

    // Notify buyer
    await notifyUser(eng.buyer_id, "❌ Payment Rejected",
      `Your payment for engagement #${id} could not be verified. Please review and resubmit.`, "warning");
    // Notify broker
    await notifyUser(eng.broker_id, "❌ Payment Rejected",
      `The buyer's payment was rejected. They need to resubmit.`, "warning");

    res.json({ success: true, message: "Payment rejected. Buyer must resubmit.", status: "payment_rejected" });
  } catch (error) {
    console.error("Error rejecting payment:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/confirm-handover
// Buyer or Owner confirms property handover (Step 9)
// ============================================================================
router.put("/:id/confirm-handover", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "payment_verified") {
      return res.status(400).json({ success: false, message: "Payment must be verified first. Current status: " + eng.status });
    }
    if (eng.buyer_id !== user_id && eng.owner_id !== user_id) {
      return res.status(403).json({ success: false, message: "You are not authorized to confirm handover" });
    }

    const isBuyer = eng.buyer_id === user_id;
    const roleStr = isBuyer ? "Buyer" : "Owner";

    if (isBuyer) {
      await db.query("UPDATE broker_engagements SET buyer_handover_confirmed = true, updated_at = NOW() WHERE id = ?", [id]);
    } else {
      await db.query("UPDATE broker_engagements SET owner_handover_confirmed = true, updated_at = NOW() WHERE id = ?", [id]);
    }

    // Refetch strictly to guarantee accurate state evaluation regardless of SQL driver casting
    const [checkEng] = await db.query("SELECT buyer_handover_confirmed, owner_handover_confirmed FROM broker_engagements WHERE id = ?", [id]);
    const bConfirmed = checkEng[0].buyer_handover_confirmed === true || checkEng[0].buyer_handover_confirmed === 1 || checkEng[0].buyer_handover_confirmed === 'true';
    const oConfirmed = checkEng[0].owner_handover_confirmed === true || checkEng[0].owner_handover_confirmed === 1 || checkEng[0].owner_handover_confirmed === 'true';
    const bothConfirmed = bConfirmed && oConfirmed;

    if (bothConfirmed) {
      await db.query("UPDATE broker_engagements SET status = 'handover_confirmed', handover_confirmed_at = NOW(), updated_at = NOW() WHERE id = ?", [id]);
    }

    await logHistory(id, "handover_confirmed_partial", user_id, isBuyer ? "buyer" : "owner", "payment_verified", 
      bothConfirmed ? "handover_confirmed" : "payment_verified",
      `${roleStr} confirmed property handover` + (bothConfirmed ? " — Both parties have now confirmed" : " — Awaiting other party"));
      
    await systemMessage(id, `${roleStr} has confirmed property handover.` + 
      (bothConfirmed ? " Both parties confirmed. Admin can now release funds." : ` Awaiting confirmation from the ${isBuyer ? "owner" : "buyer"}.`));

    if (bothConfirmed) {
      // Notify admin
      const [admins] = await db.query("SELECT id FROM users WHERE role IN ('property_admin', 'system_admin', 'admin') LIMIT 5");
      for (const admin of admins) {
        await notifyUser(admin.id, "🔑 Handover Completed",
          `Both Buyer and Owner have confirmed handover for engagement #${id}. You can now release funds.`, "info");
      }
      
      await notifyUser(eng.broker_id, "🔑 Handover Completed", `Both parties have confirmed property handover.`, "success");
      await notifyUser(eng.owner_id, "🔑 Handover Completed", `Handover complete. Funds will be released shortly.`, "success");
      await notifyUser(eng.buyer_id, "🔑 Handover Completed", `Handover complete.`, "success");

      res.json({ success: true, message: "Handover fully confirmed. Admin will release funds.", status: "handover_confirmed" });
    } else {
      // Notify the counterpart
      const otherId = isBuyer ? eng.owner_id : eng.buyer_id;
      await notifyUser(otherId, "🔑 Handover Confirmation Needed",
        `The ${roleStr.toLowerCase()} has confirmed the property handover. Please click 'Confirm Handover' to finalize the process.`, "warning");

      res.json({ success: true, message: `Handover confirmed by ${roleStr}. Awaiting other party.`, status: "payment_verified" });
    }
  } catch (error) {
    console.error("Error confirming handover:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ============================================================================
// PUT /api/broker-engagement/:id/release-funds
// Admin releases funds — three-way split (Step 10)
// ============================================================================
router.put("/:id/release-funds", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, system_commission_pct, broker_commission_pct } = req.body;

    const [engagement] = await db.query("SELECT * FROM broker_engagements WHERE id = ?", [id]);
    if (engagement.length === 0) return res.status(404).json({ success: false, message: "Engagement not found" });

    const eng = engagement[0];
    if (eng.status !== "handover_confirmed") {
      return res.status(400).json({ success: false, message: "Handover must be confirmed first. Current status: " + eng.status });
    }

    const agreedPrice = Number(eng.agreed_price);
    const sysPct = Number(system_commission_pct || eng.system_commission_pct || 2);
    const brkPct = Number(broker_commission_pct || eng.broker_commission_pct || 2);
    const sysAmount = Math.round(agreedPrice * sysPct / 100 * 100) / 100;
    const brkAmount = Math.round(agreedPrice * brkPct / 100 * 100) / 100;
    const ownerPayout = Math.round((agreedPrice - sysAmount - brkAmount) * 100) / 100;

    // Update engagement
    await db.query(
      `UPDATE broker_engagements SET
         status = 'completed',
         system_commission_pct = ?, broker_commission_pct = ?,
         system_commission_amount = ?, broker_commission_amount = ?, owner_payout_amount = ?,
         funds_released_at = NOW(), funds_released_by = ?, completed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [sysPct, brkPct, sysAmount, brkAmount, ownerPayout, admin_id, id]
    );

    // Record broker commission in commission_tracking
    try {
      await db.query(
        `INSERT INTO commission_tracking
           (agreement_request_id, agreement_amount, customer_commission_percentage, owner_commission_percentage,
            customer_commission, owner_commission, total_commission)
         VALUES (NULL, ?, ?, ?, ?, ?, ?)`,
        [agreedPrice, sysPct, brkPct, sysAmount, brkAmount, sysAmount + brkAmount]
      );
    } catch (commErr) {
      console.error("Commission tracking insert error (non-fatal):", commErr.message);
    }

    await logHistory(id, "funds_released", admin_id, "admin", "handover_confirmed", "completed",
      `Funds released: Owner gets ${ownerPayout.toLocaleString()} ETB, Broker earns ${brkAmount.toLocaleString()} ETB (${brkPct}%), System fee ${sysAmount.toLocaleString()} ETB (${sysPct}%)`,
      { agreed_price: agreedPrice, system_pct: sysPct, broker_pct: brkPct, system_amount: sysAmount, broker_amount: brkAmount, owner_payout: ownerPayout });
    await systemMessage(id, `🎉 Funds released! Owner payout: ${ownerPayout.toLocaleString()} ETB | Broker commission: ${brkAmount.toLocaleString()} ETB (${brkPct}%) | System fee: ${sysAmount.toLocaleString()} ETB (${sysPct}%). Transaction complete!`);

    // Mark property as sold
    try {
      await db.query("UPDATE properties SET status = 'sold' WHERE id = ?", [eng.property_id]);
    } catch (propErr) {
      console.error("Property status update error (non-fatal):", propErr.message);
    }

    // Notify all parties
    await notifyUser(eng.buyer_id, "🎉 Purchase Complete!",
      `Congratulations! Your property purchase is complete. Total paid: ${agreedPrice.toLocaleString()} ETB.`, "success");
    await notifyUser(eng.broker_id, "🎉 Commission Earned!",
      `Deal complete! You earned ${brkAmount.toLocaleString()} ETB (${brkPct}%) commission.`, "success");
    await notifyUser(eng.owner_id, "🎉 Funds Released!",
      `Your payout of ${ownerPayout.toLocaleString()} ETB has been released. System fee: ${sysAmount.toLocaleString()} ETB, Broker commission: ${brkAmount.toLocaleString()} ETB.`, "success");

    res.json({
      success: true,
      message: "Funds released. Transaction complete! 🎉",
      status: "completed",
      breakdown: {
        agreed_price: agreedPrice,
        system_commission: { percentage: sysPct, amount: sysAmount },
        broker_commission: { percentage: brkPct, amount: brkAmount },
        owner_payout: ownerPayout
      }
    });
  } catch (error) {
    console.error("Error releasing funds:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
