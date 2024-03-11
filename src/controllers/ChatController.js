const router = require("express").Router(),
    catchError = require("../../utils/catchError"),
    service = require("../services/ChatService")
const jsonwebtoken = require("jsonwebtoken")

router.post("/chat/:orgId", catchError(async (req, res, next) => {
    const chat = await service.createChat(req.params.orgId)

    // возможно стоит зашить и orgId
    const token = jsonwebtoken.sign({ chatId: chat.id }, process.env.JWT_SECRET, {
        expiresIn: "6h",
    })

    res.cookie("token", token, { httpOnly: true })
    res.status(200).send(chat)
}))

module.exports = router
