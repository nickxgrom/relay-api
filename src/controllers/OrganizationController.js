const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    service = require("../services/OrganizationService")
const ServiceError = require("../../utils/ServiceError")

router.post("/organization", catchError(async (req, res, next) => {
    const organizationData = req.body

    const result = await service.createOrganization({...organizationData, ownerId: req.user.id})

    res.status(200).send(result)
}))


router.put("/organization/:id", catchError(async (req, res, next) => {
    const organizationData = req.body
    const orgId = req.params.id
    const ownerId = req.user.id

    const result = await service.updateOrganization({id: orgId, ...organizationData, ownerId})

    res.status(200).send(result)
}))

router.get("/organization/:id", catchError(async (req, res, next) => {
    const orgId = req.params.id

    res.status(200).send(await service.findOrganization(orgId, req.user.id))
}))

router.get("/organizations", catchError(async (req, res, next) => {
    res.status(200).send(await service.findAllOrganizations(req.user.id))
}))

router.delete("/organization/:id", catchError(async (req, res, next) => {
    const orgId = req.params.id

    await service.deleteOrganization(orgId, req.user.id)

    res.status(200).send()
}))

router.get("/organization/employees/:id", catchError(async (req, res, next) => {
    const orgId = req.params.id

    const employees = await service.getAllEmployees(orgId, req.user.id)

    res.status(200).send(employees)
}))

router.get("/organization/employees/:orgId/:employeeId", catchError(async (req, res, next) => {
    const orgId = req.params.orgId
    let employeeId = req.params.employeeId

    employeeId = Number(employeeId)

    if (isNaN(employeeId)) {
        throw new ServiceError(400, "invalid-employee-id")
    }

    res.status(200).send(await service.getEmployeeById(employeeId, orgId, req.user.id))
}))

router.put("/organization/employees/:orgId/:employeeId", catchError(async (req, res, next) => {
    const orgId = req.params.orgId
    let employeeId = req.params.employeeId

    employeeId = Number(employeeId)

    if (isNaN(employeeId)) {
        throw new ServiceError(400, "invalid-employee-id")
    }

    res.status(200).send(await service.updateEmployee(employeeId, orgId, req.user.id, req.body))
}))

router.delete("/organization/employees/:orgId/:employeeId", catchError(async (req, res, next) => {
    const orgId = req.params.orgId
    let employeeId = req.params.employeeId

    employeeId = Number(employeeId)

    if (isNaN(employeeId)) {
        throw new ServiceError(400, "invalid-employee-id")
    }

    await service.deleteEmployee(employeeId, orgId, req.user.id)

    res.status(200).send()
}))

module.exports = router
