const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Match frontend usage in src/services/imageService.js
// - POST /api/images/generate
// - POST /api/images/generate-multiple
// - GET  /api/images/event/:eventId

router.post('/generate', imageController.generateImage);
router.post('/generate-multiple', imageController.generateMultipleImages);
router.get('/event/:eventId', imageController.getEventImages);

module.exports = router;
