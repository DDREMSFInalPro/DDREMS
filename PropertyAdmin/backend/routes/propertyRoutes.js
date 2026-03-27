const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getProperties, getPropertyById, togglePublish } = require('../controllers/propertyController');

router.use(authenticate, roleCheck('admin'));
router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.patch('/:id/toggle-publish', togglePublish);

module.exports = router;
