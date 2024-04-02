const jsonwebtoken = require("jsonwebtoken")

module.exports = (req, res, next) => {
    const token = req.cookies?.["relay-token"]
    if (!token) return res.status(401).send()

    try {
        req.user = jsonwebtoken.verify(token, process.env.JWT_SECRET)
        next()
    } catch (err) {
        res.clearCookie("relay-token")

        const data = jsonwebtoken.decode(req.cookies?.["relay-token"], process.env.JWT_SECRET)
        res.status(401).send(data.organizationId ? {organizationId: data.organizationId} : null)
    }
}