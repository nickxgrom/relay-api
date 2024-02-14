const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    service = require("./OrganizationService")

router.post("/organization", catchError(async (req, res, next) => {
    const organizationData = req.body

    const result = await service.createOrganization({...organizationData, ownerId: req.user.id})

    res.status(200).send(result)
}))

module.exports = router