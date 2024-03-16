const MessageModel = require("../model/MessageModel")
const ServiceError = require("../../utils/ServiceError")

const MessageService = {
    saveMessage: (chatId, {text, sender}) => {
        return MessageModel.create({
            chatId,
            text,
            sender
        })
            .then(newMessage => {
                return newMessage
            }).catch(err => {
                throw new ServiceError(500, "internal-server-error", err)
            })
    },
    getChatMessageList: chatId => {
        return MessageModel.findAll({ where: { chatId: chatId } })
            .then(messages => {
                return messages.map(message => {
                    return {
                        id: message.id,
                        sender: message.sender,
                        text: message.text,
                        createdAt: message.createdAt
                    }
                })
            })
            .catch(err => {
                throw new ServiceError(500, "internal-server-error", err)
            })
    }
}

module.exports = MessageService