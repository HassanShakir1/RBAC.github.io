const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");
const createError = require("http-errors");
const { roles } = require("../utils/constants");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    enum: [roles.admin, roles.moderator, roles.client],
    default: roles.client,
  },
});
UserSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }
    if (this.email === process.env.Admin_Email.toLocaleLowerCase()) {
      this.role = roles.admin;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("user", UserSchema);
module.exports = User;
