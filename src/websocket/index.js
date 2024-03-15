const {WebSocketServer} = require("ws"),
    cookieParser = require("cookie"),
    jsonwebtoken = require("jsonwebtoken"),
    ChatService = require("../services/ChatService"),
    {SENDER} = require("../consts")

const clients = new Map()
const operators = new Map()

function startWSServer(PORT) {

    const wss = new WebSocketServer({ port: PORT })

    wss.on("connection", async function connection(ws, req) {
        const {sender, chatId} = await identifyConnection(ws, req)

        ws.on("error", console.error)

        ws.on("message", function message(data) {
            let msg = Buffer.from(data).toString("utf8")


            if (sender === SENDER.OPERATOR) {
                if (clients.has(chatId)) {
                    const client = clients.get(chatId)

                    client.send(msg)
                }
            } else if (sender === SENDER.CLIENT) {
                if (operators.has(chatId)) {
                    const operator = operators.get(chatId)

                    operator.send(msg)
                }
            }
            // TODO: save msg
        })
    })

    wss.on("listening", () => {
        console.log(`Websocket server is listening on ws://${PORT}`)
    })
}

async function identifyConnection(conn, req) {
    const cookie = cookieParser.parse(req.headers.cookie)

    try {
        const data = jsonwebtoken.verify(cookie.token, process.env.JWT_SECRET)

        if (data.chatId) {
            const chatId = await handleClientConnection(conn, data)
            return {sender: SENDER.CLIENT, chatId}
        } else if (data.employeeId) {
            const chatId = await handleOperatorConnection(conn, _getQuery(req.url), data)
            return {sender: SENDER.OPERATOR, chatId }
        } else {
            conn.send(JSON.stringify({ status: 404, message: "unknown-sender" }))
            conn.close()
        }
    } catch (err) {
        conn.send(JSON.stringify("token-expired"))
        conn.close()
    }
}

async function handleOperatorConnection(conn, query, data) {
    if (query.chatId) {
        if (await ChatService.getChat(query.chatId, data.organizationId)) {
            if (operators.has(query.chatId)) {
                conn.send(JSON.stringify({status: 403, message: "chat-already-serving"}))
                conn.close()
            } else {
                operators.set(query.chatId, conn)
                return query.chatId
            }
        } else {
            conn.send(JSON.stringify({status: 404, message: "chat-not-exist"}))
            conn.close()
        }
    } else {
        conn.send(JSON.stringify({status: 400, message: "chatId-no-present"}))
        conn.close()
    }
}

async function handleClientConnection(conn, data) {
    const chat = await ChatService.getChat(data.chatId, data.organizationId)
    if (chat) {
        if (chat.archived) {
            conn.send(JSON.stringify({status: 403, message: "chat-archived"}))
            conn.close()
        } else {
            clients.set(data.chatId, conn)
            return data.chatId
        }
    } else {
        conn.send(JSON.stringify({status: 404, message: "chat-not-exist"}))
        conn.close()
    }
}


function _getQuery(queryString) {
    const params = new URLSearchParams(queryString.slice(1))
    const query = {}
    for (const [key, value] of params) {
        query[key] = value
    }
    return query
}

module.exports = startWSServer