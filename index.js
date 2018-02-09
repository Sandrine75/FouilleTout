var express = require("express");
var expressSession = require("express-session");
var MongoStore = require("connect-mongo")(expressSession);
var passport = require("passport");
var LocalStrategy = require("passport-local");
var FacebookStrategy = require("passport-facebook");
var User = require("./models/user");
var bodyParser = require("body-parser");
var multer = require("multer");
var mongoose = require("mongoose");
var faker = require("faker");
var flash = require('express-flash-messages')

require('dotenv').config()

// MULTER
var upload = multer({ dest: "public/uploads/" });

// EJS
var ejs = require("ejs");
ejs.delimiter = "$";

var app = express();

// MongoDB PRODUCT
mongoose.connect(process.env.MONGODB_URI);
var productSchema = new mongoose.Schema({
  title: String,
  textarea: String,
  price: Number,
  photo: Array,
  city: String,
  pseudo: String,
  email: String,
  tel: String,
  type: String,
  type_user: String,
  user_id: String
});
var Product = mongoose.model("Product", productSchema);

// FIXTURES
faker.locale = "fr";

Product.collection.drop();

function addFixtures() {
  var addToDb = new Product({
    title: faker.commerce.productName(),
    textarea: faker.lorem.paragraph(),
    price: faker.commerce.price(),
    photo: "https://via.placeholder.com/640x480",
    city: faker.address.city(),
    pseudo: faker.name.firstName(),
    email: faker.internet.email(),
    tel: faker.phone.phoneNumber(),
    type: "Offres",
    type_user: "Particulier"
  });
  addToDb.save(function(err, obj) {
    if (!err) {
      console.log("1 fixture saved");
    }
  });
}
function addFixturesProDeman() {
  var addToDb = new Product({
    title: faker.commerce.productName(),
    textarea: faker.lorem.paragraph(),
    price: faker.commerce.price(),
    photo: "https://via.placeholder.com/640x480",
    city: faker.address.city(),
    pseudo: faker.name.firstName(),
    email: faker.internet.email(),
    tel: faker.phone.phoneNumber(),
    type: "Demandes",
    type_user: "Professionel"
  });
  addToDb.save(function(err, obj) {
    if (!err) {
      console.log("1 fixture saved");
    }
  });
}

var times = 30;
for (var i = 0; i < times; i++) {
  addFixtures();
  addFixturesProDeman();
}

// Express
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(
  expressSession({
    secret: "thereactor09",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())


passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); // JSON.stringify
passport.deserializeUser(User.deserializeUser()); // JSON.parse

// Facebook Auth
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK,
      profileFields: ["id", "displayName", "email"]
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOne({ facebookID: profile.id }, function(err, user) {
        if (!user) {
          var user = new User({
            username: profile.displayName,
            facebookID: profile.id,
            email: profile.emails[0].value
          });
          user.save(function(err) {
            if (!err) {
              return cb(err, user);
            }
          });
        } else {
          return cb(err, user);
        }
      });
    }
  )
);

// Routes
app.get("/", function(req, res) {
  var limit = 10;
  Product.count({}, function(err, count) {
    Product.count({ type_user: "Particulier" }, function(err, countPart) {
      Product.count({ type_user: "Professionel" }, function(err, countPro) {
        Product.find({}, function(err, product) {
          Product.find({ type_user: "Particulier" }, function(
            err,
            particuliers
          ) {
            Product.find({ type_user: "Professionel" }, function(
              err,
              professionels
            ) {
              res.render("home", {
                products: product,
                particuliers: particuliers,
                professionels: professionels,
                lengthProd: count,
                lengthPart: countPart,
                lengthPro: countPro,
                queryPage: req.query.page,
                user: req.user
              });
            });
          });
        })
          .limit(limit)
          .skip(Number(req.query.page) * limit - limit)
          .sort({ _id: -1 });
      });
    });
  });
});

app.get("/deposer", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("formAdd", {
      user: req.user
    });
  } else {
    req.flash('notify', 'This is a test notification.')
    res.redirect("/login");
  }
});

app.post("/deposer", upload.array("photo_url[]", 4), function(req, res) {
  if (req.isAuthenticated()) {
    var title = req.body.title_ad;
    var textarea = req.body.textarea_ad;
    var price = req.body.price_ad;
    var photo = req.files;
    var city = req.body.city_ad;
    var pseudo = req.body.pseudo_ad;
    var email = req.body.email_ad;
    var tel = req.body.phone_ad;
    var type = req.body.type_ad;
    var type_user = req.body.type_user;
    var user_id = req.user._id;

    var ad = new Product({
      title: title,
      textarea: textarea,
      price: price,
      city: city,
      pseudo: pseudo,
      email: email,
      tel: tel,
      type: type,
      type_user: type_user,
      user_id: user_id
    });

    if (photo.length > 0) {
      ad.photo = [];
      for (var i = 0; i < photo.length; i++) {
        ad.photo.push(photo[i].filename);
      }
    }

    ad.save(function(err, obj) {
      if (!err) {
        res.redirect("/");
      }
    });
  }
});

