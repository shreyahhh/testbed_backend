const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');

// Get game content
router.get('/:gameType', contentController.getContent);

module.exports = router;
