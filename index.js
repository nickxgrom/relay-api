require("dotenv").config()

const express = require("express"),
    app = express(),
    PORT = process.env.PORT,
    db = require("./utils/db"),
    ServiceError = require("./utils/ServiceError"),
    router = require("./src/controllers/index"),
    authMiddleware = require("./src/middleware/auth"),
    IdentityController = require("./src/controllers/IdentityController"),
    cookieParser = require("cookie-parser")

app.use(express.json())
app.use(cookieParser())
// without auth
app.use(IdentityController)
// rest with auth
app.use(authMiddleware)
app.use(router)

app.use((err, req, res, next) => {
    if (err instanceof ServiceError) {
        res.status(err.statusCode).send(err.message)
    } else next(err)
})

app.listen(PORT, async () => {
    await db.sync()
    console.log(`Server listening http://localhost:${PORT}`)
})