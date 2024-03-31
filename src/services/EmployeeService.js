const bcrypt = require("bcrypt")
const jsonwebtoken = require("jsonwebtoken")
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

        if (!name?.length) {
            throw new ServiceError(400, "name-is-required")
        }

        if (!EMAIL_REGEX.test(email)) {
            throw new ServiceError(400, "incorrect-email")
        }

        const existingEmployee = await Employee.findOne({ where: { email } })
        if (existingEmployee) {
            throw new ServiceError(400, "email-taken")
        }
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            throw new ServiceError(400, "password-requires-six-character")
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
    getEmployee: async (uuid) => {
        return await Employee.findByPk(uuid)
    },

    loginEmployee: async ({ email, password, organizationId }) => {
        const employee = await Employee.findOne({ where: { email, organizationId } })

        if (!employee) {
            throw new ServiceError(401, "employee-not-found")
        }

        const isPasswordCorrect = await bcrypt.compare(password, employee.encryptedPassword)

        if (!isPasswordCorrect) {
            throw new ServiceError(401, "incorrect-password")
        }

        if (!employee.verified) {
            throw new ServiceError(403, "employee-is-not-verified")
        }

        const token = jsonwebtoken.sign({ employeeId: employee.id, organizationId }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        })

        return token
    },
    getOrganizationName: async (orgId) => {
        const regex = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/i
        if (!regex.test(orgId)) {
            throw new ServiceError(400, "invalid-organization-id")
        }

        return { name: (await Organization.findByPk(orgId))?.name }
    }

}

module.exports = EmployeeService