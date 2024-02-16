const bcrypt = require("bcrypt")
const Employee = require("../model/EmployeeModel.js")
const Organization = require("../model/OrganizationModel.js")
const ServiceError = require("../../utils/ServiceError")

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
    MIN_PASSWORD_LENGTH = 6

const EmployeeService = {
    createEmployee: async ({ name, email, password }, organizationId) => {
        const organization = await Organization.findByPk(organizationId)
        if (!organization) {
            throw new ServiceError(400, "organization-not-found")
        }

        if (!EMAIL_REGEX.test(email)) {
            throw new ServiceError(400, "incorrect-email")
        }

        const existingEmployee = await Employee.findOne({ where: { email, organizationId } })
        if (existingEmployee) {
            throw new ServiceError(400, "email-taken")
        }
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            throw new ServiceError(400, "incorrect-password")
        }

        const encryptedPassword = await bcrypt.hash(password, 10)
        const newEmployee = await Employee.create({
            name,
            email,
            encryptedPassword
        })

        await newEmployee.setOrganization(organization)

        return newEmployee
    },
}

module.exports = EmployeeService