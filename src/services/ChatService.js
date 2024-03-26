const ChatModel = require("../model/ChatModel"),
    ServiceError = require("../../utils/ServiceError")

const ChatService = {
    createChat: async (orgId) => {
        return ChatModel.create({organizationId: orgId})
            .then(res => res)
            .catch(err => {
                throw new ServiceError(500, "internal-server-error", err)
            })
    },
    getChat: async (chatId, orgId) => {
        const chat = await ChatModel.findOne({ where: { id: chatId, organizationId: orgId } })

        if (!chat) {
            throw new ServiceError(404, "chat-not-found")
        } else
            return chat

    },
    archiveChat: async () => {

    }
}

module.exports = ChatService