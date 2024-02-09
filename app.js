const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const connectFlash = require("connect-flash");
const passport = require("passport");
const connectMongo = require("connect-mongo");
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

const MongoStore = connectMongo(session);

app.use(
  session({
    secret: process.env.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure:true uncomment for https server only
      httpOnly: true,
    },
    store: new MongoStore({ mongooseConnection: mongoose.Connection }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./utils/passport.auth");

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.messages = req.flash;
  next();
});

app.use("/", router);
app.use("/auth", router2);
app.use("/user", ensureAuthenticated, router3);

app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((error, req, res, next) => {
  error.status = error.status || 500;
  res.status(error.status);
  res.render("error_40x.ejs", { error });
});

mongoose.connect(databaseURL);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "database  connection error"));
db.once("open", () => {
  console.log("database connected succesfully");
});

app.listen(port, () => {
  console.log(`server is listining on port ${9000}`);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/auth/login");
  }
}
