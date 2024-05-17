const {WebSocketServer} = require("ws"),
    jsonwebtoken = require("jsonwebtoken"),
    ChatService = require("../services/ChatService"),
    MessageService = require("../services/MessageService"),
    {SENDER, WS_MESSAGE_TYPE} = require("../consts"),
    ServiceError = require("../../utils/ServiceError")

const clients = new Map()
const organizationMap = new Map()
const operators = new Map()

function startChatListWSServer(PORT) {
    const wss = new WebSocketServer({ port: PORT })

    wss.on("connection", async function connection(ws, req) {
        const params = new URLSearchParams(req.url.slice(1))
        const query = {}
        for (const [key, value] of params) {
            query[key] = value
        }

        const token = query["relay-token"]

        try {
            const data = jsonwebtoken.verify(token, process.env.JWT_SECRET)

            if (data.employeeId && data.organizationId) {
                if (operators.has(data.organizationId)) {
                    operators.get(data.organizationId).set(data.employeeId, ws)
                } else {
                    operators.set(data.organizationId, new Map([[data.employeeId, ws]]))
                }
            } else {
                sendMessage(ws, WS_MESSAGE_TYPE.ERROR, new ServiceError(404, "unknown-sender"))
                ws.close()
            }
        } catch (err) {
            sendMessage(ws, WS_MESSAGE_TYPE.ERROR, new ServiceError(401, "token-expired"))
            ws.close()
        }
        ws.send(JSON.stringify(await Promise.all(Array.from(clients.keys()).map(async key => ({
            key,
            lastMessage: (await MessageService.getChatMessageList(key))?.pop()
        })))))
    })

    wss.on("listening", () => {
        console.log(`Websocket chat list is listening on ws://${PORT}`)
    })

    wss.on("close", function close() {
        operators.forEach((value, key) => {
            value.forEach((wsValue, wsKey) => {
                if (wsValue.readyState === 3) {
                    value.delete(wsKey)
                }
            })

            if (value.size === 0) {
                operators.delete(key)
            }
        })
    })
}

function startWSServer(PORT) {
    const wss = new WebSocketServer({ port: PORT })

    wss.on("connection", async function connection(ws, req) {
        const {sender, chatId, employeeId, organizationId} = await identifyConnection(ws, req) ?? {}

        if (!chatId) return

        await sendChatHistory(ws, chatId)

        ws.on("error", console.error)

        ws.on("message", async function message(data) {
            const msg = Buffer.from(data).toString("utf8")

            const dbMessage = await MessageService.saveMessage(chatId, {text: msg, sender, employeeId}).catch(err => {
                sendMessage(ws, WS_MESSAGE_TYPE.ERROR, new ServiceError(500, "message-not-saved", err.error))
            })

            if (sender === SENDER.OPERATOR) {
                if (clients.has(chatId)) {
                    const client = clients.get(chatId)

                    sendMessage(client, WS_MESSAGE_TYPE.MESSAGE, dbMessage)
                }
            } else if (sender === SENDER.CLIENT) {
                // need a filtration by isActive and time
                const org = operators.get(organizationId)

                org?.forEach((employee) => {
                    employee.send(JSON.stringify([{key: chatId, lastMessage: dbMessage }]))
                })


                if (organizationMap.has(organizationId)) {
                    const org = organizationMap.get(organizationId)
                    if (org.has(chatId)) {
                        const operator = org.get(chatId)
                        sendMessage(operator, WS_MESSAGE_TYPE.MESSAGE, dbMessage)
                    }
                }
            }
        })


        ws.on("close", function close(conn) {

            clients.forEach((value, key) => {
                console.log(key)
                if (value === conn) {
                    clients.delete(key)
                }
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
            const {organizationId, chatId} = await handleClientConnection(conn, data)
            return {sender: SENDER.CLIENT, chatId, organizationId}
        } else if (data.employeeId) {
            const chatId = await handleOperatorConnection(conn, _getQuery(req.url), data)
            return {sender: SENDER.OPERATOR, chatId, employeeId: data.employeeId, organizationId: data.organizationId }
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
            if (organizationMap.has(data.organizationId)) {
                const org = organizationMap.get(data.organizationId)
                if (!org.has(query.chatId)) {
                    org.set(query.chatId, conn)
                }
            } else {
                organizationMap.set(data.organizationId, new Map([[query.chatId, conn]]))
            }

            return query.chatId
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
            return { organizationId: data.organizationId, chatId: data.chatId }
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

module.exports = {startWSServer, startChatListWSServer}