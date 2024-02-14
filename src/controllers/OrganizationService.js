const OrganizationModel = require("../model/OrganizationModel"),
    UserModel = require("../model/UserModel"), // Assuming you have User model
    ServiceError = require("../../utils/ServiceError")

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/

const OrganizationService = {
    createOrganization: async ({ name, email, description, address, ownerId }) => {
        if (!EMAIL_REGEX.test(email)) {
            throw new ServiceError(400, "incorrect-email")
        }

        const user = await UserModel.findByPk(ownerId)

        if (!user) {
            throw new ServiceError(401, "user-not-found")
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
    },

    findOrganization: async (id, ownerId) => {
        const organization = await OrganizationModel.findOne({ where: {id, owner: ownerId} })

        if (!organization) {
            throw new ServiceError(404, "organization-not-found")
        }

        return organization
    },

    findAllOrganizations: ownerId => {
        return OrganizationModel.findAll({ where: {owner: ownerId} })
            .then(organizations => organizations)
            .catch(err => {
                throw new ServiceError(500, err)
            })
    },

    updateOrganization: async ({ id, name, email, description, address, ownerId }) => {
        let organization = await OrganizationModel.findOne({ where: {id, owner: ownerId} })

        if (!organization) {
            throw new ServiceError(404, "organization-not-found")
        }

        if (email) {
            if (!EMAIL_REGEX.test(email)) {
                throw new ServiceError(400, "incorrect-email")
            }

            const existingOrganization = await OrganizationModel.findOne({ where: { email } })

            if (existingOrganization && +existingOrganization.id !== id) {
                throw new ServiceError(400, "email-taken")
            }
        }

        return OrganizationModel.update({
            name: name || organization.name,
            email: email || organization.email,
            description: description || organization.description,
            address: address || organization.address,
        }, {
            where: { id: organization.id }
        }).then(() => {
            return OrganizationModel.findByPk(id)
        }).catch(err => {
            throw new ServiceError(500, err)
        })
    },
    deleteOrganization: async (id, ownerId) => {
        const organization = await OrganizationModel.findOne({ where: {id, owner: ownerId} })

        if (!organization) {
            throw new ServiceError(404, "organization-not-found")
        }

        return OrganizationModel.destroy({ where: { id } })
            .catch(err => {
                throw new ServiceError(500, err)
            })
    }
}

module.exports = OrganizationService