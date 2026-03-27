/**
 * Formal Agreement Controller (Buyer)
 * Buyer can: view, upload payment proof, sign (only after payment verified)
 */
const { FormalAgreement, Property } = require("../models");

// GET /api/formal-agreements
const getBuyerFormalAgreements = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const rows = await FormalAgreement.findAll({
      where: { buyerId },
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "address"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/formal-agreements/:id
const getById = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const fa = await FormalAgreement.findOne({
      where: { id: req.params.id, buyerId },
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
    });
    res.json({ success: true, data: fa });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/formal-agreements/:id/upload-payment  — Buyer uploads payment proof
const uploadPaymentProof = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const fa = await FormalAgreement.findOne({
      where: { id: req.params.id, buyerId },
    });
    if (!fa)
      return res
        .status(404)
        .json({ success: false, message: "Formal agreement not found." });
    if (!fa.ownerSigned)
      return res.status(400).json({
        success: false,
        message: "Owner must sign before payment can be uploaded.",
      });
    if (fa.paymentStatus === "paid")
      return res
        .status(400)
        .json({ success: false, message: "Payment already verified." });
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Payment proof file is required." });

    const paymentProofUrl = `/uploads/${req.file.filename}`;
    await fa.update({
      paymentProofUrl,
      paymentUploadedAt: new Date(),
      status: "payment_uploaded",
    });
    res.json({
      success: true,
      message: "Payment proof uploaded. Awaiting admin verification.",
      data: fa,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/formal-agreements/:id/sign  — Buyer signs (only after payment verified)
const sign = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const fa = await FormalAgreement.findOne({
      where: { id: req.params.id, buyerId },
    });
    if (!fa)
      return res
        .status(404)
        .json({ success: false, message: "Formal agreement not found." });
    if (!fa.ownerSigned)
      return res
        .status(400)
        .json({ success: false, message: "Owner must sign first." });
    if (fa.paymentStatus !== "paid")
      return res.status(400).json({
        success: false,
        message: "Payment must be verified before signing.",
      });
    if (fa.buyerSigned)
      return res
        .status(400)
        .json({ success: false, message: "Already signed." });

    const newStatus = fa.ownerSigned ? "completed" : "buyer_signed";
    await fa.update({
      buyerSigned: true,
      buyerSignedAt: new Date(),
      status: newStatus,
    });
    res.json({
      success: true,
      message: "Agreement signed by buyer.",
      data: fa,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBuyerFormalAgreements,
  getById,
  getByNegotiation,
  uploadPaymentProof,
  sign,
};
