/**
 * Agreement Controller — Unified
 *
 * Full negotiation workflow:
 *   buyer  → request, view own, respond to counter-offer
 *   owner  → view assigned, approve/reject/counter
 *   admin  → view all, forward, send counter, generate PDF
 *
 * Statuses:
 *   pending → forwarded_to_owner → counter_offer → counter_offer_sent
 *   → buyer_accepted_counter / buyer_rejected_counter / buyer_counter_offer
 *   → buyer_counter_forwarded → owner_approved / owner_rejected → completed
 */
const { Op } = require("sequelize");
const { body, param, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const {
  Agreement,
  Property,
  PropertyImage,
  User,
  NegotiationHistory,
} = require("../models");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const agreementIncludes = (role = "admin") => {
  const base = [
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
  ];
  if (role === "buyer") {
    base.push({
      model: User,
      as: "ownerUser",
      attributes: ["id", "name", "email", "phone"],
    });
  } else if (role === "owner") {
    base.push({
      model: User,
      as: "buyer",
      attributes: ["id", "name", "email", "phone"],
    });
  } else {
    base.push({
      model: User,
      as: "buyer",
      attributes: ["id", "name", "email", "phone"],
    });
    base.push({
      model: User,
      as: "ownerUser",
      attributes: ["id", "name", "email", "phone"],
    });
  }
  return base;
};

const fetchWithHistory = async (agreement) => {
  const history = await NegotiationHistory.findAll({
    where: { agreementId: agreement.id },
    order: [["created_at", "ASC"]],
  });
  const data = agreement.toJSON();
  data.negotiationHistory = history;
  return data;
};

// ─── Validation ───────────────────────────────────────────────────────────────

const requestAgreementValidation = [
  body("propertyId").isUUID().withMessage("Valid property ID is required"),
  body("agreementType")
    .isIn(["sale", "rental"])
    .withMessage("Agreement type must be sale or rental"),
  body("terms").optional().trim(),
  body("startDate").optional().isISO8601(),
  body("endDate").optional().isISO8601(),
  body("monthlyRent").optional().isFloat({ min: 0 }),
  body("salePrice").optional().isFloat({ min: 0 }),
];

const respondToCounterValidation = [
  body("action")
    .isIn(["accept", "reject", "counter_offer"])
    .withMessage("Action must be accept, reject, or counter_offer"),
  body("counterOfferPrice").optional().isFloat({ min: 0 }),
  body("buyerNotes").optional().trim(),
];

const ownerRespondValidation = [
  param("id").isUUID(),
  body("action")
    .isIn(["approve", "reject", "counter_offer"])
    .withMessage("Action must be approve, reject, or counter_offer"),
  body("counterOfferPrice").optional().isFloat({ min: 0 }),
  body("ownerNotes").optional().trim(),
];

// ─── LIST ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/agreements
 * buyer → own agreements | owner → assigned | admin → all
 */
const getAgreements = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const {
      page = 1,
      limit = 20,
      status,
      agreementType,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role === "buyer") where.buyerId = userId;
    if (role === "owner") where.ownerId = userId;
    if (status) where.status = status;
    if (agreementType) where.agreementType = agreementType;

    const order =
      role === "owner"
        ? [
            ["status", "ASC"],
            ["createdAt", "DESC"],
          ]
        : [[sortBy, sortOrder.toUpperCase()]];

    const { count, rows } = await Agreement.findAndCountAll({
      where,
      include: agreementIncludes(role),
      order,
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        agreements: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET SINGLE ───────────────────────────────────────────────────────────────

/**
 * GET /api/agreements/:id
 * buyer → own | owner → assigned | admin → any (with property images)
 */
const getAgreementById = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const { id } = req.params;

    const where = { id };
    if (role === "buyer") where.buyerId = userId;
    if (role === "owner") where.ownerId = userId;

    // Admin gets property images too
    const includes =
      role === "admin"
        ? [
            {
              model: Property,
              as: "property",
              include: [
                {
                  model: PropertyImage,
                  as: "images",
                  attributes: ["id", "imageUrl", "isPrimary"],
                },
              ],
            },
            {
              model: User,
              as: "buyer",
              attributes: ["id", "name", "email", "phone", "address"],
            },
            {
              model: User,
              as: "ownerUser",
              attributes: ["id", "name", "email", "phone", "address"],
            },
          ]
        : agreementIncludes(role);

    const agreement = await Agreement.findOne({ where, include: includes });

    if (!agreement) {
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    }

    const data = await fetchWithHistory(agreement);
    res.json({
      success: true,
      data: role === "admin" ? data : { agreement: data },
    });
  } catch (error) {
    next(error);
  }
};

// ─── BUYER: Create Request ────────────────────────────────────────────────────

const requestAgreement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

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

    const property = await Property.scope(null).findOne({
      where: { id: propertyId, isPublished: true, isDeleted: false },
    });
    if (!property)
      return res
        .status(404)
        .json({
          success: false,
          message: "Property not found or not available.",
        });

    const existing = await Agreement.findOne({
      where: { propertyId, buyerId, status: "pending" },
    });
    if (existing)
      return res
        .status(409)
        .json({
          success: false,
          message:
            "You already have a pending agreement request for this property.",
        });

    const buyer = await User.findByPk(buyerId);

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
      monthlyRent,
      salePrice,
    });

    // Save initial request to negotiation history
    await NegotiationHistory.create({
      agreementId: agreement.id,
      actorType: "buyer",
      actionType: "initial_request",
      price: agreementType === "rental" ? monthlyRent : salePrice,
      notes: terms,
    });

    const created = await Agreement.findByPk(agreement.id, {
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
      ],
    });

    res.status(201).json({
      success: true,
      message: "Agreement request submitted. The admin will review it.",
      data: { agreement: created },
    });
  } catch (error) {
    next(error);
  }
};

