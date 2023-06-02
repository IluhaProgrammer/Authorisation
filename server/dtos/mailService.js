const nodemailer = require('nodemailer')

class mailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.yandex.ru',
            port: 587,
            secure: false,
            auth: {
                user: "Dashabubli4@yandex.ru",
                pass: "IlUhhaw75))75"
            }
        })
    }

    async send(email, link) {
        await this.transporter.sendMail({
            from: 'Dashabubli4@yandex.ru',
            to: email,
            subject: `Активация почты на сайте ${process.env.AUTH_URL}`,
            text: '',
            html: 
            `
                <div>
                    <h1>Для активации перейдите по ссылке </h1>
                    <a href="${link}">${link}</a>
                </div>
            `
        })
    }
}

module.exports = new mailService()