const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getUsers, getUserById, toggleUserActive } = require('../controllers/userController');

router.use(authenticate, roleCheck('admin'));
router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id/toggle-active', toggleUserActive);

module.exports = router;
