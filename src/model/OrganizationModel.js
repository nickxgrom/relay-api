const db = require("../../utils/db"),
    {DataTypes} = require("sequelize")

const User = require("./UserModel")

const Organization = db.define("organization", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    owner: {
        type: DataTypes.BIGINT,
        references: {
            model: User,
            key: "id",
        }
    },
})

User.hasMany(Organization, {as: "Organizations", foreignKey: "owner"})
Organization.belongsTo(User, {as: "Owner", foreignKey: "owner"})

module.exports = Organization