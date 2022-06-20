var express = require("express");
var router = express.Router();
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const upload = multer({ dest: "public/images/uploads/profile" });
const Agents = require("../models/Agents");
const Property = require("../models/Property");
const Instract = require("../models/Instract");
const Report = require("../models/Report");
const location = require("./location");
const Ads = require("../models/Ads");
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
    .sort({ inserted: -1 })
    .limit(10)
    .select("_id name description profile area price bathRoom bedRoom")
    .exec((err, rtn) => {
      if (err) throw err;
      res.render("index", {
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
  else agent.imgUrl = "/images/default.png";
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
        type: rtn.type,
      };
      res.redirect("/");
    } else {
      res.redirect("/register");
    }
  });
});

router.get("/submit_property", auth, (req, res) => {
  const regions = JSON.stringify(location.getAllLocations());
  let permission = true;
  Property.countDocuments({ agentId: req.session.user.id }, (err, count) => {
    if (err) throw err;
    if (count > 0 && req.session.user.type == "free") permission = false;
    res.render("property-submit", { regions: regions, permission: permission });
  });
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

router.get("/property_detail/:pid", (req, res) => {
  Property.findById(req.params.pid)
    .populate("agentId")
    .exec((err, rtn) => {
      if (err) throw err;
      Property.find({
        state: rtn.state,
        city: rtn.city,
        _id: { $ne: rtn._id },
      })
        .select("profile name price")
        .sort({ created: -1 })
        .limit(4)
        .exec((err2, rtn2) => {
          if (err2) throw err2;
          Ads.findOne({ place: "pdetail" })
            .select("adsUrl")
            .exec((err3, rtn3) => {
              if (err3) throw err3;
              res.render("property-detail", {
                property: rtn,
                smproperty: rtn2,
                ads: rtn3,
              });
            });
        });
    });
});

router.get("/properties", (req, res) => {
  const regions = JSON.stringify(location.getAllLocations());
  let query = {};
  let sorting = { inserted: -1 };
  let sortingType = "date";
  if (req.query) {
    if (req.query.price) {
      const pmax = Number(req.query.price.split(",")[1]);
      const pmin = Number(req.query.price.split(",")[0]);
      const price = { $gt: pmin, $lt: pmax };
      query.price = price;
    }
    if (req.query.state) query.state = req.query.state;
    if (req.query.district) query.district = req.query.district;
    if (req.query.status && req.query.status != "-Status-")
      query.status = req.query.status;
    if (req.query.sortingType) {
      if (req.query.sortingType == "date") {
        sortingType = "date";
        sorting = { inserted: -1 };
      } else {
        sortingType = "price";
        sorting = { price: 1 };
      }
    }
  }
  console.log(query);
  Property.countDocuments(query, (err2, count) => {
    if (err2) throw err2;
    var paging = {
      currpage: Number(req.query.currpage) || 1,
      perpage: Number(req.query.perpage) || 12,
      count: count,
      total: Math.ceil(count / (req.query.perpage || 12)),
      psize: 5,
      skip: {},
    };
    paging.start =
      (Math.ceil(paging.currpage / paging.psize) - 1) * paging.psize + 1;
    paging.end = paging.start + paging.psize - 1;
    if (paging.end > paging.total) paging.end = paging.total;

    paging.skip.next =
      paging.psize * Math.ceil(paging.currpage / paging.psize) + 1;
    paging.skip.prev = paging.skip.next - paging.psize * 2;
    console.log(query);
    Property.find(query)
      .limit(paging.perpage)
      .sort(sorting)
      .skip((paging.currpage - 1) * paging.perpage)
      .select(
        "_id name area price profile bathRoom bedRoom description soldout"
      )
      .exec((err, rtn) => {
        if (err) throw err;
        Ads.findOne({ place: "plist" })
          .select("adsUrl")
          .exec((err3, rtn3) => {
            if (err3) throw err3;
            res.render("property-list", {
              properties: rtn,
              regions: regions,
              sortingType: sortingType,
              paging: paging,
              ads: rtn3,
            });
          });
      });
  });
});

router.get("/modify_property/:id", auth, (req, res) => {
  const regions = JSON.stringify(location.getAllLocations());
  Property.findById(req.params.id, (err, rtn) => {
    if (err) throw err;
    res.render("property-update", { regions: regions, property: rtn });
  });
});

router.post("/modify_property", auth, ppUpload, (req, res) => {
  let update = {
    name: req.body.name,
    price: req.body.price,
    phone: req.body.phone,
    address: req.body.address,
    description: req.body.description,
    status: req.body.pstatus,
    state: req.body.state,
    city: req.body.city,
    area: req.body.area,
    bedRoom: req.body.bedRoom,
    bathRoom: req.body.bathRoom,
    updated: Date.now(),
  };
  if (req.body.subscription) update.subscription = req.body.subscription;
  console.log(req.files);
  if (req.files.profile)
    update.profile = "/images/propertyuploads/" + req.files.profile[0].filename;
  if (req.files.photo) {
    let gallery = [];
    for (let i = 0; i < req.files.photo.length; i++) {
      gallery.push("/images/propertyuploads/" + req.files.photo[i].filename);
    }
    update.gallery = gallery;
  }
  Property.findByIdAndUpdate(req.body.id, { $set: update }, (err, rtn) => {
    if (err) throw err;
    res.redirect("/property_detail/" + req.body.id);
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err, data) => {
    if (err) throw err;
    res.redirect("/");
  });
});

router.get("/myprofile", auth, (req, res) => {
  Agents.findById(req.session.user.id, (err, rtn) => {
    if (err) throw err;
    Instract.find({
      agentId: req.session.user.id,
      status: "new",
      isDeleted: "0",
    })
      .populate("propertyId", "name")
      .exec((err2, rtn2) => {
        if (err2) throw err2;
        Instract.find({
          agentId: req.session.user.id,
          status: "read",
          isDeleted: "0",
        })
          .populate("propertyId", "name")
          .exec((err3, rtn3) => {
            if (err3) throw err3;
            res.render("myprofile", {
              profile: rtn,
              instractNews: rtn2,
              instractReads: rtn3,
            });
          });
      });
  });
});

router.post("/myprofile", auth, upload.single("photo"), (req, res) => {
  let update = {
    name: req.body.name,
    phone: req.body.phone,
    role: req.body.role,
    address: req.body.address,
    description: req.body.desc,
  };
  if (req.file) update.imgUrl = "/images/uploads/profile/" + req.file.filename;
  if (req.body.password != "")
    update.password = bcrypt.hashSync(
      req.body.password,
      bcrypt.genSaltSync(8),
      null
    );
  Agents.findByIdAndUpdate(
    req.session.user.id,
    { $set: update },
    (err, rtn) => {
      if (err) throw err;
      res.redirect("/myprofile");
    }
  );
});

router.get("/myproperties", auth, (req, res) => {
  Property.find({ isDeleted: "0", agentId: req.session.user.id })
    .select("_id name area price profile bathRoom bedRoom description soldout")
    .exec((err, rtn) => {
      if (err) throw err;
      res.render("myproperties", { properties: rtn });
    });
});

router.post("/contactMe", (req, res) => {
  const instract = new Instract();
  instract.name = req.body.name;
  instract.contact = req.body.contact;
  instract.agentId = req.body.agentId;
  instract.propertyId = req.body.propertyId;
  instract.save((err, rtn) => {
    if (err) throw err;
    res.redirect("/property_detail/" + req.body.propertyId);
  });
});

router.post("/changeNoti", auth, (req, res) => {
  let update = {};
  if (req.body.type === "read") {
    update.status = "read";
  } else {
    update.isDeleted = "1";
  }
  Instract.findByIdAndUpdate(req.body.id, { $set: update }, (err, rtn) => {
    if (err) {
      res.json({
        message: "Internal server error",
        status: false,
      });
    } else {
      res.json({
        message: "Update Success",
        status: true,
      });
    }
  });
});

router.get("/delete_property/:id", auth, (req, res) => {
  const update = {
    isDeleted: "1",
    updated: Date.now(),
  };
  Property.findOneAndUpdate(
    { _id: req.params.id, agentId: req.session.user.id },
    { $set: update },
    (err, rtn) => {
      if (err) throw err;
      res.redirect("/myproperties");
    }
  );
});

router.get("/property_soldout/:id", auth, (req, res) => {
  const update = {
    soldout: true,
    updated: Date.now(),
  };
  Property.findOneAndUpdate(
    { _id: req.params.id, agentId: req.session.user.id },
    { $set: update },
    (err, rtn) => {
      if (err) throw err;
      res.redirect("/myproperties");
    }
  );
});

router.get("/property_unsoldout/:id", auth, (req, res) => {
  const update = {
    soldout: false,
    updated: Date.now(),
  };
  Property.findOneAndUpdate(
    { _id: req.params.id, agentId: req.session.user.id },
    { $set: update },
    (err, rtn) => {
      if (err) throw err;
      res.redirect("/myproperties");
    }
  );
});

router.get("/contact", (req, res) => {
  res.render("contact");
});

router.post("/contact", (req, res) => {
  const report = new Report();
  report.name = req.body.name;
  report.rtype = req.body.rtype;
  report.email = req.body.email;
  report.subject = req.body.subject;
  report.message = req.body.message;
  report.save((err, rtn) => {
    if (err) {
      res.json({
        status: "error",
      });
    } else {
      res.json({
        status: "done",
      });
    }
  });
});

module.exports = router;
