const express = require('express')
const router = express.Router()
const { verifyEmail } = require('../controllers/verification')

router.get('/:ConfirmationToken', verifyEmail)

module.exports = router