const { DataTypes } = require("sequelize")
const sequelize = require("../../utils/db")
const ChatModel = require("./ChatModel")

const MessageModel = sequelize.define("message", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    text: {
        type: DataTypes.STRING,
    },
    sender: {
        type: DataTypes.INTEGER,
        isIn: [[0, 1, 2]],
        allowNull: false
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
})

MessageModel.belongsTo(ChatModel, {
    foreignKey: "chatId"
})

module.exports = MessageModel