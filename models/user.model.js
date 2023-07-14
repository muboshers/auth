const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    is_verify: {
      type: Boolean,
      default: false,
    },
  },
  {
    timeStamp: true,
  }
);

const userModel = mongoose.model("testuser", userSchema);

module.exports = userModel;
