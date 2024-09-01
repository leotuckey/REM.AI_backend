const DreamAccount = require('../models/DreamAccount')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')
const transporter = require('../config/nodemailer');
const User = require('../models/DreamAccount');
const jwt = require('jsonwebtoken');


const verifyEmail = async (req, res) => {
    try {
        const { ConfirmationToken } = req.params;
        const { userId } = jwt.verify(ConfirmationToken, process.env.JWT_SECRET);

        await User.findByIdAndUpdate(userId, { verified: true });

        res.status(StatusCodes.ACCEPTED).json({msg: 'Email verified successfully'});
    } catch (err) {
        throw new BadRequestError('Something went wrong')
    }
};


module.exports={
    verifyEmail,
}