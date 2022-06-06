var express = require("express");
var router = express.Router();
const multer = require("multer");
const path = require("path");
const upload = multer({ dest: "public/images/uploads/profile" });
const Agents = require("../models/Agents");
const Property = require("../models/Property");
const location = require("./location");
const property_upload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/propertyuploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

const propertyUpload = multer({ storage: property_upload });
const ppUpload = propertyUpload.fields([
  { name: "photo", maxCount: 4 },
  { name: "profile", maxCount: 1 },
]);
const auth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/register"); // redirect to other page
  }
};

/* GET home page. */
router.get("/", function (req, res, next) {
  const regions = JSON.stringify(location.getAllLocations());
  Property.find({})
    .select("_id name description profile area price bathRoom bedRoom")
    .exec((err, rtn) => {
      if (err) throw err;
      res.render("index", {
        title: "Express",
        regions: regions,
        properties: rtn,
      });
    });
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
      req.session.user = {
        id: rtn._id,
        name: rtn.name,
        email: rtn.email,
        role: rtn.role,
        profile: rtn.imgUrl,
        phone: rtn.phone,
      };
      res.redirect("/");
    } else {
      res.redirect("/register");
    }
  });
});

router.get("/submit_property", auth, (req, res) => {
  const regions = JSON.stringify(location.getAllLocations());
  res.render("property-submit", { regions: regions });
});

router.post("/submit_property", auth, ppUpload, (req, res) => {
  const property = new Property();
  property.name = req.body.name;
  property.price = req.body.price;
  property.phone = req.body.phone;
  property.description = req.body.description;
  property.address = req.body.address;
  if (req.body.subscription) property.subscription = req.body.subscription;
  property.status = req.body.pstatus;
  property.state = req.body.state;
  property.city = req.body.city;
  property.agentId = req.session.user.id;
  property.area = req.body.area;
  property.bedRoom = req.body.bedRoom;
  property.bathRoom = req.body.bathRoom;
  let gallery = [];
  for (let i = 0; i < req.files.photo.length; i++) {
    gallery.push("/images/propertyuploads/" + req.files.photo[i].filename);
  }
  if (req.files.profile[0].filename)
    property.profile =
      "/images/propertyuploads/" + req.files.profile[0].filename;
  property.gallery = gallery;
  property.save((err, rtn) => {
    if (err) throw err;
    res.redirect("/");
  });
  console.log(req.files, req.body);
});

module.exports = router;
