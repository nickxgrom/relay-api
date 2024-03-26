const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    UserService = require("../services/UserService")

router.post("/users", catchError(async (req, res, next) => {
    const { firstName, lastName, patronymic, email, password } = req.body

    const token = await UserService.createNewUser({firstName, lastName, patronymic, email, password})

    res.cookie("relay-token", token, { httpOnly: true })

    // TODO: send email for verification

    res.status(200).send()
}))

router.post("/login", catchError(async (req, res, next) => {
    const { email, password } = req.body

    const token = await UserService.loginUser({ email, password })

    res.cookie("relay-token", token, { httpOnly: true })

    res.status(200).send()
}))

module.exports = router