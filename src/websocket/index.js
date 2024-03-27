const {WebSocketServer} = require("ws"),
    jsonwebtoken = require("jsonwebtoken"),
    ChatService = require("../services/ChatService"),
    MessageService = require("../services/MessageService"),
    {SENDER, WS_MESSAGE_TYPE} = require("../consts"),
    ServiceError = require("../../utils/ServiceError")

const clients = new Map()
const operators = new Map()

function startWSServer(PORT) {
    const wss = new WebSocketServer({ port: PORT })

    wss.on("connection", async function connection(ws, req) {
        const {sender, chatId} = await identifyConnection(ws, req) ?? {}

        if (!chatId) return

        await sendChatHistory(ws, chatId)

        ws.on("error", console.error)

        ws.on("message", function message(data) {
            const msg = Buffer.from(data).toString("utf8")

            if (sender === SENDER.OPERATOR) {
                if (clients.has(chatId)) {
                    const client = clients.get(chatId)

                    sendMessage(client, WS_MESSAGE_TYPE.MESSAGE, msg)
                }
            } else if (sender === SENDER.CLIENT) {
                if (operators.has(chatId)) {
                    const operator = operators.get(chatId)

                    sendMessage(operator, WS_MESSAGE_TYPE.MESSAGE, msg)
                }
            }

            MessageService.saveMessage(chatId, {text: msg, sender}).catch(err => {
                sendMessage(ws, WS_MESSAGE_TYPE.ERROR, new ServiceError(500, "message-not-saved", err.error))
            })
        })
    })

    wss.on("listening", () => {
        console.log(`Websocket server is listening on ws://${PORT}`)
    })
}

async function identifyConnection(conn, req) {
    const params = new URLSearchParams(req.url.slice(1))
    const query = {}
    for (const [key, value] of params) {
        query[key] = value
    }

    const token = query["relay-token"]

    try {
        const data = jsonwebtoken.verify(token, process.env.JWT_SECRET)

        if (data.chatId) {
            const chatId = await handleClientConnection(conn, data)
            return {sender: SENDER.CLIENT, chatId}
        } else if (data.employeeId) {
            const chatId = await handleOperatorConnection(conn, _getQuery(req.url), data)
            return {sender: SENDER.OPERATOR, chatId }
        } else {
            sendMessage(conn, WS_MESSAGE_TYPE.ERROR, new ServiceError(404, "unknown-sender"))
            conn.close()
        }
    } catch (err) {
        sendMessage(conn, WS_MESSAGE_TYPE.ERROR, new ServiceError(401, "token-expired"))
        conn.close()
    }
}

async function handleOperatorConnection(conn, query, data) {
    if (query.chatId) {
        if (await ChatService.getChat(query.chatId, data.organizationId)) {
            if (operators.has(query.chatId)) {
                sendMessage(conn, WS_MESSAGE_TYPE.ERROR, new ServiceError(403, "chat-already-serving"))
                conn.close()
            } else {
                operators.set(query.chatId, conn)
                return query.chatId
            }
        } else {
            sendMessage(conn, WS_MESSAGE_TYPE.ERROR, new ServiceError(404, "chat-not-exist"))
            conn.close()
        }
    } else {
        sendMessage(conn, WS_MESSAGE_TYPE.ERROR, new ServiceError(400, "chatId-no-present"))
        conn.close()
    }
}

function sendMessage(conn, type, data) {
    const wsMsgObject = {
        type,
        data,
    }

    conn.send(JSON.stringify(wsMsgObject))
}

async function handleClientConnection(conn, data) {
    const chat = await ChatService.getChat(data.chatId, data.organizationId)
    if (chat) {
        if (chat.archived) {
            sendMessage(conn, WS_MESSAGE_TYPE.ERROR, new ServiceError(403, "chat-archived"))
            conn.close()
        } else {
            clients.set(data.chatId, conn)
            return data.chatId
        }
    } else {
        sendMessage(conn, WS_MESSAGE_TYPE.ERROR, new ServiceError(404, "chat-not-exist"))
        conn.close()
    }
}

async function sendChatHistory(conn, chatId) {
    const chatHistory = await MessageService.getChatMessageList(chatId)
    sendMessage(conn, WS_MESSAGE_TYPE.HISTORY, chatHistory)
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