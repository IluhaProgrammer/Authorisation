const pool = require('../db.js')
const bcrypt = require('bcryptjs')
const uuid = require('uuid')
const jwt = require('jsonwebtoken')
const UserDto = require('../dtos/user-dto.js')
const mailService = require('../dtos/mailService.js')
const ApiError = require('../exceptions/api-error.js')
const {validationResult} = require('express-validator')

const generateTokens = (payload) => {
    const accesToken = jwt.sign(payload, process.env.JWT_ACCES_TOKEN, {expiresIn: '30m'})
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN, {expiresIn: '30d'})
    return {
        accesToken,
        refreshToken
    }
}

const saveToken = async (id, refreshToken) => {
    const tokenData = await pool.query('SELECT * FROM token WHERE user_id = $1', [id])
    if(tokenData.rows[0] !== undefined) {
        const updateUser = await pool.query('UPDATE token SET refreshtoken = $1 WHERE user_id = $2', [refreshToken, id])
        return updateUser
    }
    const newUser = await pool.query('INSERT INTO token (user_id, refreshtoken) VALUES($1, $2) RETURNING *', [id, refreshToken])
}

const activate = async (activationLink) => {
    const user = await pool.query('SELECT * FROM person where isactivelink = $1 ', [activationLink])
    if(!user) {
        console.log(e)
        return ApiError.BadRequest({message: "Такого пользователя не существует!"})
    }
    const updateUser = await pool.query('UPDATE person set isactivated = true WHERE isactivelink = $1', [activationLink])
}

const userLogout = async (refreshToken) => {
    const deletToken = await pool.query('DELETE FROM token WHERE refreshtoken = $1', [refreshToken])
    return deletToken
}

const validateRefreshToken = (token) => {
    try {
        const userData = jwt.verify(token, process.env.JWT_REFRESH_TOKEN)
        return userData
    } catch(e) {
        return null
    }
}


class AuthController {
    async registration(req, res, next) {
        try { 
            const error = validationResult(req)
            if(!error.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации!'))
            }
            const{email, password} = req.body
            const hashedPassword = bcrypt.hashSync(password, 7)
            const activationLink = uuid.v4()
            const candidate = await pool.query('INSERt INTO person (email, password, isactivelink) VALUES($1, $2, $3) RETURNING *', [email, hashedPassword, activationLink])
            await mailService.send(email, `${process.env.AUTH_URL}/auth/activate/${activationLink}`)

            const userDto = new  UserDto(candidate.rows[0])
            const tokens = generateTokens({...userDto})
            await saveToken(userDto.id, tokens.refreshToken)
            res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true}).status(200)
            res.json({candidate: candidate.rows[0], accesToken: tokens.accesToken, refreshToken: tokens.refreshToken})
        } catch(e) {
            res.json({message: `Пользователь с таким email уже существует!`}).status(400)
            next(e)
        }
    }
    async login(req, res, next) {
        try {
            const {email, password} = req.body
            const candidate = await pool.query('SELECT * FROM person WHERE email = $1', [email])
            if(!candidate) {
                return ApiError.BadRequest('Пользователь с таким email не существует!')
            }
            const newHashedPass = bcrypt.hashSync(password, 7)
            const validationPass = bcrypt.compare(newHashedPass, candidate.rows[0].password )
            if(!validationPass) {
                return ApiError.BadRequest('Введен неверный пароль')
            }
            const userDto = new UserDto(candidate.rows[0])
            const tokens =  generateTokens({...userDto})
            saveToken(userDto.id, tokens.refreshToken)
            res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            res.json({user: userDto, ...tokens})
            
        } catch(e) {
            res.json({message: "неверный пароль или логин"}).status(400)
            next(e)
        }
    }
    async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            await userLogout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json({message: 'Вы вышли из системы'}).status(200)
        } catch(e) {
            res.json({message: "Произошла ошибка!"})
            next(e)
        }
    }
    async activate(req, res, next) {
        try {
            const activationLink = req.params.link
            await activate(activationLink)
            return res.redirect(process.env.CLIENT_URL)
        } catch(e) {
            res.json({message: "Произошла ошибка!"})
            next(e)
        }
    }

    async getUsers(req, res, next) {
        try {
            const user = await pool.query('SELECT * FROM person')
            res.json({users: user.rows})
        } catch(e) {
            res.json({message: "Произошла ошибка!"})
            next(e)
        }
    }

    async refresh(req, res, next) {
        try {
            const {refreshToken} = req.cookies
            if(!refreshToken) {
                return ApiError.UnAuthtorizhatedError()
            }
            const validateTOken = validateRefreshToken(refreshToken)
            const findToken = await pool.query('SELECT * FROM token WHERE refreshtoken = $1', [refreshToken])
            if(findToken.rows[0] == undefined || !validateTOken) {
                return ApiError.UnAuthtorizhatedError()
            }

            const candidate = await pool.query('SELECT * FROM person WHERE id = $1', [validateTOken.id])
            const userDto = new UserDto(candidate.rows[0])
            const tokens =  generateTokens({...userDto})
            saveToken(userDto.id, tokens.refreshToken)
            res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            res.json({user: userDto,...tokens})

        } catch(e) {

        }
    }


}

module.exports = new AuthController()