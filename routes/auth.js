const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/loGOUT', authController.postLogout);
module.exports = router;
