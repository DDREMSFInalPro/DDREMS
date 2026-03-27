/**
 * Formal Agreement Controller (Admin)
 * Handles the post-negotiation agreement lifecycle:
 * price_agreed → agreement_created → owner_signed → payment_uploaded → payment_verified → buyer_signed → completed
 */
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { FormalAgreement, Agreement, User, Property } = require("../models");

// GET /api/formal-agreements
const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await FormalAgreement.findAndCountAll({
      where,
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "address"],
        },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });
    res.json({
      success: true,
      data: {
        formalAgreements: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/formal-agreements/:id
const getById = async (req, res, next) => {
  try {
    const fa = await FormalAgreement.findByPk(req.params.id, {
      include: [
        {
          model: Property,
          as: "property",
          attributes: [
            "id",
            "title",
            "address",
            "price",
            "propertyType",
            "listingType",
          ],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: Agreement,
          as: "negotiation",
          attributes: ["id", "agreementType", "status"],
        },
      ],
    });
    if (!fa)
      return res
        .status(404)
        .json({ success: false, message: "Formal agreement not found." });
    res.json({ success: true, data: fa });
  } catch (err) {
    next(err);
  }
};

// GET /api/formal-agreements/by-negotiation/:negotiationId
const getByNegotiation = async (req, res, next) => {
  try {
    const fa = await FormalAgreement.findOne({
      where: { negotiationId: req.params.negotiationId },
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "address"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });
    res.json({ success: true, data: fa });
  } catch (err) {
    next(err);
  }
};

// POST /api/formal-agreements  — Admin creates formal agreement after price is agreed
const create = async (req, res, next) => {
  try {
    const { negotiationId, finalPrice, paymentMethod, paymentDeadline, terms } =
      req.body;
    if (!negotiationId || !finalPrice || !paymentMethod || !paymentDeadline) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "negotiationId, finalPrice, paymentMethod, paymentDeadline are required.",
        });
    }

    const negotiation = await Agreement.findByPk(negotiationId);
    if (!negotiation)
      return res
        .status(404)
        .json({ success: false, message: "Negotiation not found." });

    const allowed = ["owner_approved", "price_agreed"];
    if (!allowed.includes(negotiation.status)) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Formal agreement can only be created after price is agreed.",
        });
    }

    // Check not already created
    const existing = await FormalAgreement.findOne({
      where: { negotiationId },
    });
    if (existing)
      return res
        .status(409)
        .json({
          success: false,
          message: "Formal agreement already exists for this negotiation.",
        });

    const fa = await FormalAgreement.create({
      negotiationId,
      propertyId: negotiation.propertyId,
      ownerId: negotiation.ownerId,
      buyerId: negotiation.buyerId,
      finalPrice: parseFloat(finalPrice),
      paymentMethod,
      paymentDeadline,
      terms: terms || "",
      status: "agreement_created",
      ownerSigned: false,
      buyerSigned: false,
      paymentStatus: "pending",
    });

    // Lock negotiation
    await negotiation.update({ status: "price_agreed" });

    res
      .status(201)
      .json({
        success: true,
        message: "Formal agreement created. Negotiation is now locked.",
        data: fa,
      });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/formal-agreements/:id/verify-payment  — Admin verifies payment proof
const verifyPayment = async (req, res, next) => {
  try {
    const fa = await FormalAgreement.findByPk(req.params.id);
    if (!fa)
      return res
        .status(404)
        .json({ success: false, message: "Formal agreement not found." });
    if (fa.paymentStatus !== "pending" || !fa.paymentProofUrl) {
      return res
        .status(400)
        .json({ success: false, message: "No payment proof uploaded yet." });
    }
    await fa.update({ paymentStatus: "paid", paymentVerifiedAt: new Date() });
    res.json({ success: true, message: "Payment verified.", data: fa });
  } catch (err) {
    next(err);
  }
};

// POST /api/formal-agreements/:id/generate-pdf  — Admin generates final PDF after completion
const generatePDF = async (req, res, next) => {
  try {
    const fa = await FormalAgreement.findByPk(req.params.id, {
      include: [
        { model: Property, as: "property" },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });
    if (!fa)
      return res
        .status(404)
        .json({ success: false, message: "Formal agreement not found." });
    if (!fa.ownerSigned || !fa.buyerSigned || fa.paymentStatus !== "paid") {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Both parties must sign and payment must be verified before generating PDF.",
        });
    }

    const pdfDir = path.join(__dirname, "..", "uploads", "agreements");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const filename = `formal-agreement-${fa.id}.pdf`;
    const pdfPath = path.join(pdfDir, filename);
    const pdfUrl = `/uploads/agreements/${filename}`;

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(20).font("Helvetica-Bold").text("DDREMS", { align: "center" });
    doc
      .fontSize(12)
      .font("Helvetica")
      .text("Dire Dawa Real Estate Management System", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("FORMAL AGREEMENT", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(10).font("Helvetica");
    doc.text(`Agreement ID: ${fa.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Property");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Title: ${fa.property?.title}`);
    doc.text(`Address: ${fa.property?.address}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Owner");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${fa.owner?.name}`);
    doc.text(`Email: ${fa.owner?.email}`);
    if (fa.owner?.phone) doc.text(`Phone: ${fa.owner.phone}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Buyer");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${fa.buyer?.name}`);
    doc.text(`Email: ${fa.buyer?.email}`);
    if (fa.buyer?.phone) doc.text(`Phone: ${fa.buyer.phone}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Agreement Terms");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Final Price: ETB ${Number(fa.finalPrice).toLocaleString()}`);
    doc.text(`Payment Method: ${fa.paymentMethod}`);
    doc.text(`Payment Deadline: ${fa.paymentDeadline}`);
    if (fa.terms) doc.text(`Terms: ${fa.terms}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Signatures");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Owner Signed: ✅ ${new Date(fa.ownerSignedAt).toLocaleString()}`);
    doc.text(`Buyer Signed: ✅ ${new Date(fa.buyerSignedAt).toLocaleString()}`);
    doc.text(
      `Payment Verified: ✅ ${new Date(fa.paymentVerifiedAt).toLocaleString()}`,
    );
    doc.moveDown(2);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc
      .fontSize(9)
      .text("This document is officially verified by DDREMS Admin.", {
        align: "center",
      });

    doc.end();
    await new Promise((resolve) => stream.on("finish", resolve));

    await fa.update({ pdfUrl, status: "completed" });

    // Mark property as sold/rented
    const negotiation = await Agreement.findByPk(fa.negotiationId);
    if (negotiation) {
      const propStatus =
        negotiation.agreementType === "sale" ? "sold" : "rented";
      await Property.update(
        { status: propStatus, isPublished: false },
        { where: { id: fa.propertyId } },
      );
      await negotiation.update({ status: "completed" });
    }

    res.json({
      success: true,
      message: "Formal agreement PDF generated. Agreement completed.",
      data: { pdfUrl, status: "completed" },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  getByNegotiation,
  create,
  verifyPayment,
  generatePDF,
};
