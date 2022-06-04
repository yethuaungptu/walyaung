var express = require("express");
var router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "public/images/uploads/profile" });
const Agents = require("../models/Agents");
const location = require("./location");

/* GET home page. */
router.get("/", function (req, res, next) {
  const regions = JSON.stringify(location.getAllLocations());
  res.render("index", { title: "Express", regions: regions });
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", upload.single("photo"), (req, res) => {
  const agent = new Agents();
  agent.name = req.body.name;
  agent.email = req.body.email;
  agent.password = req.body.password;
  agent.role = req.body.role;
  agent.description = req.body.desc;
  agent.address = req.body.address;
  agent.phone = req.body.phone;
  if (req.file) agent.imgUrl = "/images/uploads/profile/" + req.file.filename;
  agent.save((err, rtn) => {
    if (err) {
      console.log("error", err);
      res.json({
        status: false,
      });
    } else {
      console.log(rtn);
      res.json({
        status: true,
      });
    }
  });
});

router.post("/signin", (req, res) => {
  Agents.findOne({ email: req.body.email }, (err, rtn) => {
    if (err) throw err;
    console.log(req.body.password, rtn);
    if (rtn != null && Agents.compare(req.body.password, rtn.password)) {
      res.redirect("/");
    } else {
      res.redirect("/register");
    }
  });
});

module.exports = router;
