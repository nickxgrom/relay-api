const ChatModel = require("../model/ChatModel"),
    ServiceError = require("../../utils/ServiceError")

const ChatService = {
    createChat: async (orgId) => {
        return ChatModel.create({organizationId: orgId})
            .then(res => res)
            .catch(err => {
                throw new ServiceError(500, err)
            })
    },
    getChat: async () => {

    },
    archiveChat: async () => {

    }
}

module.exports = ChatService