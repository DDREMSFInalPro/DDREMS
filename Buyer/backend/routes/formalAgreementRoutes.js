const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const upload = require("../middleware/upload");
const {
  getBuyerFormalAgreements,
  getById,
  getByNegotiation,
  uploadPaymentProof,
  sign,
} = require("../controllers/formalAgreementController");

router.use(authenticate, roleCheck("buyer"));

router.get("/", getBuyerFormalAgreements);
router.get("/by-negotiation/:negotiationId", getByNegotiation);
router.get("/:id", getById);
router.patch(
  "/:id/upload-payment",
  upload.single("paymentProof"),
  uploadPaymentProof,
);
router.patch("/:id/sign", sign);

module.exports = router;
