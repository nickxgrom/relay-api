const OrganizationModel = require("../model/OrganizationModel"),
    UserModel = require("../model/UserModel"), // Assuming you have User model
    ServiceError = require("../../utils/ServiceError")

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/

const OrganizationService = {
    createOrganization: async ({ name, email, description, address, ownerId }) => {
        if (!EMAIL_REGEX.test(email)) {
            throw new ServiceError(400, "incorrect-email")
        }

        const existingOrganization = await OrganizationModel.findOne({ where: { email } })

        if (existingOrganization) {
            throw new ServiceError(400, "email-taken")
        }

        return OrganizationModel.create({
            name,
            email,
            description,
            address,
            owner: ownerId,
        }).then(organization => {
            return organization.dataValues
        }).catch(err => {
            throw new ServiceError(500, err)
        })
    }

}

module.exports = OrganizationService