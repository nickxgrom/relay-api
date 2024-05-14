const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    UserService = require("../services/UserService"),
    EmployeeService = require("../services/EmployeeService"),
    jsonwebtoken = require("jsonwebtoken")

router.post("/users", catchError(async (req, res, next) => {
    const { firstName, lastName, patronymic, email, password } = req.body

    const token = await UserService.createNewUser({firstName, lastName, patronymic, email, password})

    res.cookie("relay-token", token, {})

    // TODO: send email for verification

    res.status(200).send()
}))

router.post("/login", catchError(async (req, res, next) => {
    const { email, password } = req.body

    const token = await UserService.loginUser({ email, password })

    res.cookie("relay-token", token, {})

    res.status(200).send()
}))

router.get("/users", catchError(async (req, res, next) => {
    try {
        const data = await jsonwebtoken.verify(req.cookies?.["relay-token"], process.env.JWT_SECRET)
        if (data.id) {
            res.status(200).send(await UserService.getUser(data.id))
        } else {
            res.status(200).send(await EmployeeService.getEmployee(data.employeeId))
        }
    } catch {
        res.sendStatus(401)
    }
}) )

module.exports = router