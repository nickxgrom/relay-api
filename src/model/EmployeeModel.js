const { DataTypes } = require("sequelize")
const sequelize = require("../../utils/db")
const OrganizationModel = require("./OrganizationModel")

const EmployeeModel = sequelize.define("employee", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    encryptedPassword: {
        type: DataTypes.STRING,
        allowNull: false
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
    }
})

EmployeeModel.belongsTo(OrganizationModel)

module.exports = EmployeeModel