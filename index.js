require("dotenv").config()

const express = require("express"),
    app = express(),
    PORT = process.env.PORT,
    db = require("./utils/db"),
    ServiceError = require("./utils/ServiceError"),
    router = require("./src/controllers/index")

app.use(express.json())
app.use(router)

app.use( (err, req, res, next) => {
    if (err instanceof ServiceError) {
        res.status(err.statusCode).send(err.message)
    } else next(err)
} )

app.listen(PORT, async () => {
    await db.sync()
    console.log(`Server listening http://localhost:${PORT}`)
})