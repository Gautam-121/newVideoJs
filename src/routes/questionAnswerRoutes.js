const express = require("express");
const router = express.Router();
const {questionAnswerStore} = require("../controller/questionAnswerController.js")

router.route("/queAnsCreate").post(questionAnswerStore)

module.exports = router;