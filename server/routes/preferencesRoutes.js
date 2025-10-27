const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferencesController');

router.get('/', preferencesController.getPreferences);
router.get('/all', preferencesController.getAllPreferences);
router.post('/', preferencesController.createPreferences);
router.post('/save', preferencesController.saveOrUpdatePreferences);
router.put('/:id', preferencesController.updatePreferences);
router.delete('/:id', preferencesController.deletePreferences);

module.exports = router;
