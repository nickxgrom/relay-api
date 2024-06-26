require("dotenv").config()

const express = require("express"),
    app = express(),
    PORT = process.env.PORT,
    db = require("./utils/db"),
    ServiceError = require("./utils/ServiceError"),
    router = require("./src/controllers/index"),
    authMiddleware = require("./src/middleware/auth"),
    IdentityController = require("./src/controllers/IdentityController"),
    EmployeeIdentityController = require("./src/controllers/EmployeeIdentityController"),
    cookieParser = require("cookie-parser"),
    cors = require("cors"),
    {startWSServer, startChatListWSServer} = require("./src/websocket/index"),
    OpenChatController = require("./src/controllers/ChatController")

app.use(cors({
    credentials: true,
    origin: true,
}))
app.use(express.json())
app.use(cookieParser())
// without auth
app.use(IdentityController)
app.use(EmployeeIdentityController)
app.use(OpenChatController)
// rest with auth
app.use(authMiddleware)
app.use(router)

app.use((err, req, res, next) => {
    if (err instanceof ServiceError) {
        res.status(err.statusCode).send({alias: err.message, error: err.error})
    } else next(err)
})

app.listen(PORT, async () => {
    await db.sync()
    console.log(`Server listening http://localhost:${PORT}`)
    startWSServer(process.env.WS_PORT)
    startChatListWSServer(process.env.WS_CHAT_LIST_PORT)
})