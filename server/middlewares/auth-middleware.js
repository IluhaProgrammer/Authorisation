const ApiError = require('../exceptions/api-error.js')
const jwt = require('jsonwebtoken')

const validateAccesToken = (token) => {
    try {
        const userData = jwt.verify(token, process.env.JWT_ACCES_TOKEN)
        return userData
    } catch(e) {
        return null
    }
}

module.exports = function(req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization
        if(!authorizationHeader) {
            return next(ApiError.UnAuthtorizhatedError())
        }

        const accesToken = authorizationHeader.split(' ')[1]
        if(!accesToken) {
            return next(ApiError.UnAuthtorizhatedError()) 
        }

        if(!validateAccesToken(accesToken)) {
            return next(ApiError.UnAuthtorizhatedError())
        }

        req.user = validateAccesToken(accesToken)
        next()
    } catch(e) {
        return next(ApiError.UnAuthtorizhatedError())
    }
}