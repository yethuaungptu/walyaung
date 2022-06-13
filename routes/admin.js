var express = require("express");
var router = express.Router();
var Admin = require("../models/Admin");

const auth = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login"); // redirect to other page
  }
};

/* GET users listing. */
router.get("/", auth, function (req, res, next) {
  res.render("admin/index");
});

router.get("/register", (req, res) => {
  res.render("admin/register");
});

router.post("/register", (req, res) => {
  if (req.body.recode == "sm2022") {
    var admin = new Admin();
    admin.name = req.body.name;
    admin.email = req.body.email;
    admin.password = req.body.password;
    admin.save((err, rtn) => {
      if (err) throw err;
      res.redirect("/admin/login");
    });
  } else {
    res.redirect("/admin/register");
  }
});

router.get("/login", (req, res) => {
  res.render("admin/login");
});

router.post("/login", (req, res) => {
  Admin.findOne({ email: req.body.email }, (err, rtn) => {
    if (err) throw err;
    if (rtn != null && Admin.compare(req.body.password, rtn.password)) {
      req.session.admin = {
        name: rtn.name,
        email: rtn.email,
        id: rtn._id,
      };
      res.redirect("/admin");
    } else {
      res.redirect("/admin/login");
    }
  });
});

router.get("/logout", auth, (req, res) => {
  req.session.destroy((err, data) => {
    if (err) throw err;
    res.redirect("/admin");
  });
});

module.exports = router;
