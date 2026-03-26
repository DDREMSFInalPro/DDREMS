/**
 * Agreement Routes — Unified
 *
 * GET    /api/agreements                          - List (role-filtered)
 * GET    /api/agreements/:id                      - Get single with timeline
 * POST   /api/agreements                          - Create request (buyer)
 * PATCH  /api/agreements/:id/respond-counter      - Buyer responds to counter
 * PATCH  /api/agreements/:id/respond              - Owner approves/rejects/counters
 * PATCH  /api/agreements/:id/forward              - Admin forwards to owner
 * PATCH  /api/agreements/:id/send-counter-offer   - Admin sends counter to buyer
 * PATCH  /api/agreements/:id/forward-buyer-counter- Admin forwards buyer counter to owner
 * PATCH  /api/agreements/:id/approve-buyer-acceptance - Admin approves buyer acceptance
 * PATCH  /api/agreements/:id/note                 - Admin adds note
 * POST   /api/agreements/:id/generate-pdf         - Admin generates PDF
 */
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
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
} = require("../controllers/agreementController");

router.use(authenticate);

// ── All roles: list & detail ──────────────────────────────────────────────────
router.get("/", getAgreements);
router.get("/:id", getAgreementById);

// ── Buyer only ────────────────────────────────────────────────────────────────
router.post(
  "/",
  roleCheck("buyer"),
  requestAgreementValidation,
  requestAgreement,
);
router.patch(
  "/:id/respond-counter",
  roleCheck("buyer"),
  respondToCounterValidation,
  respondToCounter,
);

// ── Owner only ────────────────────────────────────────────────────────────────
router.patch(
  "/:id/respond",
  roleCheck("owner"),
  ownerRespondValidation,
  ownerRespond,
);

// ── Admin only ────────────────────────────────────────────────────────────────
router.patch("/:id/forward", roleCheck("admin"), forwardToOwner);
router.patch("/:id/send-counter-offer", roleCheck("admin"), sendCounterToBuyer);
router.patch(
  "/:id/forward-buyer-counter",
  roleCheck("admin"),
  forwardBuyerCounterToOwner,
);
router.patch(
  "/:id/approve-buyer-acceptance",
  roleCheck("admin"),
  approveBuyerAcceptance,
);
router.patch("/:id/note", roleCheck("admin"), addAdminNote);
router.post("/:id/generate-pdf", roleCheck("admin"), generatePDF);

module.exports = router;
