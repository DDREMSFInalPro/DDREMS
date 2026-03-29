/**
 * Agreement Controller (Buyer Module)
 * Handles agreement request creation and tracking
 */
const { body, validationResult } = require("express-validator");
const { Agreement, Property, User, NegotiationHistory } = require("../models");

/**
 * Validation rules for creating an agreement request
 */
const requestAgreementValidation = [
  body("propertyId").isUUID().withMessage("Valid property ID is required"),
  body("agreementType")
    .isIn(["sale", "rental"])
    .withMessage("Agreement type must be sale or rental"),
  body("terms").optional().trim(),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("monthlyRent")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be positive"),
  body("salePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sale price must be positive"),
];

/**
 * Create an agreement request
 * POST /api/agreements
 */
const requestAgreement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const buyerId = req.user.userId;
    const {
      propertyId,
      agreementType,
      terms,
      startDate,
      endDate,
      monthlyRent,
      salePrice,
    } = req.body;

    // Find published property
    const property = await Property.scope(null).findOne({
      where: { id: propertyId, isPublished: true },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or not available.",
      });
    }

    // Check for existing pending request
    const existingRequest = await Agreement.findOne({
      where: {
        propertyId,
        buyerId,
        status: "pending",
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending agreement request for this property.",
      });
    }

    // Get buyer info for client fields
    const buyer = await User.findByPk(buyerId);

    // Create agreement request
    const agreement = await Agreement.create({
      propertyId,
      ownerId: property.ownerId,
      buyerId,
      clientName: buyer.name,
      clientEmail: buyer.email,
      clientPhone: buyer.phone,
      agreementType,
      status: "pending",
      terms,
      startDate,
      endDate,
      monthlyRent: monthlyRent || (agreementType === 'rental' ? property.price : null),
      salePrice: salePrice || (agreementType === 'sale' ? property.price : null),
    });

    // Fetch with associations
    const createdAgreement = await Agreement.findByPk(agreement.id, {
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "address", "propertyType", "listingType", "price"],
        },
      ],
    });

    // Record initial request in negotiation history
    await NegotiationHistory.create({
      agreementId: agreement.id,
      actorType: "buyer",
      actionType: "initial_request",
      price: agreement.salePrice || agreement.monthlyRent,
      notes: terms,
    });

    res.status(201).json({
      success: true,
      message:
        "Agreement request submitted successfully. The admin will review it.",
      data: { agreement: createdAgreement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all agreement requests for the authenticated buyer
 * GET /api/agreements
 */
const getBuyerAgreements = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { buyerId };
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
          as: "ownerUser",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
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
 * Get a single agreement by ID
 * GET /api/agreements/:id
 */
const getAgreementById = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { id } = req.params;

    const agreement = await Agreement.findOne({
      where: { id, buyerId },
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
          as: "ownerUser",
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
 * Buyer responds to a counter-offer (accept, reject, or counter again)
 * PATCH /api/agreements/:id/respond-counter
 */
const respondToCounterOffer = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { id } = req.params;
    const { action, counterOfferPrice, buyerNotes } = req.body;

    // Validate action
    if (!["accept", "reject", "counter_offer"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be accept, reject, or counter_offer",
      });
    }

    // Find the agreement and verify buyer ownership
    const agreement = await Agreement.findOne({
      where: { id, buyerId },
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title"],
        },
      ],
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found.",
      });
    }

    // Only allow response to counter_offer_sent status
    if (agreement.status !== "counter_offer_sent") {
      return res.status(400).json({
        success: false,
        message: "You can only respond to active counter-offers.",
      });
    }

    let newStatus;
    const updateData = {};

    if (action === "accept") {
      // Buyer accepts the counter-offer
      newStatus = "buyer_accepted_counter";
      updateData.status = newStatus;
      updateData.buyerCounterAt = new Date();
      if (buyerNotes) updateData.buyerNotes = buyerNotes;

      // Update the sale/rent price to the counter-offer price
      if (agreement.agreementType === "rental") {
        updateData.monthlyRent = agreement.counterOfferPrice;
      } else {
        updateData.salePrice = agreement.counterOfferPrice;
      }
    } else if (action === "reject") {
      // Buyer rejects the counter-offer
      newStatus = "buyer_rejected_counter";
      updateData.status = newStatus;
      updateData.buyerCounterAt = new Date();
      if (buyerNotes) updateData.buyerNotes = buyerNotes;
    } else if (action === "counter_offer") {
      // Buyer makes a new counter-offer
      if (!counterOfferPrice || parseFloat(counterOfferPrice) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid counter-offer price is required.",
        });
      }
      newStatus = "buyer_counter_offer";
      updateData.status = newStatus;
      updateData.buyerCounterPrice = parseFloat(counterOfferPrice);
      updateData.buyerCounterAt = new Date();
      if (buyerNotes) updateData.buyerNotes = buyerNotes;
    }

    await agreement.update(updateData);

    // Save to negotiation history
    if (action === "counter_offer") {
      await NegotiationHistory.create({
        agreementId: agreement.id,
        actorType: "buyer",
        actionType: "counter_offer",
        price: parseFloat(counterOfferPrice),
        notes: buyerNotes,
      });
    }

    // Re-fetch with associations to get complete data
    const updatedAgreement = await Agreement.findByPk(agreement.id, {
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
          as: "ownerUser",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });

    const actionVerb =
      action === "accept"
        ? "accepted"
        : action === "reject"
          ? "rejected"
          : "countered";

    res.json({
      success: true,
      message: `Counter-offer ${actionVerb} successfully.`,
      data: { agreement: updatedAgreement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validation rules for responding to counter-offer
 */
const respondToCounterOfferValidation = [
  body("action")
    .isIn(["accept", "reject", "counter_offer"])
    .withMessage("Action must be accept, reject, or counter_offer"),
  body("counterOfferPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Counter-offer price must be positive"),
  body("buyerNotes").optional().trim(),
];

module.exports = {
  requestAgreement,
  requestAgreementValidation,
  getBuyerAgreements,
  getAgreementById,
  respondToCounterOffer,
  respondToCounterOfferValidation,
};
