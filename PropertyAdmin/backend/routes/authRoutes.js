const express = require('express');
const router = express.Router();
const { login, loginValidation } = require('../controllers/authController');

router.post('/login', loginValidation, login);

module.exports = router;
