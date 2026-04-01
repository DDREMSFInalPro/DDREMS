const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ============================================================================
// STEP 1: CUSTOMER INITIATES REQUEST
// ============================================================================

// POST /api/agreement-workflow/request
// Customer clicks "Request Agreement"
router.post("/request", async (req, res) => {
  try {
    const {
      customer_id,
      property_id,
      customer_notes,
      proposed_price,
      move_in_date,
    } = req.body;

    if (!customer_id || !property_id) {
      return res.status(400).json({
        message: "Customer ID and Property ID required",
        success: false,
      });
    }

    // Get property details to find owner
    const [property] = await db.query(
      "SELECT owner_id, price, broker_id FROM properties WHERE id = ?",
      [property_id],
    );

    if (property.length === 0) {
      return res.status(404).json({
        message: "Property not found",
        success: false,
      });
    }

    const owner_id = property[0].owner_id;
    const property_price = property[0].price;
    const broker_id = property[0].broker_id || null;

    // Check if property has an owner
    if (!owner_id) {
      return res.status(400).json({
        message: "Property does not have an owner assigned",
        success: false,
      });
    }

    // Check for duplicate pending requests
    const [existing] = await db.query(
      `SELECT id FROM agreement_requests WHERE customer_id = ? AND property_id = ? AND status NOT IN ('completed', 'owner_rejected')`,
      [customer_id, property_id],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        message:
          "You already have an active agreement request for this property",
        success: false,
      });
    }

    // Create agreement request
    const [result] = await db.query(
      `
      INSERT INTO agreement_requests (
        customer_id, owner_id, property_id, broker_id, status, current_step,
        customer_notes, property_price, proposed_price, move_in_date
      ) VALUES (?, ?, ?, ?, 'pending_admin_review', 1, ?, ?, ?, ?)
    `,
      [
        customer_id,
        owner_id,
        property_id,
        broker_id,
        customer_notes,
        property_price,
        proposed_price || property_price,
        move_in_date || null,
      ],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 1, 'Customer Request', 'created', ?, NULL, 'pending_admin_review', ?)
    `,
      [result.insertId, customer_id, "Customer initiated agreement request"],
    );

    // Notify property admin
    const [admins] = await db.query(
      "SELECT id FROM users WHERE role = 'property_admin' LIMIT 1",
    );

    if (admins.length > 0) {
      await db.query(
        `
        INSERT INTO agreement_notifications (
          agreement_request_id, recipient_id, notification_type,
          notification_title, notification_message
        ) VALUES (?, ?, 'request_received', 
          'New Agreement Request', 
          'Customer has requested an agreement for a property')
      `,
        [result.insertId, admins[0].id],
      );
    }

    res.json({
      success: true,
      message: "Agreement request created successfully",
      agreement_id: result.insertId,
      status: "pending_admin_review",
      current_step: 1,
    });
  } catch (error) {
    console.error("Error creating agreement request:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// ============================================================================
// STEP 2: PROPERTY ADMIN REVIEWS & FORWARDS
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/forward-to-owner
// Property admin forwards request to owner
router.put("/:agreementId/forward-to-owner", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, admin_notes } = req.body;

    // Get agreement details
    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res.status(404).json({
        message: "Agreement not found",
        success: false,
      });
    }

    // Update agreement
    await db.query(
      `
      UPDATE agreement_requests SET
        status = 'waiting_owner_response',
        current_step = 2,
        property_admin_id = ?,
        forwarded_to_owner_date = NOW(),
        admin_notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
      [admin_id, admin_notes, agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 2, 'Forward to Owner', 'forwarded', ?, 
        'pending_admin_review', 'waiting_owner_response', ?)
    `,
      [agreementId, admin_id, admin_notes],
    );

    // Notify owner
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'forwarded_to_owner', 
        'Agreement Request Forwarded', 
        'Property admin has forwarded an agreement request for your review')
    `,
      [agreementId, agreement[0].owner_id],
    );

    res.json({
      success: true,
      message: "Agreement forwarded to owner",
      status: "waiting_owner_response",
      current_step: 2,
    });
  } catch (error) {
    console.error("Error forwarding agreement:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// ============================================================================
// STEP 3: OWNER DECISION
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/owner-decision
// Owner accepts or rejects the request
router.put("/:agreementId/owner-decision", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { owner_id, decision, owner_notes } = req.body;

    if (!["accepted", "rejected", "counter_offer"].includes(decision)) {
      return res.status(400).json({
        message:
          'Invalid decision. Must be "accepted", "rejected", or "counter_offer"',
        success: false,
      });
    }

    // Get agreement
    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res.status(404).json({
        message: "Agreement not found",
        success: false,
      });
    }

    const new_status =
      decision === "accepted"
        ? "owner_accepted"
        : decision === "counter_offer"
          ? "counter_offer"
          : "owner_rejected";
    const next_step = 3;

    // Determine the final agreed price when accepting
    let agreedPrice = null;
    if (decision === "accepted") {
      // Check buyer's counter offer price in customer_notes
      const customerNotes = agreement[0].customer_notes || "";
      const buyerPriceMatch = customerNotes.match(/Price:\s*([\d,]+)\s*ETB/i);
      if (buyerPriceMatch) {
        agreedPrice = parseFloat(buyerPriceMatch[1].replace(/,/g, ""));
      }
    }
    // If owner sends a counter offer with a price, save it as proposed_price
    if (decision === "counter_offer" && owner_notes) {
      const priceMatch = owner_notes.match(
        /Price:\s*([\d,]+(?:\.\d+)?)\s*ETB/i,
      );
      if (priceMatch) agreedPrice = parseFloat(priceMatch[1].replace(/,/g, ""));
    }

    await db.query(
      `UPDATE agreement_requests SET
        status = ?,
        current_step = ?,
        owner_decision = ?,
        owner_decision_date = NOW(),
        owner_notes = ?,
        ${agreedPrice ? "proposed_price = ?," : ""}
        updated_at = NOW()
      WHERE id = ?`,
      agreedPrice
        ? [
            new_status,
            next_step,
            decision,
            owner_notes,
            agreedPrice,
            agreementId,
          ]
        : [new_status, next_step, decision, owner_notes, agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 3, 'Owner Decision', ?, ?, 
        'waiting_owner_response', ?, ?)
    `,
      [agreementId, decision, owner_id, new_status, owner_notes],
    );

    // Notify based on decision
    const notifTitle =
      decision === "accepted"
        ? "Owner Accepted Agreement"
        : decision === "counter_offer"
          ? "Owner Sent Counter Offer 🔄"
          : "Owner Rejected Agreement";
    const notifMsg =
      decision === "accepted"
        ? "Owner has accepted the agreement request"
        : decision === "counter_offer"
          ? `Owner has sent a counter offer: ${owner_notes || ""}`
          : "Owner has rejected the agreement request";

    // Notify property admin
    if (agreement[0].property_admin_id) {
      await db.query(
        `
        INSERT INTO agreement_notifications (
          agreement_request_id, recipient_id, notification_type,
          notification_title, notification_message
        ) VALUES (?, ?, ?, ?, ?)
      `,
        [
          agreementId,
          agreement[0].property_admin_id,
          decision,
          notifTitle,
          notifMsg,
        ],
      );
    }

    // Notify customer for counter offer or rejection
    if (decision === "rejected" || decision === "counter_offer") {
      await db.query(
        `
        INSERT INTO agreement_notifications (
          agreement_request_id, recipient_id, notification_type,
          notification_title, notification_message
        ) VALUES (?, ?, ?, ?, ?)
      `,
        [agreementId, agreement[0].customer_id, decision, notifTitle, notifMsg],
      );

      // Also add to notifications table
      await db.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [
          agreement[0].customer_id,
          notifTitle,
          notifMsg,
          decision === "counter_offer" ? "info" : "error",
        ],
      );
    }

    res.json({
      success: true,
      message: `Agreement ${decision} by owner`,
      status: new_status,
      current_step: next_step,
    });
  } catch (error) {
    console.error("Error processing owner decision:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// ============================================================================
// STEP 3b: ADMIN FORWARDS COUNTER OFFER TO BUYER
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/forward-counter-offer
router.put("/:agreementId/forward-counter-offer", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, admin_notes } = req.body;

    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ message: "Agreement not found", success: false });
    }

    await db.query(
      `UPDATE agreement_requests SET
        status = 'counter_offer_forwarded',
        property_admin_id = ?,
        admin_notes = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [admin_id, admin_notes || agreement[0].admin_notes, agreementId],
    );

    await db.query(
      `INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 3, 'Forward Counter Offer', 'forwarded_counter', ?,
        'counter_offer', 'counter_offer_forwarded', ?)`,
      [agreementId, admin_id, admin_notes],
    );

    // Notify buyer
    await db.query(
      `INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'counter_offer_forwarded',
        '🔄 Counter Offer from Owner',
        'The owner has sent a counter offer. Please review and respond.')`,
      [agreementId, agreement[0].customer_id],
    );

    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
      [
        agreement[0].customer_id,
        "🔄 Counter Offer Received",
        `The owner has sent a counter offer for your agreement request. Please review and respond.`,
        "info",
      ],
    );

    res.json({
      success: true,
      message: "Counter offer forwarded to buyer",
      status: "counter_offer_forwarded",
    });
  } catch (error) {
    console.error("Error forwarding counter offer:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 3b2: ADMIN FORWARDS BUYER COUNTER OFFER TO OWNER
// ============================================================================

router.put("/:agreementId/forward-buyer-counter", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, admin_notes } = req.body;

    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );
    if (agreement.length === 0)
      return res
        .status(404)
        .json({ message: "Agreement not found", success: false });

    await db.query(
      `UPDATE agreement_requests SET status = 'buyer_counter_offer_forwarded', property_admin_id = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?`,
      [admin_id, admin_notes || agreement[0].admin_notes, agreementId],
    );

    await db.query(
      `INSERT INTO agreement_workflow_history (agreement_request_id, step_number, step_name, action, action_by_id, previous_status, new_status, notes)
       VALUES (?, 3, 'Forward Buyer Counter to Owner', 'forwarded_to_owner', ?, 'buyer_counter_offer', 'buyer_counter_offer_forwarded', ?)`,
      [agreementId, admin_id, admin_notes],
    );

    // Notify owner
    await db.query(
      `INSERT INTO agreement_notifications (agreement_request_id, recipient_id, notification_type, notification_title, notification_message)
       VALUES (?, ?, 'buyer_counter_forwarded', '🔄 Buyer Counter Offer', 'The buyer has sent a counter offer. Please review and respond.')`,
      [agreementId, agreement[0].owner_id],
    );
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
      [
        agreement[0].owner_id,
        "🔄 Buyer Counter Offer Received",
        `The buyer has sent a counter offer: ${agreement[0].customer_notes || ""}`,
        "info",
      ],
    );

    res.json({
      success: true,
      message: "Buyer counter offer forwarded to owner",
      status: "buyer_counter_offer_forwarded",
    });
  } catch (error) {
    console.error("Error forwarding buyer counter offer:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 3c: BUYER RESPONDS TO COUNTER OFFER
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/buyer-counter-response
router.put("/:agreementId/buyer-counter-response", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { buyer_id, response, counter_price, buyer_notes } = req.body;

    if (!["accepted", "rejected", "counter_offer"].includes(response)) {
      return res
        .status(400)
        .json({ message: "Invalid response", success: false });
    }

    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ message: "Agreement not found", success: false });
    }

    let new_status;
    if (response === "accepted") new_status = "owner_accepted";
    else if (response === "rejected") new_status = "buyer_rejected";
    else new_status = "buyer_counter_offer";

    const notes =
      response === "counter_offer"
        ? `Buyer Counter Offer${counter_price ? ` — Price: ${Number(counter_price).toLocaleString()} ETB` : ""}: ${buyer_notes || ""}`
        : buyer_notes;

    // If buyer accepts, the agreed price is the owner's last counter offer price
    // Parse it from owner_notes e.g. "Counter Offer — Price: 4,500,000 ETB: message"
    let agreedPrice = null;
    if (response === "accepted") {
      const ownerNotes = agreement[0].owner_notes || "";
      const priceMatch = ownerNotes.match(/Price:\s*([\d,]+)\s*ETB/);
      if (priceMatch) {
        agreedPrice = parseFloat(priceMatch[1].replace(/,/g, ""));
      }
    }
    // If buyer sends a counter offer, save their proposed price
    if (response === "counter_offer" && counter_price) {
      agreedPrice = parseFloat(counter_price);
    }

    await db.query(
      `UPDATE agreement_requests SET
        status = ?,
        customer_notes = ?,
        ${agreedPrice ? "proposed_price = ?," : ""}
        updated_at = NOW()
       WHERE id = ?`,
      agreedPrice
        ? [new_status, notes, agreedPrice, agreementId]
        : [new_status, notes, agreementId],
    );

    await db.query(
      `INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 3, 'Buyer Counter Response', ?, ?,
        ?, ?, ?)`,
      [agreementId, response, buyer_id, agreement[0].status, new_status, notes],
    );

    // Notify owner and admin
    const notifTitle =
      response === "accepted"
        ? "✅ Buyer Accepted Counter Offer"
        : response === "rejected"
          ? "❌ Buyer Rejected Counter Offer"
          : "🔄 Buyer Sent Counter Offer";
    const notifMsg =
      response === "accepted"
        ? "The buyer has accepted your counter offer. The admin will generate the agreement."
        : response === "rejected"
          ? "The buyer has rejected your counter offer."
          : `The buyer has sent a counter offer: ${notes}`;

    for (const recipientId of [
      agreement[0].owner_id,
      agreement[0].property_admin_id,
    ].filter(Boolean)) {
      await db.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [
          recipientId,
          notifTitle,
          notifMsg,
          response === "rejected" ? "error" : "info",
        ],
      );
    }

    res.json({
      success: true,
      message: `Buyer response: ${response}`,
      status: new_status,
    });
  } catch (error) {
    console.error("Error processing buyer counter response:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 4: ADMIN GENERATES AGREEMENT
// ============================================================================

// POST /api/agreement-workflow/:agreementId/generate-agreement
// Admin generates agreement document
router.post("/:agreementId/generate-agreement", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, template_id } = req.body;

    // Get agreement details
    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res.status(404).json({
        message: "Agreement not found",
        success: false,
      });
    }

    // Get template
    const [template] = await db.query(
      "SELECT * FROM agreement_templates WHERE id = ?",
      [template_id || 1],
    );

    // Create agreement document using the final agreed price (proposed_price takes precedence)
    const agreedPrice =
      agreement[0].proposed_price || agreement[0].property_price;
    const document_content = JSON.stringify({
      agreement_id: agreementId,
      customer_id: agreement[0].customer_id,
      owner_id: agreement[0].owner_id,
      property_id: agreement[0].property_id,
      property_price: agreement[0].property_price,
      agreed_price: agreedPrice,
      template: template.length > 0 ? template[0].template_content : null,
      created_date: new Date().toISOString(),
    });

    const [docResult] = await db.query(
      `
      INSERT INTO agreement_documents (
        agreement_request_id, version, document_type,
        document_content, generated_by_id
      ) VALUES (?, 1, 'initial', ?, ?)
    `,
      [agreementId, document_content, admin_id],
    );

    // Update agreement
    await db.query(
      `
      UPDATE agreement_requests SET
        status = 'agreement_generated',
        current_step = 4,
        agreement_generated_date = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `,
      [agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status
      ) VALUES (?, 4, 'Generate Agreement', 'generated', ?, 
        'owner_accepted', 'agreement_generated')
    `,
      [agreementId, admin_id],
    );

    // Notify customer
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'agreement_generated', 
        'Agreement Generated', 
        'Your agreement document has been generated. Please review and complete it.')
    `,
      [agreementId, agreement[0].customer_id],
    );

    res.json({
      success: true,
      message: "Agreement generated successfully",
      document_id: docResult.insertId,
      status: "agreement_generated",
      current_step: 4,
    });
  } catch (error) {
    console.error("Error generating agreement:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// ============================================================================
// STEP 4b: AUTO-GENERATE AGREEMENT PDF (using HTML from agreements.js)
// ============================================================================

// GET /api/agreement-workflow/:agreementId/view-agreement
// View the generated agreement document
router.get("/:agreementId/view-agreement", async (req, res) => {
  try {
    const { agreementId } = req.params;

    const [docs] = await db.query(
      "SELECT * FROM agreement_documents WHERE agreement_request_id = ? AND is_active = TRUE ORDER BY version DESC LIMIT 1",
      [agreementId],
    );

    if (docs.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No agreement document found" });
    }

    res.json({ success: true, document: docs[0] });
  } catch (error) {
    console.error("Error viewing agreement:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 5: BUYER SIGNS AGREEMENT
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/buyer-sign
router.put("/:agreementId/buyer-sign", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { buyer_id, signature_data } = req.body;

    // Get agreement
    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found" });
    }

    if (
      agreement[0].status !== "agreement_generated" &&
      agreement[0].status !== "buyer_signed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Agreement must be generated before signing. Current status: " +
          agreement[0].status,
      });
    }

    // Record signature
    await db.query(
      `
      INSERT INTO agreement_signatures (
        agreement_request_id, signer_id, signer_role, signature_data
      ) VALUES (?, ?, 'buyer', ?)
    `,
      [agreementId, buyer_id, signature_data || "digital_signature"],
    );

    // Update agreement
    await db.query(
      `
      UPDATE agreement_requests SET
        buyer_signed = TRUE,
        buyer_signed_date = NOW(),
        status = 'buyer_signed',
        current_step = 5,
        updated_at = NOW()
      WHERE id = ?
    `,
      [agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status
      ) VALUES (?, 5, 'Buyer Signature', 'signed', ?, 'agreement_generated', 'buyer_signed')
    `,
      [agreementId, buyer_id],
    );

    // Notify owner to sign
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'buyer_signed', 
        'Buyer Has Signed Agreement', 
        'The buyer has signed the agreement. Please review and add your signature.')
    `,
      [agreementId, agreement[0].owner_id],
    );

    res.json({
      success: true,
      message: "Agreement signed by buyer",
      status: "buyer_signed",
      current_step: 5,
    });
  } catch (error) {
    console.error("Error recording buyer signature:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 6: OWNER SIGNS AGREEMENT
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/owner-sign
router.put("/:agreementId/owner-sign", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { owner_id, signature_data } = req.body;

    // Get agreement
    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found" });
    }

    if (!agreement[0].buyer_signed) {
      return res.status(400).json({
        success: false,
        message: "Buyer must sign first before the owner can sign",
      });
    }

    // Record signature
    await db.query(
      `
      INSERT INTO agreement_signatures (
        agreement_request_id, signer_id, signer_role, signature_data
      ) VALUES (?, ?, 'owner', ?)
    `,
      [agreementId, owner_id, signature_data || "digital_signature"],
    );

    // Update agreement — now fully signed (contract locked)
    await db.query(
      `
      UPDATE agreement_requests SET
        owner_signed = TRUE,
        owner_signed_date = NOW(),
        status = 'fully_signed',
        current_step = 7,
        updated_at = NOW()
      WHERE id = ?
    `,
      [agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status
      ) VALUES (?, 6, 'Owner Signature', 'signed', ?, 'buyer_signed', 'fully_signed')
    `,
      [agreementId, owner_id],
    );

    // Notify buyer — payment is now unlocked
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'contract_locked', 
        '✅ Contract Signed & Locked', 
        'Both parties have signed. The contract is now binding. You can proceed to make payment.')
    `,
      [agreementId, agreement[0].customer_id],
    );

    // Notify admin
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'contract_locked', 
        'Agreement Fully Signed', 
        'Both buyer and owner have signed. Awaiting buyer payment.')
    `,
      [agreementId, agreement[0].property_admin_id],
    );

    res.json({
      success: true,
      message: "Agreement signed by owner. Contract is now locked.",
      status: "fully_signed",
      current_step: 7,
    });
  } catch (error) {
    console.error("Error recording owner signature:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 6b: BROKER SIGNS (if applicable)
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/broker-sign
router.put("/:agreementId/broker-sign", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { broker_id, signature_data } = req.body;

    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found" });
    }

    // Record broker signature
    await db.query(
      `
      INSERT INTO agreement_signatures (
        agreement_request_id, signer_id, signer_role, signature_data
      ) VALUES (?, ?, 'broker', ?)
    `,
      [agreementId, broker_id, signature_data || "digital_signature"],
    );

    await db.query(
      `
      UPDATE agreement_requests SET
        broker_signed = TRUE,
        broker_signed_date = NOW(),
        broker_id = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
      [broker_id, agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 6, 'Broker Signature', 'signed', ?, ?, ?, 'Broker confirmed commission agreement')
    `,
      [agreementId, broker_id, agreement[0].status, agreement[0].status],
    );

    res.json({
      success: true,
      message: "Agreement signed by broker",
      status: agreement[0].status,
    });
  } catch (error) {
    console.error("Error recording broker signature:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 9: BUYER SUBMITS PAYMENT
// ============================================================================

// POST /api/agreement-workflow/:agreementId/submit-payment
router.post("/:agreementId/submit-payment", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const {
      buyer_id,
      payment_method,
      payment_amount,
      payment_reference,
      receipt_document,
    } = req.body;

    // Get agreement
    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found" });
    }

    // Enforce: contract must be fully signed before payment
    if (agreement[0].status !== "fully_signed") {
      return res.status(400).json({
        success: false,
        message:
          "Both buyer and owner must sign the contract before payment can be made. Current status: " +
          agreement[0].status,
      });
    }

    // Record payment
    await db.query(
      `
      INSERT INTO agreement_payments (
        agreement_request_id, payment_method, payment_amount,
        receipt_file_path, transaction_reference, payment_status, payment_date
      ) VALUES (?, ?, ?, ?, ?, 'pending_verification', NOW())
    `,
      [
        agreementId,
        payment_method,
        payment_amount,
        receipt_document,
        payment_reference,
      ],
    );

    // Update agreement
    await db.query(
      `
      UPDATE agreement_requests SET
        payment_submitted = TRUE,
        status = 'payment_submitted',
        current_step = 9,
        updated_at = NOW()
      WHERE id = ?
    `,
      [agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status
      ) VALUES (?, 9, 'Payment Submitted', 'paid', ?, 'fully_signed', 'payment_submitted')
    `,
      [agreementId, buyer_id],
    );

    // Notify admin to verify funds
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'payment_submitted', 
        '💰 Payment Submitted', 
        'Buyer has submitted payment. Please verify the funds have arrived.')
    `,
      [agreementId, agreement[0].property_admin_id],
    );

    res.json({
      success: true,
      message: "Payment submitted. Awaiting admin verification.",
      status: "payment_submitted",
      current_step: 9,
    });
  } catch (error) {
    console.error("Error submitting payment:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 10: ADMIN VERIFIES FUNDS
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/verify-payment
router.put("/:agreementId/verify-payment", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, admin_notes } = req.body;

    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found" });
    }

    if (agreement[0].status !== "payment_submitted") {
      return res.status(400).json({
        success: false,
        message: "Payment must be submitted before it can be verified",
      });
    }

    // Update payment record
    await db.query(
      `
      UPDATE agreement_payments SET
        payment_status = 'verified',
        verified_by_id = ?,
        verified_date = NOW(),
        verification_notes = ?
      WHERE agreement_request_id = ? AND payment_status = 'pending_verification'
    `,
      [admin_id, admin_notes, agreementId],
    );

    // Update agreement
    await db.query(
      `
      UPDATE agreement_requests SET
        payment_verified = TRUE,
        payment_verified_date = NOW(),
        payment_verified_by = ?,
        status = 'payment_verified',
        current_step = 10,
        updated_at = NOW()
      WHERE id = ?
    `,
      [admin_id, agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 10, 'Payment Verified', 'verified', ?, 'payment_submitted', 'payment_verified', ?)
    `,
      [agreementId, admin_id, admin_notes],
    );

    // Notify owner — funds received, please hand over keys
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'payment_verified', 
        '✅ Funds Received & Verified', 
        'The admin has verified that payment has been received. Please hand over the property keys to the buyer.')
    `,
      [agreementId, agreement[0].owner_id],
    );

    // Notify buyer — payment verified
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'payment_verified', 
        '✅ Payment Verified', 
        'Your payment has been verified. The owner will hand over the keys. Once you receive them, please confirm handover.')
    `,
      [agreementId, agreement[0].customer_id],
    );

    res.json({
      success: true,
      message: "Payment verified. Owner notified to hand over keys.",
      status: "payment_verified",
      current_step: 10,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 11a: BUYER CONFIRMS HANDOVER (received keys)
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/confirm-handover
router.put("/:agreementId/confirm-handover", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { buyer_id } = req.body;

    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found" });
    }

    if (agreement[0].status !== "payment_verified") {
      return res.status(400).json({
        success: false,
        message: "Payment must be verified before handover can be confirmed",
      });
    }

    // Update agreement
    await db.query(
      `
      UPDATE agreement_requests SET
        handover_confirmed = TRUE,
        handover_confirmed_date = NOW(),
        status = 'handover_confirmed',
        current_step = 11,
        updated_at = NOW()
      WHERE id = ?
    `,
      [agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status
      ) VALUES (?, 11, 'Handover Confirmed', 'confirmed', ?, 'payment_verified', 'handover_confirmed')
    `,
      [agreementId, buyer_id],
    );

    // Notify admin — buyer confirmed, ready to release funds
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'handover_confirmed', 
        '🔑 Buyer Confirmed Handover', 
        'The buyer has confirmed receiving the keys. You can now release funds to the owner.')
    `,
      [agreementId, agreement[0].property_admin_id],
    );

    res.json({
      success: true,
      message: "Handover confirmed. Admin can now release funds.",
      status: "handover_confirmed",
      current_step: 11,
    });
  } catch (error) {
    console.error("Error confirming handover:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// STEP 11b: ADMIN RELEASES FUNDS → COMPLETED
// ============================================================================

// PUT /api/agreement-workflow/:agreementId/release-funds
router.put("/:agreementId/release-funds", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { admin_id, commission_percentage, admin_notes } = req.body;

    const [agreement] = await db.query(
      "SELECT * FROM agreement_requests WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found" });
    }

    if (agreement[0].status !== "handover_confirmed") {
      return res.status(400).json({
        success: false,
        message: "Buyer must confirm handover before funds can be released",
      });
    }

    const property_price =
      agreement[0].proposed_price || agreement[0].property_price;
    const comm_pct =
      commission_percentage || agreement[0].commission_percentage || 5.0;
    const total_commission = (property_price * comm_pct) / 100;
    const net_amount = property_price - total_commission;

    // Create final transaction record
    const [transactionResult] = await db.query(
      `
      INSERT INTO agreement_transactions (
        agreement_request_id, transaction_type, transaction_status,
        buyer_id, seller_id, broker_id, property_id,
        transaction_amount, commission_amount, net_amount,
        completion_date
      ) VALUES (?, 'sale', 'completed', ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [
        agreementId,
        agreement[0].customer_id,
        agreement[0].owner_id,
        agreement[0].broker_id,
        agreement[0].property_id,
        property_price,
        total_commission,
        net_amount,
      ],
    );

    // Create commission records
    if (agreement[0].broker_id) {
      // With broker: commission goes to broker
      await db.query(
        `
        INSERT INTO agreement_commissions (
          agreement_request_id, commission_type, recipient_id,
          property_price, commission_percentage, commission_amount,
          payment_status, calculated_by_id
        ) VALUES (?, 'broker', ?, ?, ?, ?, 'paid', ?)
      `,
        [
          agreementId,
          agreement[0].broker_id,
          property_price,
          comm_pct,
          total_commission,
          admin_id,
        ],
      );
    }

    // Platform fee commission record
    await db.query(
      `
      INSERT INTO agreement_commissions (
        agreement_request_id, commission_type, recipient_id,
        property_price, commission_percentage, commission_amount,
        payment_status, calculated_by_id
      ) VALUES (?, 'platform', ?, ?, ?, ?, 'recorded', ?)
    `,
      [
        agreementId,
        admin_id,
        property_price,
        comm_pct,
        total_commission,
        admin_id,
      ],
    );

    // Update agreement to completed
    await db.query(
      `
      UPDATE agreement_requests SET
        funds_released = TRUE,
        funds_released_date = NOW(),
        funds_released_by = ?,
        commission_percentage = ?,
        total_commission = ?,
        status = 'completed',
        completed_date = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `,
      [admin_id, comm_pct, total_commission, agreementId],
    );

    // Update payment status
    await db.query(
      `
      UPDATE agreement_payments SET payment_status = 'released'
      WHERE agreement_request_id = ?
    `,
      [agreementId],
    );

    // Log workflow history
    await db.query(
      `
      INSERT INTO agreement_workflow_history (
        agreement_request_id, step_number, step_name, action,
        action_by_id, previous_status, new_status, notes
      ) VALUES (?, 11, 'Funds Released', 'completed', ?, 'handover_confirmed', 'completed', ?)
    `,
      [
        agreementId,
        admin_id,
        admin_notes || "Funds released and transaction completed",
      ],
    );

    // Notify both parties
    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'transaction_completed', 
        '🎉 Transaction Completed!', 
        'Congratulations! The property transaction is complete. Funds have been released.')
    `,
      [agreementId, agreement[0].customer_id],
    );

    await db.query(
      `
      INSERT INTO agreement_notifications (
        agreement_request_id, recipient_id, notification_type,
        notification_title, notification_message
      ) VALUES (?, ?, 'transaction_completed', 
        '🎉 Property Sold - Funds Released!', 
        'Your property has been sold. Funds have been released to your account.')
    `,
      [agreementId, agreement[0].owner_id],
    );

    if (agreement[0].broker_id) {
      await db.query(
        `
        INSERT INTO agreement_notifications (
          agreement_request_id, recipient_id, notification_type,
          notification_title, notification_message
        ) VALUES (?, ?, 'commission_paid', 
          '💰 Commission Paid!', 
          'Your commission for this transaction has been processed.')
      `,
        [agreementId, agreement[0].broker_id],
      );
    }

    res.json({
      success: true,
      message: "Funds released. Transaction completed!",
      transaction_id: transactionResult.insertId,
      status: "completed",
      current_step: 11,
      summary: {
        property_price,
        commission_percentage: comm_pct,
        total_commission,
        net_to_owner: net_amount,
      },
    });
  } catch (error) {
    console.error("Error releasing funds:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
});

// ============================================================================
// GET ENDPOINTS FOR DASHBOARD VIEWS
// ============================================================================

// GET /api/agreement-workflow/:agreementId
// Get agreement details
router.get("/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;

    const [agreement] = await db.query(
      "SELECT * FROM v_agreement_status WHERE id = ?",
      [agreementId],
    );

    if (agreement.length === 0) {
      return res.status(404).json({
        message: "Agreement not found",
        success: false,
      });
    }

    // Get documents
    const [documents] = await db.query(
      "SELECT * FROM agreement_documents WHERE agreement_request_id = ? ORDER BY version DESC",
      [agreementId],
    );

    // Get payments
    const [payments] = await db.query(
      "SELECT * FROM agreement_payments WHERE agreement_request_id = ?",
      [agreementId],
    );

    // Get commissions
    const [commissions] = await db.query(
      "SELECT * FROM agreement_commissions WHERE agreement_request_id = ?",
      [agreementId],
    );

    // Get workflow history
    const [history] = await db.query(
      "SELECT * FROM agreement_workflow_history WHERE agreement_request_id = ? ORDER BY action_date DESC",
      [agreementId],
    );

    res.json({
      success: true,
      agreement: agreement[0],
      documents,
      payments,
      commissions,
      history,
    });
  } catch (error) {
    console.error("Error fetching agreement:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// GET /api/agreement-workflow/user/:userId
// Get all agreements for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [agreements] = await db.query(
      `
      SELECT * FROM v_agreement_status 
      WHERE customer_id = ? OR owner_id = ?
      ORDER BY created_at DESC
    `,
      [userId, userId],
    );

    res.json({
      success: true,
      agreements,
      count: agreements.length,
    });
  } catch (error) {
    console.error("Error fetching user agreements:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// GET /api/agreement-workflow/admin/pending
// Get all agreements that need admin action
router.get("/admin/pending", async (req, res) => {
  try {
    const [agreements] = await db.query(`
      SELECT * FROM v_agreement_status 
      WHERE status IN (
        'pending_admin_review',
        'owner_accepted',
        'payment_submitted',
        'handover_confirmed'
      )
      ORDER BY created_at ASC
    `);

    res.json({
      success: true,
      agreements,
      count: agreements.length,
    });
  } catch (error) {
    console.error("Error fetching pending agreements:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// GET /api/agreement-workflow/admin/all
// Get ALL agreements for admin dashboard
router.get("/admin/all", async (req, res) => {
  try {
    const [agreements] = await db.query(`
      SELECT * FROM v_agreement_status 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      agreements,
      count: agreements.length,
    });
  } catch (error) {
    console.error("Error fetching all agreements:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// GET /api/agreement-workflow/owner/:ownerId
// Get agreements for a specific owner
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    const [agreements] = await db.query(
      `
      SELECT * FROM v_agreement_status 
      WHERE owner_id = ?
      ORDER BY created_at DESC
    `,
      [ownerId],
    );

    res.json({
      success: true,
      agreements,
      count: agreements.length,
    });
  } catch (error) {
    console.error("Error fetching owner agreements:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

// GET /api/agreement-workflow/buyer/:buyerId
// Get agreements for a specific buyer
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;
    const [agreements] = await db.query(
      `
      SELECT * FROM v_agreement_status 
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `,
      [buyerId],
    );

    res.json({
      success: true,
      agreements,
      count: agreements.length,
    });
  } catch (error) {
    console.error("Error fetching buyer agreements:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
});

module.exports = router;
