const User = require("../model/UserModel"),
    ServiceError = require("../../utils/ServiceError"),
    bcrypt = require("bcrypt"),
    jwt = require("jsonwebtoken")


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
        }).then((user) => {
            return  jwt.sign({ id: user.dataValues.id }, process.env.JWT_SECRET, { expiresIn: "1d" })
        }).catch(err => {
            // consider DbError with notNull violation
            throw new ServiceError(400, err)
        })
    },
    loginUser: async ({ email, password }) => {
        const user = await User.findOne({ where: { email }})

        if (!user) {
            throw new ServiceError(400, "password-or-email-incorrect")
        }

        const isPasswordValid = await bcrypt.compare(password, user.dataValues.encryptedPassword)

        if (!isPasswordValid) {
            throw new ServiceError(400, "password-or-email-incorrect")
        }

        return jwt.sign({ id: user.dataValues.id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    },
    getUser: async (id) => {
        const dbUser =  await User.findByPk(id)

        const user = dbUser.dataValues
        delete user.encryptedPassword

        return {
            ...user,
            isOwner: true
        }
    },

    isEmailUnique: async function(email) {
        return !(await User.findOne({ where: { email } }))
    }
}

module.exports = UserService