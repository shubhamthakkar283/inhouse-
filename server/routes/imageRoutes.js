const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

router.get('/', imageController.getAllImages);
router.get('/:id', imageController.getImageById);
router.get('/event/:eventId', imageController.getImagesByEventId);
router.post('/', imageController.createImage);
router.delete('/:id', imageController.deleteImage);

module.exports = router;
