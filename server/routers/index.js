const Router = require('express').Router
const AuthController = require('../controllers/user_controller.js')
const router = new Router()
const {check} = require('express-validator')
const authMiddleware = require('../middlewares/auth-middleware.js')

router.post('/registration', [
    check('email', "Это поле не может быть пустым").notEmpty(),
    check('password', "Длина пароля должна быть от 4 до 32 символов").isLength({min: 4, max: 32})
], AuthController.registration)
router.post('/login', AuthController.login)
router.post('/logout', AuthController.logout)
router.get('/refresh', AuthController.refresh)
router.get('/activate/:link', AuthController.activate)
router.get('/users', authMiddleware, AuthController.getUsers)

module.exports = router