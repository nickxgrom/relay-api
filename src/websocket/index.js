const {WebSocketServer} = require("ws"),
    cookieParser = require("cookie"),
    jsonwebtoken = require("jsonwebtoken"),
    ChatService = require("../services/ChatService"),
    {SENDER} = require("../consts")

const clients = new Set()
const operators = new Set()

function startWSServer(PORT) {

    const wss = new WebSocketServer({ port: PORT })

    wss.on("connection", function connection(ws, req) {
        const sender = identifyConnection(ws, cookieParser.parse(req.headers.cookie))

        ws.on("error", console.error)

        ws.on("message", function message(data) {
            let d = Buffer.from(data).toString("utf8")

            console.log(sender)

            ws.send(d)
        })
    })

    wss.on("listening", () => {
        console.log(`Websocket server is listening on ws://${PORT}`)
    })
}

function identifyConnection(conn, cookie) {
    try {
        const data = jsonwebtoken.verify(cookie.token, process.env.JWT_SECRET)

        if (data.chatId) {
            return SENDER.CLIENT
        } else if (data.employeeId) {
            return SENDER.OPERATOR
        } else {
            conn.send({ status: 404, message: "unknown-sender" })
            conn.close()
        }
    } catch (err) {
        conn.send(JSON.stringify(err))
        conn.close()
    }
}

module.exports = startWSServer