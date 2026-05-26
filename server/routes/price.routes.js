const express = require('express');
const router = express.Router();
const priceController = require('../controllers/price.controller');

// Route for finding the best price among scrapers
router.post('/best', priceController.getBestPrice);

module.exports = router;
