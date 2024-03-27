const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    service = require("../services/ChatService"),
    jsonwebtoken = require("jsonwebtoken"),
    ServiceError = require("../../utils/ServiceError")

router.post("/chat/:orgId", catchError(async (req, res, next) => {
    if (req.params.orgId === "undefined") {
        throw new ServiceError(400, "wrong-organization-id")
    }

    const chat = await service.createChat(req.params.orgId)

    const token = jsonwebtoken.sign({ chatId: chat.id, organizationId: chat.organizationId }, process.env.JWT_SECRET, {
        expiresIn: "6h",
    })

    res.status(200).send({...chat.dataValues, token})
}))

module.exports = router
