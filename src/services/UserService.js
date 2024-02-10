const User = require("../model/UserModel"),
    ServiceError = require("../../utils/ServiceError"),
    bcrypt = require("bcrypt")

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
    MIN_PASSWORD_LENGTH = 6

const UserService = {
    createNewUser: async ({ firstName, lastName, patronymic, email, password }) => {
        if (!EMAIL_REGEX.test(email)) {
            throw new ServiceError(400, "incorrect-email")
        }

        if ((password?.length ?? 0) < MIN_PASSWORD_LENGTH) {
            throw new ServiceError(400, "password-requires-six-character")
        }

        if (!await UserService.isEmailUnique(email)) throw new ServiceError(409, "email-taken")

        let hash
        try {
            hash = await bcrypt.hash(password, 8)
        } catch(err) {
            throw new ServiceError(500, "internal-server-error")
        }

        return User.create({
            firstName,
            lastName,
            patronymic,
            email,
            encryptedPassword: hash,
            verified: false
        }).then(user => {
            delete user.dataValues.encryptedPassword
            return user.dataValues
        }).catch(err => {
            // consider DbError with notNull violation
            throw new ServiceError(400, err)
        })
    },

    isEmailUnique: async function(email) {
        return !(await User.findOne({ where: { email } }))
    }
}

module.exports = UserService