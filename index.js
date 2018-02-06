var express = require('express');
var bodyParser = require("body-parser");
var multer = require("multer");
var upload = multer({ dest: "public/uploads/" });

var ejs = require('ejs');
ejs.delimiter = '$';

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

var ads = [];
var favors = [];

app.get("/", function(req, res) {
  res.render('home', {
    ads: ads
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
  var id = ads.length;

  var ad = {
    title: title,
    textarea: textarea,
    price: price,
    photo: photo,
    city: city,
    pseudo: pseudo,
    email: email,
    tel: tel,
    id: id
  }
  ads.push(ad);
  res.redirect(`/annonce/${id}`);
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
  var ad = ads[req.params.id];
  var title = ad.title;
  var textarea = ad.textarea;
  var price = ad.price;
  var photo = ad.photo;
  var city = ad.city;
  var pseudo = ad.pseudo;
  var email = ad.email;
  var tel = ad.tel;
  var isFavors;
  if (favors[req.params.id]) {
    isFavors = true;
  } else {
    isFavors = false;
  }
  res.render('showAd', {
    title: title,
    textarea: textarea,
    price: price,
    photo: photo,
    city: city,
    pseudo: pseudo,
    email: email,
    tel: tel,
    alreadyFav: isFavors
  });
});

app.get("*", function(req, res) {
  res.status(404).send("Page introuvable");
});

app.listen(3030, function() {
  console.log("Server is listening...");
});
