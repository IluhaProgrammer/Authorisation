const validateAccesToken = (token) => {
    try {
        const userData = jwt.verify(token, process.env.JWT_ACCES_TOKEN)
        return userData
    } catch(e) {
        return null
    }
}
