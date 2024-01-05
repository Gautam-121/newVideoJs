const QuestionAnswerModel = require("../model/questionAnswerSchema.js");

const questionAnswerStore = async (req, res, next) => {
  try {
    const { userId, data } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId is Missing",
      });
    }
    const questionAnswer = await QuestionAnswerModel.create({
      userId: userId,
      data: data,
    });

    return res.status(200).json({
      success: true,
      message: "Data Created Successfully",
      data: questionAnswer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

module.exports = { questionAnswerStore };
