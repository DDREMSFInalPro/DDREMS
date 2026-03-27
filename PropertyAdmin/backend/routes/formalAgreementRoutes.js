const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
  getAll,
  getById,
  getByNegotiation,
  create,
  verifyPayment,
  generatePDF,
} = require("../controllers/formalAgreementController");

router.use(authenticate, roleCheck("admin"));

router.get("/", getAll);
router.get("/by-negotiation/:negotiationId", getByNegotiation);
router.get("/:id", getById);
router.post("/", create);
router.patch("/:id/verify-payment", verifyPayment);
router.post("/:id/generate-pdf", generatePDF);

module.exports = router;
