var express = require('express');
var bodyParser = require("body-parser");
var multer = require("multer");
var mongoose = require("mongoose");
var upload = multer({ dest: "public/uploads/" });

// EJS
var ejs = require('ejs');
ejs.delimiter = '$';

var app = express();

// MongoDB
mongoose.connect("mongodb://localhost:27017/leboncoin");
var productSchema = new mongoose.Schema({
  title: String,
  textarea: String,
  price: Number,
  photo: String,
  city: String,
  pseudo: String,
  email: String,
  tel: String
});
var Product = mongoose.model("Product", productSchema);

// Express
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

var ads = [];
var favors = [];

app.get("/", function(req, res) {
  Product.find({}, function(err, product) {
    res.render('home', {
      products: product // [{}, {}]
    });
  });
});

app.get('/deposer', function(req, res) {
  res.render('formAdd');
})

app.post('/deposer', upload.single("photo_url"), function(req, res) {
  var title = req.body.title_ad;
  var textarea = req.body.textarea_ad;
  var price = req.body.price_ad;
  var photo = req.file.filename;
  var city = req.body.city_ad;
  var pseudo = req.body.pseudo_ad;
  var email = req.body.email_ad;
  var tel = req.body.phone_ad;

  var ad = new Product({
    title: title,
    textarea: textarea,
    price: price,
    photo: photo,
    city: city,
    pseudo: pseudo,
    email: email,
    tel: tel
  });

  ad.save(function(err, obj){
    if (!err) {
      res.redirect("/");
    }
  });
})

app.post('/add-favor', function(req, res) {
  var idNumber = Number(req.body.id);
  if (favors[idNumber]) {
    if (favors[idNumber].id !== idNumber) {
      favors.push(ads[idNumber])
    }
  } else {
    favors.push(ads[idNumber]);
  }
   res.send('si ya pas de if');
});

app.get('/mes-favoris', function(req, res) {
  res.render('favoris', {
    favors: favors
  })
});

app.get('/annonce/:id', function(req, res){

  var isFavors;
  if (favors[req.params.id]) {
    isFavors = true;
  } else {
    isFavors = false;
  }
  Product.find({_id: req.params.id}, function(err, product){
    if (!err) {
      res.render('showAd', {
        product: product[0],
        alreadyFav: isFavors
      });
    }
  })
});

app.get('/modifier/:id', function(req, res) {
  Product.find({_id: req.params.id}, function(err, product) {
    res.render('modifyProduct', {
      product: product[0]
    })
  });
});

app.post('/modifier/:id', upload.single("photo_url"), function(req, res) {
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
    tel: tel,
  }

  if (req.file) {
    productModify.photo = req.file.filename;
  }

  Product.findOneAndUpdate({_id: req.params.id}, productModify, function(err, product) {
    if (!err) {
      res.redirect(`/annonce/${req.params.id}`);
    }
  });
});


app.get('/supprimer/:id', function(req, res) {
  Product.deleteOne({ _id: req.params.id }, function (err) {
    if (!err) {
      res.redirect('/');
    }
  });
});

app.get("*", function(req, res) {
  res.status(404).send("Page introuvable");
});

app.listen(3030, function() {
  console.log("Server is listening...");
});
