const db = require("../../utils/db"),
    {DataTypes} = require("sequelize")

const User = db.define("user", {
    id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    patronymic: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    encryptedPassword: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        default: false
    },
}, {
    toJSON: {
        getters: true,
        setters: false,
        exclude: ["encryptedPassword"]
    }
})

module.exports = User