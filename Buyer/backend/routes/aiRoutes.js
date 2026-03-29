const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getRecommendation, getPropertyRecommendations, getPropertyVerdict, knnRecommend } = require('../controllers/aiController');

router.use(authenticate, roleCheck('buyer'));

router.post('/recommend', getRecommendation);
router.post('/properties', getPropertyRecommendations);
router.post('/knn-recommend', knnRecommend);
router.get('/recommend/:propertyId', getPropertyVerdict);

module.exports = router;
