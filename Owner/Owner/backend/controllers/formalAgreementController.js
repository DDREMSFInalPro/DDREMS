/**
 * Formal Agreement Controller (Owner)
 * Owner can: view their formal agreements, sign them
 */
const { FormalAgreement, Property } = require("../models");

// GET /api/formal-agreements
const getOwnerFormalAgreements = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const rows = await FormalAgreement.findAll({
      where: { ownerId },
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
    const ownerId = req.user.userId;
    const fa = await FormalAgreement.findOne({
      where: { id: req.params.id, ownerId },
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
    const ownerId = req.user.userId;
    const fa = await FormalAgreement.findOne({
      where: { negotiationId: req.params.negotiationId, ownerId },
    });
    res.json({ success: true, data: fa });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/formal-agreements/:id/sign  — Owner signs
const sign = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const fa = await FormalAgreement.findOne({
      where: { id: req.params.id, ownerId },
    });
    if (!fa)
      return res
        .status(404)
        .json({ success: false, message: "Formal agreement not found." });
    if (fa.ownerSigned)
      return res
        .status(400)
        .json({ success: false, message: "Already signed." });
    if (!["agreement_created"].includes(fa.status)) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Agreement must be in agreement_created status for owner to sign.",
        });
    }
    await fa.update({
      ownerSigned: true,
      ownerSignedAt: new Date(),
      status: "owner_signed",
    });
    res.json({
      success: true,
      message: "Agreement signed by owner.",
      data: fa,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOwnerFormalAgreements, getById, getByNegotiation, sign };
