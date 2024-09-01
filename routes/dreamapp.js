const express = require('express')
const router = express.Router()

const {
    getDream,
    createDream,
    updateDream,
    deleteDream,
} = require('../controllers/Dreams')

router.route('/').post(createDream)

router.route('/:date').get(getDream).delete(deleteDream).patch(updateDream)

module.exports = router