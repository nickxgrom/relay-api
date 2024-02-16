const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    EmployeeService = require("../services/EmployeeService")
const ServiceError = require("../../utils/ServiceError")

router.post("/employee-registration", catchError(async (req, res, next) => {
    const { name, email, password } = req.body
    let orgId = req.query.organizationId

    orgId = Number(orgId)

    if (isNaN(orgId)) {
        throw new ServiceError(400, "invalid-organization-id")
    }

    await EmployeeService.createEmployee({name, email, password}, orgId)

    res.status(200).send()
}))

module.exports = router