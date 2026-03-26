/**
 * Agreement Controller
 * Handles the agreement request workflow for property owners
 * Flow: buyer requests → admin forwards → owner approves/rejects → admin generates PDF
 */
const { body, param, validationResult } = require("express-validator");
const { Agreement, Property, User, NegotiationHistory, Payment } = require("../models");

/**
 * Validation rules for responding to an agreement request
 */
const respondToRequestValidation = [
  param("id").isUUID().withMessage("Valid agreement ID is required"),
  body("action")
    .isIn(["approve", "reject", "counter_offer"])
    .withMessage("Action must be approve, reject, or counter_offer"),
  body("counterOfferPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Counter-offer price must be positive"),
  body("ownerNotes").optional().trim(),
];

/**
 * Get all agreements for the authenticated owner
 * Includes pending requests, approved, rejected, and completed agreements
 * GET /api/agreements
 */
const getOwnerAgreements = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { ownerId };
    if (status) {
      where.status = status;
    }

    const { count, rows: agreements } = await Agreement.findAndCountAll({
      where,
      include: [
        {
          model: Property,
          as: "property",
          attributes: [
            "id",
            "title",
            "address",
            "propertyType",
            "listingType",
            "price",
          ],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [
        // Show pending first, then by date
        ["status", "ASC"],
        ["createdAt", "DESC"],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        agreements,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Owner responds to an agreement request (approve or reject)
 * PATCH /api/agreements/:id/respond
 */
const respondToRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const ownerId = req.user.userId;
    const { id } = req.params;
    const { action } = req.body;

    // Find the agreement and verify ownership
    const agreement = await Agreement.findOne({
      where: { id, ownerId },
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title"],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement request not found or you do not own this property.",
      });
    }

    if (
      agreement.status !== "forwarded_to_owner" &&
      agreement.status !== "buyer_counter_offer" &&
      agreement.status !== "buyer_counter_forwarded"
    ) {
      return res.status(400).json({
        success: false,
        message:
          agreement.status === "pending"
            ? "This request is still pending admin review. Please wait for the admin to forward it."
            : `This request has already been ${agreement.status.replace("owner_", "").replace("buyer_", "")}.`,
      });
    }

    // Update status
    const { counterOfferPrice, ownerNotes } = req.body;

    let newStatus;
    const updateData = {};

    if (action === "approve") {
      newStatus = "owner_approved";
      updateData.ownerResponseAt = new Date();
    } else if (action === "reject") {
      newStatus = "owner_rejected";
      updateData.ownerResponseAt = new Date();
    } else if (action === "counter_offer") {
      if (!counterOfferPrice) {
        return res.status(400).json({
          success: false,
          message: "Counter-offer price is required.",
        });
      }
      newStatus = "counter_offer";
      updateData.ownerCounterAt = new Date();
      updateData.counterOfferPrice = counterOfferPrice;
    }

    updateData.status = newStatus;
    if (ownerNotes) updateData.ownerNotes = ownerNotes;

    await agreement.update(updateData);

    // Save counter-offer to negotiation history
    if (action === "counter_offer") {
      await NegotiationHistory.create({
        agreementId: agreement.id,
        actorType: "owner",
        actionType: "counter_offer",
        price: counterOfferPrice,
        notes: ownerNotes,
      });
    }

    const actionVerb =
      action === "approve"
        ? "approved"
        : action === "reject"
          ? "rejected"
          : "counter-offered";

    res.json({
      success: true,
      message: `Agreement request ${actionVerb} successfully.`,
      data: { agreement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single agreement by ID (for the authenticated owner)
 * GET /api/agreements/:id
 */
const getAgreementById = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const agreement = await Agreement.findOne({
      where: { id, ownerId },
      include: [
        {
          model: Property,
          as: "property",
          attributes: [
            "id",
            "title",
            "address",
            "propertyType",
            "listingType",
            "price",
          ],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found.",
      });
    }

    // Fetch negotiation history separately
    const negotiationHistory = await NegotiationHistory.findAll({
      where: { agreementId: id },
      order: [["created_at", "ASC"]],
    });

    // Add negotiation history to agreement object
    const agreementData = agreement.toJSON();
    agreementData.negotiationHistory = negotiationHistory;

    res.json({
      success: true,
      data: { agreement: agreementData },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/agreements/:id/confirm-payment
 * Owner confirms they received the payment from the buyer
 */
const confirmPaymentReceived = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const { confirmed, ownerNotes } = req.body;

    const agreement = await Agreement.findOne({ where: { id, ownerId } });
    if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found.' });

    if (agreement.status !== 'payment_submitted') {
      return res.status(400).json({ success: false, message: 'No pending payment to confirm for this agreement.' });
    }

    if (!confirmed) {
      return res.status(400).json({ success: false, message: 'Please confirm whether payment was received.' });
    }

    // Update payment record
    const payment = await Payment.findOne({ where: { agreementId: id }, order: [['createdAt', 'DESC']] });
    if (payment) {
      await payment.update({ ownerConfirmed: true, ownerConfirmedAt: new Date() });
    }

    await agreement.update({
      status: 'payment_confirmed',
      ownerNotes: ownerNotes || agreement.ownerNotes,
    });

    res.json({ success: true, message: 'Payment confirmed. Admin will now finalize the agreement.' });
  } catch (error) { next(error); }
};

module.exports = {
  getOwnerAgreements,
  respondToRequest,
  respondToRequestValidation,
  getAgreementById,
  confirmPaymentReceived,
};
