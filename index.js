var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var mongoose = require("mongoose");
var faker = require("faker");

// MULTER
var upload = multer({ dest: "public/uploads/" });

// EJS
var ejs = require("ejs");
ejs.delimiter = "$";

var app = express();

// MongoDB PRODUCT
mongoose.connect("mongodb://localhost:27017/leboncoin");
var productSchema = new mongoose.Schema({
  title: String,
  textarea: String,
  price: Number,
  photo: String,
  city: String,
  pseudo: String,
  email: String,
  tel: String,
  type: String,
  type_user: String
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
    photo: "http://via.placeholder.com/640x480",
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

var times = 10;
for(var i=0; i < times; i++){
    addFixtures();
}


// Express
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

// Routes
app.get("/", function(req, res) {
  Product.find({}, function(err, product) {
    Product.find({type_user: "Particulier"}, function(err, particuliers) {
      Product.find({type_user: "Professionel"}, function(err, professionels) {
        res.render("home", {
          products: product,
          particuliers: particuliers,
          professionels: professionels
        });
      });
    });
  });
});

app.get("/deposer", function(req, res) {
  res.render("formAdd");
});

app.post("/deposer", upload.single("photo_url"), function(req, res) {
  var title = req.body.title_ad;
  var textarea = req.body.textarea_ad;
  var price = req.body.price_ad;
  var photo = req.file.filename;
  var city = req.body.city_ad;
  var pseudo = req.body.pseudo_ad;
  var email = req.body.email_ad;
  var tel = req.body.phone_ad;
  var type = req.body.type_ad;
  var type_user = req.body.type_user;

  var ad = new Product({
    title: title,
    textarea: textarea,
    price: price,
    photo: photo,
    city: city,
    pseudo: pseudo,
    email: email,
    tel: tel,
    type: type,
    type_user: type_user
  });

  ad.save(function(err, obj) {
    if (!err) {
      res.redirect("/");
    }
  });
});

app.get("/annonce/:id", function(req, res) {
  Product.find({ _id: req.params.id }, function(err, product) {
    if (!err) {
      res.render("showAd", {
        product: product[0]
      });
    }
  });
});

app.get("/annonces/demandes", function(req, res){
  Product.find({type: "Demandes"}, function(err, obj) {
    res.render("demandes", {
      demandes: obj
    })
  });
});

app.get("/annonces/offres", function(req, res){
  Product.find({type: "Offres"}, function(err, obj) {
    res.render("offres", {
      offres: obj
    })
  });
});

app.get('/mes-favoris', function(req, res) {
  res.render('favoris', {
    favors: [{a: 1}, {b: 2}]
  })
});

app.get("/modifier/:id", function(req, res) {
  Product.find({ _id: req.params.id }, function(err, product) {
    res.render("modifyProduct", {
      product: product[0]
    });
  });
});

app.post("/modifier/:id", upload.single("photo_url"), function(req, res) {
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

  if (req.file) {
    productModify.photo = req.file.filename;
  }

  Product.findOneAndUpdate({ _id: req.params.id }, productModify, function(
    err,
    product
  ) {
    if (!err) {
      res.redirect(`/annonce/${req.params.id}`);
    }
  });
});

app.get("/supprimer/:id", function(req, res) {
  Product.deleteOne({ _id: req.params.id }, function(err) {
    if (!err) {
      res.redirect("/");
    }
  });
});

// Routes General
app.get("*", function(req, res) {
  res.status(404).send("Page introuvable");
});

// Routes Listen
app.listen(3030, function() {
  console.log("Server is listening...");
});
