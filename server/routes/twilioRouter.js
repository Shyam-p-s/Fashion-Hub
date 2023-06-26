require('dotenv').config()
const express = require('express');
const twilio_controller = require('../controller/twilio_controller')
const router = express.Router();

router.post('/send-otp', twilio_controller.sendOTP);
router.post('/verify-otp', twilio_controller.verifyOTP);

module.exports = router;