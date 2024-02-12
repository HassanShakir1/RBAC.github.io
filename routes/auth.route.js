const router = require("express").Router();
const User = require("../models/user.model");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

router.get("/login", ensureNotAuthenticated, async (req, res, next) => {
  const messages = req.flash();

  res.render("login", { messages });
});
router.post(
  "/login",
  ensureNotAuthenticated,
  passport.authenticate("local", {
    // successRedirect: "/",
    successReturnToOrRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })
);

router.get("/register", ensureNotAuthenticated, async (req, res, next) => {
  res.render("register");
});
router.post(
  "/register",
  ensureNotAuthenticated,
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email")
      .normalizeEmail()
      .isLowercase(),
    body("password").trim().isLength(8).withMessage("Password must be 8 digit"),
    body("password2").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password do not match");
      }
      return true;
    }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach((error) => {
          req.flash("error", error.msg);
        });
        res.render("register", {
          email: req.body.email,
          messages: req.flash(),
        });
        return;
      }
      const { email } = req.body;
      const doesexist = await User.findOne({ email });
      if (doesexist) {
        res.redirect("/auth/register");
        return;
      }
      const user = new User(req.body);
      await user.save();
      req.flash("success", `${email} registered successfully`);
      res.redirect("/auth/login");
      // res.send(req.body);
    } catch (error) {
      next(error);
    }
  }
);
router.get("/logout", ensureAuthenticated, async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
module.exports = router;

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/auth/login");
  }
}

function ensureNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("back");
  } else {
    next();
  }
}
