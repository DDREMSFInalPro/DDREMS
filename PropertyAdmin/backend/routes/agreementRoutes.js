const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
  getAgreements,
  getAgreementById,
  addAdminNote,
  generatePDF,
  forwardToOwner,
  sendCounterOfferToBuyer,
  forwardBuyerCounterToOwner,
  approveBuyerAcceptance,
  getAgreementPayment,
  askOwnerPaymentConfirmation,
  verifyPayment,
} = require("../controllers/agreementController");

router.use(authenticate, roleCheck("admin"));
router.get("/", getAgreements);
router.get("/:id", getAgreementById);
router.get("/:id/payment", getAgreementPayment);
router.patch("/:id/note", addAdminNote);
router.patch("/:id/forward", forwardToOwner);
router.patch("/:id/send-counter-offer", sendCounterOfferToBuyer);
router.patch("/:id/forward-buyer-counter", forwardBuyerCounterToOwner);
router.patch("/:id/approve-buyer-acceptance", approveBuyerAcceptance);
router.patch("/:id/ask-owner-payment", askOwnerPaymentConfirmation);
router.patch("/:id/verify-payment", verifyPayment);
router.post("/:id/generate-pdf", generatePDF);

module.exports = router;
