const SENDER = {
    SYSTEM: 0,
    OPERATOR: 1,
    CLIENT: 2
}

const WS_MESSAGE_TYPE = {
    ERROR: "error",
    MESSAGE: "message",
    HISTORY: "history"
}

module.exports = {
    SENDER,
    WS_MESSAGE_TYPE,
}