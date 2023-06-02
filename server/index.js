const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const router = require('./routers')
require('dotenv').config()
const errorMiddleware = require('../server/middlewares/error-middleware.js')

const PORT = process.env.PORT || 4100

const app = express()

app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use('/auth', router);
app.use(errorMiddleware);

const start = () => {
    try {
        app.listen(PORT, () => console.log(`Server starting on port: ${PORT}`))
    } catch(e) {
        console.log(e)
    }
}

start()

