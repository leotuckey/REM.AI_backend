require('dotenv').config();
require('express-async-errors');

// extra security packages
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');

const express = require('express');
const app = express();

const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');

//routers
const accountRouter = require('./routes/account');
const verificationRouter = require('./routes/verification');
const dreamAppRouter = require('./routes/dreamapp'); //only accessible when a user is logged in to their account.

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust proxy', 1);
app.use(
    rateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    })
);
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());


app.use('/api/account', accountRouter);
app.use('/api/verification', verificationRouter)
app.use('/api/dreamapp', authenticateUser, dreamAppRouter)

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};



start();



// console.log(typeof accountRouter);  // should log 'function'
// console.log(typeof verificationRouter);  // should log 'function'
// console.log(typeof dreamAppRouter);  // should log 'function'