const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
  getOwnerFormalAgreements,
  getById,
  getByNegotiation,
  sign,
} = require("../controllers/formalAgreementController");

router.use(authenticate, roleCheck("owner"));

router.get("/", getOwnerFormalAgreements);
router.get("/by-negotiation/:negotiationId", getByNegotiation);
router.get("/:id", getById);
router.patch("/:id/sign", sign);

module.exports = router;
