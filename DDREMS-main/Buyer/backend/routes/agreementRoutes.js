/**
 * Agreement Routes (Buyer Module)
 * POST /api/agreements      - Create agreement request
 * GET  /api/agreements      - List buyer's agreement requests
 * GET  /api/agreements/:id  - Get single agreement details
 */
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
  requestAgreement,
  requestAgreementValidation,
  getBuyerAgreements,
  getAgreementById,
  respondToCounterOffer,
  respondToCounterOfferValidation,
} = require("../controllers/agreementController");

// All agreement routes require authentication + buyer role
router.use(authenticate, roleCheck("buyer"));

router.post("/", requestAgreementValidation, requestAgreement);
router.get("/", getBuyerAgreements);
router.get("/:id", getAgreementById);
router.patch(
  "/:id/respond-counter",
  respondToCounterOfferValidation,
  respondToCounterOffer,
);

module.exports = router;
