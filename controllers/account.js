const DreamAccount = require('../models/DreamAccount')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')
const transporter = require('../config/nodemailer');
const bcrypt = require('bcryptjs')

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const tempUser = {name, email, password: hashedPassword}
        const user = await DreamAccount.create({ ...tempUser })
        const token = user.createJWT()
        const portNumber = process.env.PORT || 5000
        const url = `http://localhost:${portNumber}/api/verification/${token}`; //localhost for now. once we push to cloud, change this to our domain

        await transporter.sendMail({
            to: email,
            subject: 'Verify your email',
            html: `Click <a href="${url}">here</a> to verify your email.`
        });

        res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token, msg: 'Registration successful, please click the link we emailed you to verify your account' })
    }
    catch (err) {
        throw new BadRequestError('Invalid email or password')
    }
}

const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new BadRequestError('Please provide email and password')
    }
    const user = await DreamAccount.findOne({ email })
    if (!user) {
        throw new UnauthenticatedError('Invalid Credentials')
    }
    const isPasswordCorrect = await user.comparePassword(password)
    const isVerified = user.isVerified()
    if (!isPasswordCorrect || !isVerified) {
        throw new UnauthenticatedError('Invalid Credentials')
    }
    // compare password
    const token = user.createJWT()
    res.status(StatusCodes.OK).json({ user: { name: user.name }, token })
}

module.exports = {
    register,
    login,
}
