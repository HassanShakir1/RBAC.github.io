const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const connectFlash = require("connect-flash");
const connectEnsureLogIn = require("connect-ensure-login");
const passport = require("passport");
const { roles } = require("./utils/constants");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static("public"));
const port = 9000;
const databaseURL = process.env.database_URL;
app.use(morgan("dev"));
const router = require("./routes/index.route");
const router2 = require("./routes/auth.route");
const router3 = require("./routes/user.route");
const router4 = require("./routes/admin.route");

// Establish MongoDB connection
mongoose.connect(databaseURL, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "database connection error"));
db.once("open", () => {
  console.log("database connected successfully");

  // Set up session
  app.use(
    session({
      secret: process.env.session_secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
      },
    })
  );

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());
  require("./utils/passport.auth");

  // Middleware to make user object available in views
  app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });

  // Middleware for flash messages
  app.use(connectFlash());
  app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
  });

  // Routes
  app.use("/", router);
  app.use("/auth", router2);
  app.use(
    "/user",
    connectEnsureLogIn.ensureLoggedIn({ redirectTo: "/auth/login" }),
    router3
  );
  app.use(
    "/admin",
    connectEnsureLogIn.ensureLoggedIn({ redirectTo: "/auth/login" }),
    ensureADmin,
    router4
  );

  // 404 Error handler
  app.use((req, res, next) => {
    next(createError.NotFound());
  });

  // General error handler
  app.use((error, req, res, next) => {
    error.status = error.status || 500;
    res.status(error.status);
    res.render("error_40x.ejs", { error });
  });

  // Start server
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
});

// Authentication middleware
// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     res.redirect("/auth/login");
//   }
// }

function ensureADmin(req, res, next) {
  if (req.user.role === roles.admin) {
    next();
  } else {
    req.flash("warning", "Only Admin can access");
    res.redirect("/");
  }
}
