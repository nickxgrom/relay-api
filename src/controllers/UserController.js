const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    UserService = require("../services/UserService")

router.post("/users", catchError(async (req, res, next) => {
    const { firstName, lastName, patronymic, email, password } = req.body

    const user = await UserService.createNewUser({firstName, lastName, patronymic, email, password})
    // TODO: send email for verification

    res.status(200).send(user)

}))

module.exports = router