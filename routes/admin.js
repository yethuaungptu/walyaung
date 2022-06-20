var express = require("express");
var router = express.Router();
var Admin = require("../models/Admin");
var Agent = require("../models/Agents");
var Property = require("../models/Property");
var Report = require("../models/Report");
var Ads = require("../models/Ads");
var Instract = require("../models/Instract");
const multer = require("multer");
const upload = multer({ dest: "public/images/uploads/ads" });

const auth = (req, res, next) => {
  if (req.session.admin) {
    Report.find({ status: "new", isDeleted: "0" })
      .sort({ created: -1 })
      .limit(5)
      .select("rtype subject name")
      .exec((err, rtn) => {
        if (err) throw err;
        req.session.admin.report = rtn;
        next();
      });
  } else {
    res.redirect("/admin/login"); // redirect to other page
  }
};

/* GET users listing. */
router.get("/", auth, function (req, res, next) {
  Instract.countDocuments((err, rtn) => {
    if (err) throw err;
    Agent.countDocuments((err2, rtn2) => {
      if (err2) throw err2;
      Property.countDocuments((err3, rtn3) => {
        if (err3) throw err3;
        Property.find({ isDeleted: "0" })
          .sort({ created: -1 })
          .limit(5)
          .select("profile name address price")
          .exec((err4, rtn4) => {
            if (err4) throw err4;
            Agent.find({ isDeleted: "0" })
              .sort({ created: -1 })
              .limit(6)
              .select("imgUrl name role")
              .exec((err5, rtn5) => {
                if (err5) throw err5;
                res.render("admin/index", {
                  inCount: rtn,
                  agentCount: rtn2,
                  propertyCount: rtn3,
                  properties: rtn4,
                  agents: rtn5,
                });
              });
          });
      });
    });
  });
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
      Report.find({ status: "new", isDeleted: "0" })
        .sort({ created: -1 })
        .limit(5)
        .select("rtype subject name")
        .exec((err2, rtn2) => {
          if (err2) throw err2;
          req.session.admin = {
            name: rtn.name,
            email: rtn.email,
            id: rtn._id,
            report: rtn2,
          };
          res.redirect("/admin");
        });
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

router.get("/agentlist", auth, (req, res) => {
  Agent.find((err, rtn) => {
    if (err) throw err;
    res.render("admin/agent-list", { agents: rtn });
  });
});

router.post("/upgradeAcc", auth, (req, res) => {
  let update = {
    updated: Date.now(),
  };
  if (req.body.type == "1") {
    update.type = "preminum";
  } else {
    update.type = "free";
  }
  Agent.findByIdAndUpdate(req.body.id, { $set: update }, (err, rtn) => {
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

router.get("/propertylist", auth, (req, res) => {
  Property.find({})
    .populate("agentId", "name")
    .select("_id name price state city agentId soldout isDeleted")
    .exec((err, rtn) => {
      if (err) throw err;
      res.render("admin/property-list", { properties: rtn });
    });
});

router.post("/updatePro", auth, (req, res) => {
  let update = {
    updated: Date.now(),
    isDeleted: req.body.type,
  };

  Property.findByIdAndUpdate(req.body.id, { $set: update }, (err, rtn) => {
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

router.get("/ads", auth, (req, res) => {
  Ads.findOne({ name: "ads1" }, (err, rtn) => {
    if (err) throw err;
    Ads.findOne({ name: "ads2" }, (err2, rtn2) => {
      if (err2) throw err2;
      res.render("admin/ads", { ads1: rtn, ads2: rtn2 });
    });
  });
});

router.post("/addAds", upload.single("photo"), auth, (req, res) => {
  const ads = new Ads();
  ads.name = req.body.name;
  ads.place = req.body.place;
  if (req.file) ads.adsUrl = "/images/uploads/ads/" + req.file.filename;
  ads.save((err, rtn) => {
    if (err) throw err;
    res.redirect("/admin/ads");
  });
});

router.post("/updateAds", upload.single("uphoto"), auth, (req, res) => {
  const update = {
    adsUrl: "/images/uploads/ads/" + req.file.filename,
  };
  Ads.findOneAndUpdate(
    { name: req.body.uname },
    { $set: update },
    (err, rtn) => {
      if (err) throw err;
      res.redirect("/admin/ads");
    }
  );
});

router.get("/report", auth, (req, res) => {
  Report.find({})
    .sort({ status: -1 })
    .exec((err, rtn) => {
      if (err) throw err;
      res.render("admin/report", { reports: rtn });
    });
});

router.post("/reportSeeMore", auth, (req, res) => {
  Report.findByIdAndUpdate(
    req.body.id,
    { $set: { status: "done", updated: Date.now() } },
    (err, rtn) => {
      if (err) {
        res.json({
          status: "error",
        });
      } else {
        res.json({
          status: "done",
          report: rtn,
        });
      }
    }
  );
});

module.exports = router;
