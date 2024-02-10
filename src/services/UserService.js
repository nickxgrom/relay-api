const User = require("../model/UserModel"),
    ServiceError = require("../../utils/ServiceError"),
    bcrypt = require("bcrypt")

const UserService = {
    createNewUser: async ({ firstName, lastName, patronymic, email, password }) => {
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            throw new ServiceError(400, "incorrect-email")
        }

        if (!await UserService.isEmailUnique(email)) throw new ServiceError(409, "email-taken")

        let hash
        try {
            hash = await bcrypt.hash(password, 8)
        } catch(err) {
            throw new ServiceError(500, "internal-server-error")
        }

        try {
            const user = await User.create({
                firstName,
                lastName,
                patronymic,
                email,
                encryptedPassword: hash,
                verified: false
            })

            delete user.dataValues.encryptedPassword

            return user.dataValues
        } catch (err) {
            throw new ServiceError(400, err)
        }
    },

    isEmailUnique: async function(email) {
        return !(await User.findOne({ where: { email } }))
    }
}

module.exports = UserService