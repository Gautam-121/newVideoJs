const {PASSWORD_REGEX,EMAIL_REGEX} = require("../constants.js")


const isValidEmail = email => EMAIL_REGEX.test(email)

const isValidPassword = password => PASSWORD_REGEX.test(password)

const isValiLengthName = name => name.length>4

module.exports = {
    isValidEmail,
    isValidPassword,
    isValiLengthName
}