const mongoose = require("mongoose");

const { Schema } = mongoose;

const otpVerificationSchema = Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "testuser",
  },
  code: String,
});

const otpVerificationModel = mongoose.model(
  "testotpverification",
  otpVerificationSchema
);

module.exports = otpVerificationModel;
