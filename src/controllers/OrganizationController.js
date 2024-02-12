const router = require("express").Router(),
    catchError = require("../../utils/catchError")

router.post("/organization", catchError(async (req, res, next) => {
    res.status(200).send("todo: create organization")
}))

module.exports = router