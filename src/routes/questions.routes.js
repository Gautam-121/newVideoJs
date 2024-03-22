const express = require("express");
const router = express.Router();
const {questionAnswerStore} = require("../controllers/question.controller.js")

router.route("/queAnsCreate").post(questionAnswerStore)

module.exports = router;