// ─── BUYER: Respond to Counter-Offer ─────────────────────────────────────────

const respondToCounter = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const buyerId = req.user.userId;
    const { id } = req.params;
    const { action, counterOfferPrice, buyerNotes } = req.body;

    const agreement = await Agreement.findOne({ where: { id, buyerId } });
    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });

    if (agreement.status !== "counter_offer_sent") {
      return res
        .status(400)
        .json({
          success: false,
          message: "You can only respond to active counter-offers.",
        });
    }

    const updateData = {};

    if (action === "accept") {
      updateData.status = "buyer_accepted_counter";
      updateData.buyerCounterAt = new Date();
      if (buyerNotes) updateData.buyerNotes = buyerNotes;
      updateData[
        agreement.agreementType === "rental" ? "monthlyRent" : "salePrice"
      ] = agreement.counterOfferPrice;
    } else if (action === "reject") {
      updateData.status = "buyer_rejected_counter";
      updateData.buyerCounterAt = new Date();
      if (buyerNotes) updateData.buyerNotes = buyerNotes;
    } else {
      if (!counterOfferPrice || parseFloat(counterOfferPrice) <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Valid counter-offer price is required.",
          });
      }
      updateData.status = "buyer_counter_offer";
      updateData.buyerCounterPrice = parseFloat(counterOfferPrice);
      updateData.buyerCounterAt = new Date();
      if (buyerNotes) updateData.buyerNotes = buyerNotes;

      await NegotiationHistory.create({
        agreementId: id,
        actorType: "buyer",
        actionType: "counter_offer",
        price: parseFloat(counterOfferPrice),
        notes: buyerNotes,
      });
    }

    await agreement.update(updateData);

    const updated = await Agreement.findByPk(id, {
      include: agreementIncludes("buyer"),
    });
    const data = await fetchWithHistory(updated);

    const verb =
      action === "accept"
        ? "accepted"
        : action === "reject"
          ? "rejected"
          : "countered";
    res.json({
      success: true,
      message: `Counter-offer ${verb} successfully.`,
      data: { agreement: data },
    });
  } catch (error) {
    next(error);
  }
};

// ─── OWNER: Respond to Agreement ─────────────────────────────────────────────

