const Joi = require("joi");

const authSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string()
    .lowercase()
    .required()
    .min(3)
    .max(50)
    .label("Please enter a valid name"),
  username: Joi.string()
    .email()
    .lowercase()
    .required()
    .label("Please enter a valid email"),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
    .required()
    .label("Please enter a valid password"),
  phoneNumber: Joi.string()
    .length(10)
    .required()
    .pattern(/^[0-9]+$/)
    .label("Please enter a valid mobile number"),
});

module.exports = {
  authSchema,
};
