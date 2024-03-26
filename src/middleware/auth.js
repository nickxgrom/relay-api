const jsonwebtoken = require("jsonwebtoken")

module.exports = (req, res, next) => {
    const token = req.cookies?.["relay-token"]
    if (!token) return res.status(401).send("unauthorized")

    try {
        req.user = jsonwebtoken.verify(token, process.env.JWT_SECRET)
        next()
    } catch (err) {
        res.clearCookie("token")
        res.status(401).send("unauthorized")
    }
}