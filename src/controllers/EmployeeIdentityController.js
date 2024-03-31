const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    EmployeeService = require("../services/EmployeeService")

router.post("/employee-registration", catchError(async (req, res, next) => {
    const { name, email, password } = req.body
    let orgId = req.query.organizationId

    await EmployeeService.createEmployee({name, email, password}, orgId)

    res.status(200).send()
}))

router.post("/employee-login/:id", catchError(async (req, res, next) => {
    const { email, password } = req.body
    const organizationId = req.params.id

    const token = await EmployeeService.loginEmployee({email, password, organizationId})

    res.cookie("relay-token", token, { httpOnly: true })
    res.status(200).send()
}))

router.get("/organization-name/:orgId", catchError(async (req, res, next) => {
    // TODO: consider about open only this method and move this to OrganizationService
    res.status(200).send(await EmployeeService.getOrganizationName(req.params.orgId))
}))

module.exports = router