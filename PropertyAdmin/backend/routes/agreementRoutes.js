const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getAgreements, getAgreementById, addAdminNote, generatePDF, forwardToOwner, sendCounterOfferToBuyer } = require('../controllers/agreementController');

router.use(authenticate, roleCheck('admin'));
router.get('/', getAgreements);
router.get('/:id', getAgreementById);
router.patch('/:id/note', addAdminNote);
router.patch('/:id/forward', forwardToOwner);
router.patch('/:id/send-counter-offer', sendCounterOfferToBuyer);
router.post('/:id/generate-pdf', generatePDF);

module.exports = router;