const ownerRespond = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const ownerId = req.user.userId;
    const { id } = req.params;
    const { action, counterOfferPrice, ownerNotes } = req.body;

    const agreement = await Agreement.findOne({ where: { id, ownerId } });
    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });

    const allowedStatuses = [
      "forwarded_to_owner",
      "buyer_counter_offer",
      "buyer_counter_forwarded",
    ];
    if (!allowedStatuses.includes(agreement.status)) {
      return res.status(400).json({
        success: false,
        message:
          agreement.status === "pending"
            ? "This request is still pending admin review."
            : `Cannot respond to an agreement with status: ${agreement.status}.`,
      });
    }

    const updateData = {};

    if (action === "approve") {
      updateData.status = "owner_approved";
      updateData.ownerResponseAt = new Date();
    } else if (action === "reject") {
      updateData.status = "owner_rejected";
      updateData.ownerResponseAt = new Date();
    } else {
      if (!counterOfferPrice)
        return res
          .status(400)
          .json({
            success: false,
            message: "Counter-offer price is required.",
          });
      updateData.status = "counter_offer";
      updateData.counterOfferPrice = parseFloat(counterOfferPrice);
      updateData.ownerCounterAt = new Date();

      await NegotiationHistory.create({
        agreementId: id,
        actorType: "owner",
        actionType: "counter_offer",
        price: parseFloat(counterOfferPrice),
        notes: ownerNotes,
      });
    }

    if (ownerNotes) updateData.ownerNotes = ownerNotes;
    await agreement.update(updateData);

    const verb =
      action === "approve"
        ? "approved"
        : action === "reject"
          ? "rejected"
          : "counter-offered";
    res.json({
      success: true,
      message: `Agreement ${verb} successfully.`,
      data: { id, status: updateData.status },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Forward to Owner ──────────────────────────────────────────────────

const forwardToOwner = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [{ model: User, as: "ownerUser", attributes: ["id", "name"] }],
    });
    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    if (agreement.status !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only pending agreements can be forwarded.",
        });
    }

    await agreement.update({
      status: "forwarded_to_owner",
      forwardedAt: new Date(),
      ...(req.body.adminNote && { adminNote: req.body.adminNote }),
    });

    res.json({
      success: true,
      message: `Forwarded to owner (${agreement.ownerUser?.name}).`,
      data: { id: agreement.id, status: "forwarded_to_owner" },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Send Counter-Offer to Buyer ──────────────────────────────────────

const sendCounterToBuyer = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [{ model: User, as: "buyer", attributes: ["id", "name"] }],
    });
    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    if (agreement.status !== "counter_offer") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only counter-offer agreements can be sent to buyer.",
        });
    }

    await agreement.update({
      status: "counter_offer_sent",
      ...(req.body.adminNote && { adminNote: req.body.adminNote }),
    });

    res.json({
      success: true,
      message: `Counter-offer sent to buyer (${agreement.buyer?.name}).`,
      data: { id: agreement.id, status: "counter_offer_sent" },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Forward Buyer Counter to Owner ────────────────────────────────────

const forwardBuyerCounterToOwner = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [{ model: User, as: "ownerUser", attributes: ["id", "name"] }],
    });
    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    if (agreement.status !== "buyer_counter_offer") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only buyer counter-offers can be forwarded to owner.",
        });
    }

    await agreement.update({
      status: "buyer_counter_forwarded",
      forwardedAt: new Date(),
      ...(req.body.adminNote && { adminNote: req.body.adminNote }),
    });

    res.json({
      success: true,
      message: `Buyer counter-offer forwarded to owner (${agreement.ownerUser?.name}).`,
      data: { id: agreement.id, status: "buyer_counter_forwarded" },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Approve Buyer Acceptance ─────────────────────────────────────────

const approveBuyerAcceptance = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    if (agreement.status !== "buyer_accepted_counter") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only buyer-accepted counter-offers can be approved.",
        });
    }

    await agreement.update({
      status: "owner_approved",
      ...(req.body.adminNote && { adminNote: req.body.adminNote }),
    });

    res.json({
      success: true,
      message: "Agreement approved.",
      data: { id: agreement.id, status: "owner_approved" },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Add Note ──────────────────────────────────────────────────────────

const addAdminNote = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id);
    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });

    await agreement.update({ adminNote: req.body.adminNote });
    res.json({ success: true, message: "Admin note updated." });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN: Generate PDF ──────────────────────────────────────────────────────

