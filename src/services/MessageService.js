const MessageModel = require("../model/MessageModel")
const ServiceError = require("../../utils/ServiceError")
const EmployeeService = require("./EmployeeService")

const MessageService = {
    saveMessage: (chatId, {text, sender, employeeId}) => {
        return MessageModel.create({
            chatId,
            text,
            sender,
            senderId: employeeId
        })
            .then(newMessage => {
                return newMessage
            }).catch(err => {
                throw new ServiceError(500, "internal-server-error", err)
            })
    },
    getChatMessageList: chatId => {
        return MessageModel.findAll({ where: { chatId: chatId } })
            .then(async messages => {
                return await Promise.all(messages.map(async message => {
                    if (message.senderId) {
                        const operator = await EmployeeService.getEmployee(message.senderId)

                        message.operator = {
                            name: operator.name,
                            email: operator.email
                        }
                    }

                    return {
                        id: message.id,
                        sender: message.sender,
                        text: message.text,
                        createdAt: message.createdAt,
                        operator: message.operator
                    }
                }))
            })
            .catch(err => {
                throw new ServiceError(500, "internal-server-error", err)
            })
    }
}

module.exports = MessageService