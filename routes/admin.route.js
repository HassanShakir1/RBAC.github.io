const router = require("express").Router();
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { roles } = require("../utils/constants");

router.get("/user", async (req, res, next) => {
  try {
    const users = await User.find();
    res.render("manage-users", { users });
  } catch (error) {
    next(error);
  }
});

router.get("/user/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid id");
      res.redirect("/admin/user");
      return;
    }
    const person = await User.findById(id);
    res.render("profile", { person });
  } catch (error) {
    next(error);
  }
});

router.post("/update-role", async (req, res, next) => {
  const { id, role } = req.body;
  if (!id || !role) {
    req.flash("error", "Invalid Req");
    return res.redirect("back");
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Invalid Id");
    return res.redirect("back");
  }
  const rolesArray = Object.values(roles);
  if (!rolesArray.includes(role)) {
    req.flash("error", "Invalid Role");
    return res.redirect("back");
  }
  if (req.user.id === id) {
    req.flash(
      "error",
      "Admin cannot remove themselves from admin , ask another admnin"
    );
    return res.redirect("back");
  }
  const user = await User.findByIdAndUpdate(
    id,
    { role: role },
    { new: true, runValidators: true }
  );
  req.flash("info", ` Updated role for ${user.email} to ${user.role}`);
  res.redirect("back");
});

module.exports = router;