app.get("/annonce/:id", function(req, res) {
  Product.find({ _id: req.params.id }, function(err, product) {
    if (product[0]) {
      res.render("showAd", {
        product: product[0],
        user: req.user
      });
    } else {
      res.send("Aucune annonce");
    }
  });
});

app.get("/annonces/demandes", function(req, res) {
  Product.find({ type: "Demandes" }, function(err, obj) {
    res.render("demandes", {
      demandes: obj,
      queryPage: req.query.page,
      user: req.user
    });
  })
    .limit(10)
    .skip(Number(req.query.page) * 10 - 10);
});

app.get("/annonces/offres", function(req, res) {
  Product.find({ type: "Offres" }, function(err, obj) {
    res.render("offres", {
      offres: obj,
      queryPage: req.query.page,
      user: req.user
    });
  })
    .limit(10)
    .skip(Number(req.query.page) * 10 - 10);
});

// authenticate
app.get("/mes-favoris", function(req, res) {
  res.render("favoris", {
    favors: [{ a: 1 }, { b: 2 }]
  });
});

// authenticate just the ad's owner
app.get("/modifier/:id", function(req, res) {
  if (req.isAuthenticated()) {
    Product.find({ _id: req.params.id, user_id: req.user._id }, function(
      err,
      product
    ) {
      if (product[0]) {
        res.render("modifyProduct", {
          product: product[0],
          user: req.user
        });
      } else {
        res.send(
          "Vous devez être le proprietaire de l'annonce pour la modifier"
        );
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/modifier/:id", upload.array("photo_url[]", 4), function(req, res) {
  if (req.isAuthenticated) {
    var title = req.body.title_ad;
    var textarea = req.body.textarea_ad;
    var price = req.body.price_ad;
    var city = req.body.city_ad;
    var pseudo = req.body.pseudo_ad;
    var email = req.body.email_ad;
    var tel = req.body.phone_ad;

    var productModify = {
      title: title,
      textarea: textarea,
      price: price,
      city: city,
      pseudo: pseudo,
      email: email,
      tel: tel
    };

    if (req.files.length > 0) {
      productModify.photo = [];
      for (var i = 0; i < req.files.length; i++) {
        productModify.photo.push(req.files[i].filename);
      }
    }

    Product.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      productModify,
      function(err, product) {
        if (product) {
          res.redirect(`/annonce/${req.params.id}`);
        } else {
          res.send(
            "Vous devez être le proprietaire de l'annonce pour la modifier"
          );
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

// authenticate juste ad's owner
app.get("/supprimer/:id", function(req, res) {
  if (req.isAuthenticated()) {
    Product.findOne({ _id: req.params.id, user_id: req.user._id }, function(
      err,
      product
    ) {
      if (product) {
        Product.deleteOne(
          { _id: req.params.id, user_id: req.user._id },
          function(err) {
            if (!err) {
              res.redirect("/");
            }
          }
        );
      } else {
        res.send(
          "Vous devez être le proprietaire de l'annonce pour la modifier"
        );
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/mon-compte", function(req, res) {
  if (req.isAuthenticated()) {
    Product.find({ user_id: req.user._id }, function(err, product) {
      if (product.length > 0) {
        res.render("myAccount", {
          products: product,
          user: req.user
        });
      } else {
        res.send("Vous n'avez aucune annonce");
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/register", function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    res.render("register", {
      user: req.user
    });
  }
});

app.post("/register", function(req, res) {
  // Créer un utilisateur, en utilisant le model defini
  // Nous aurons besoin de `req.body.username` et `req.body.password`
  User.register(
    new User({
      username: req.body.username
      // D'autres champs peuvent être ajoutés ici
    }),
    req.body.password, // password will be hashed
    function(err, user) {
      if (err) {
        console.log(err);
        return res.render("register", {
          user: req.user
        });
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/");
        });
      }
    }
  );
});

app.get("/login", function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    res.render("login", {
      user: req.user
    });
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
  })
);

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/auth/facebook", passport.authenticate("facebook", {
  scope: ['user_friends', 'email', 'public_profile']
}));

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

// Routes General
app.get("*", function(req, res) {
  res.status(404).send("Page introuvable");
});

// Routes Listen
app.listen(process.env.PORT, function() {
  console.log("Server is listening...");
});
