const Questions = require("../models/questions.models.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ErrorHandler = require("../utils/errorHandler.js");

const questionAnswerStore = asyncHandler(async (req, res, next) => {
  
  const { userId, data } = req.body;

  if (!userId) {
    return next(
      new ErrorHandler("UserId is Missing",400)
    )
  }

  const questionAnswer = await Questions.create({
    userId: userId,
    data: data,
  });

  return res.status(200).json({
    success: true,
    message: "Data Created Successfully",
    data: questionAnswer,
  });
})


module.exports = { questionAnswerStore };
