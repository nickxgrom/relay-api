const { DataTypes } = require("sequelize")
const sequelize = require("../../utils/db")
const OrganizationModel = require("./OrganizationModel")

const ChatModel = sequelize.define("chat", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    archived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: false
    }
})

ChatModel.belongsTo(OrganizationModel, { foreignKey: "organizationId" })

module.exports = ChatModel