const generatePDF = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property" },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone", "address"],
        },
        {
          model: User,
          as: "ownerUser",
          attributes: ["id", "name", "email", "phone", "address"],
        },
      ],
    });

    if (!agreement)
      return res
        .status(404)
        .json({ success: false, message: "Agreement not found." });
    if (agreement.status !== "owner_approved") {
      return res
        .status(400)
        .json({
          success: false,
          message: "PDF can only be generated for owner-approved agreements.",
        });
    }

    const pdfDir = path.join(__dirname, "..", "uploads", "agreements");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const filename = `agreement-${agreement.id}.pdf`;
    const pdfPath = path.join(pdfDir, filename);
    const pdfUrl = `/uploads/agreements/${filename}`;

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    // ── Header ──
    doc.fontSize(20).font("Helvetica-Bold").text("DDREMS", { align: "center" });
    doc
      .fontSize(13)
      .font("Helvetica")
      .text("Dire Dawa Real Estate Management System", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(
        `${agreement.agreementType === "sale" ? "Sale" : "Rental"} Agreement`,
        { align: "center" },
      );
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // ── Meta ──
    doc.fontSize(10).font("Helvetica");
    doc.text(`Agreement ID: ${agreement.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Status: ${agreement.status.replace(/_/g, " ").toUpperCase()}`);
    doc.moveDown();

    // ── Property ──
    doc.fontSize(12).font("Helvetica-Bold").text("Property Details");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Title: ${agreement.property.title}`);
    doc.text(`Address: ${agreement.property.address}`);
    doc.text(
      `Type: ${agreement.property.propertyType} (${agreement.property.listingType})`,
    );
    doc.text(
      `Listed Price: ETB ${Number(agreement.property.price).toLocaleString()}`,
    );
    doc.moveDown();

    // ── Owner ──
    doc.fontSize(12).font("Helvetica-Bold").text("Property Owner");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${agreement.ownerUser.name}`);
    doc.text(`Email: ${agreement.ownerUser.email}`);
    if (agreement.ownerUser.phone)
      doc.text(`Phone: ${agreement.ownerUser.phone}`);
    doc.moveDown();

    // ── Buyer ──
    doc.fontSize(12).font("Helvetica-Bold").text("Buyer");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${agreement.buyer.name}`);
    doc.text(`Email: ${agreement.buyer.email}`);
    if (agreement.buyer.phone) doc.text(`Phone: ${agreement.buyer.phone}`);
    doc.moveDown();

    // ── Terms ──
    doc.fontSize(12).font("Helvetica-Bold").text("Agreement Terms");
    doc.fontSize(10).font("Helvetica");
    if (agreement.agreementType === "rental") {
      if (agreement.monthlyRent)
        doc.text(
          `Monthly Rent: ETB ${Number(agreement.monthlyRent).toLocaleString()}`,
        );
      if (agreement.startDate) doc.text(`Start Date: ${agreement.startDate}`);
      if (agreement.endDate) doc.text(`End Date: ${agreement.endDate}`);
    } else {
      if (agreement.salePrice)
        doc.text(
          `Sale Price: ETB ${Number(agreement.salePrice).toLocaleString()}`,
        );
    }
    if (agreement.terms) {
      doc.moveDown(0.5);
      doc.text(`Terms: ${agreement.terms}`);
    }
    doc.moveDown(3);

    // ── Signatures ──
    const sigY = doc.y;
    doc.moveTo(50, sigY).lineTo(220, sigY).stroke();
    doc.text("Owner Signature", 50, sigY + 5);
    doc.moveTo(280, sigY).lineTo(450, sigY).stroke();
    doc.text("Buyer Signature", 280, sigY + 5);
    doc.moveDown(3);
    const sigY2 = doc.y;
    doc.moveTo(50, sigY2).lineTo(220, sigY2).stroke();
    doc.text("Admin Authorized By", 50, sigY2 + 5);

    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));

    await agreement.update({ pdfUrl, status: "completed" });

    res.json({
      success: true,
      message: "PDF generated. Agreement marked as completed.",
      data: { id: agreement.id, pdfUrl, status: "completed" },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getAgreements,
  getAgreementById,
  requestAgreement,
  requestAgreementValidation,
  respondToCounter,
  respondToCounterValidation,
  ownerRespond,
  ownerRespondValidation,
  forwardToOwner,
  sendCounterToBuyer,
  forwardBuyerCounterToOwner,
  approveBuyerAcceptance,
  addAdminNote,
  generatePDF,
};

