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
} = require("../controllers/agreementController");

router.use(authenticate, roleCheck("admin"));
router.get("/", getAgreements);
router.get("/:id", getAgreementById);
router.patch("/:id/note", addAdminNote);
router.patch("/:id/forward", forwardToOwner);
router.patch("/:id/send-counter-offer", sendCounterOfferToBuyer);
router.patch("/:id/forward-buyer-counter", forwardBuyerCounterToOwner);
router.patch("/:id/approve-buyer-acceptance", approveBuyerAcceptance);
router.post("/:id/generate-pdf", generatePDF);

module.exports = router;
